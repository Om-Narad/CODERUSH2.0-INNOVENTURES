import React, { useEffect, useRef, useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { NAGPUR_RIVERS } from '../data/mockData';
import {
  Layers,
  Box,
  Droplet,
  RotateCcw,
  Maximize2,
  Minimize2,
  Shield,
  Activity,
  MapPin,
  Eye,
} from 'lucide-react';

// MapLibre Dynamic Importer helper
function getMapLibre() {
  if (typeof window !== 'undefined' && window.maplibregl) {
    return window.maplibregl;
  }
  try {
    return require('maplibre-gl');
  } catch (e) {
    return null;
  }
}

// GeoJSON formatting helpers for 3D MapLibre layers
function zonesToGeoJSON(zones, surgeLevel) {
  return {
    type: 'FeatureCollection',
    features: (zones || []).map(zone => {
      // Calculate expanded coordinates when flood level surge increases
      const expansion = (surgeLevel || 0) * 0.0008;
      const coords = (zone.geometry || []).map(([lat, lng], idx) => {
        const dLat = (idx % 2 === 0 ? 1 : -1) * expansion;
        const dLng = (idx % 2 === 1 ? 1 : -1) * expansion;
        return [lng + dLng, lat + dLat];
      });
      if (coords.length > 0) {
        coords.push(coords[0]); // Close ring
      }

      return {
        type: 'Feature',
        id: zone.id,
        properties: {
          id: zone.id,
          name: zone.name,
          priority: zone.priority,
          severity: zone.severity,
          severityColor: zone.severityColor,
          housesExposed: zone.housesExposed || Math.round(zone.peopleExposed / 5),
          peopleExposed: zone.peopleExposed,
          height: 15 + Math.min(zone.priority * 0.6, 60), // Extrusion height for 3D
        },
        geometry: {
          type: 'Polygon',
          coordinates: [coords],
        },
      };
    }),
  };
}

function riversToGeoJSON(rivers) {
  return {
    type: 'FeatureCollection',
    features: (rivers || []).map(river => ({
      type: 'Feature',
      id: river.id,
      properties: {
        id: river.id,
        name: river.name,
        color: river.color,
        waterSurgeMeters: river.waterSurgeMeters,
      },
      geometry: {
        type: 'LineString',
        coordinates: river.coordinates,
      },
    })),
  };
}

function roadsToGeoJSON(roads) {
  return {
    type: 'FeatureCollection',
    features: (roads || []).map(road => ({
      type: 'Feature',
      id: road.id,
      properties: {
        id: road.id,
        name: road.name,
        status: road.status,
        isBlocked: road.status === 'blocked',
      },
      geometry: {
        type: 'LineString',
        coordinates: (road.geometry || []).map(([lat, lng]) => [lng, lat]),
      },
    })),
  };
}

// 3D MapLibre Style Builders
function get3DMapStyle(styleType) {
  let rasterTile = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  let attribution = '© Esri Satellite';

  if (styleType === 'tactical-dark') {
    rasterTile = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    attribution = '© CartoDB Dark';
  } else if (styleType === 'vector-light') {
    rasterTile = 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
    attribution = '© CartoDB Light';
  }

  return {
    version: 8,
    name: `Nagpur 3D - ${styleType}`,
    sources: {
      'base-tiles': {
        type: 'raster',
        tiles: [rasterTile],
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
      'terrain-dem': {
        type: 'raster-dem',
        tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: 'base-layer',
        type: 'raster',
        source: 'base-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

// Helper Leaflet Map Auto-Updater
function LeafletMapAutoUpdater({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, zoom);
  }, [map, center, zoom]);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 150);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

export default function Nagpur3DMap({ height = '480px' }) {
  const {
    zones,
    roads,
    currentRegionMeta,
    selectedZoneId,
    setSelectedZoneId,
    toggleRoadStatus,
    setCurrentView,
  } = useSentinel();

  const nagpurCenter = currentRegionMeta?.center || [21.1458, 79.0882];

  // 3D Viewport Controls State
  const [mapMode, setMapMode] = useState('3d'); // '3d' | '2d'
  const [mapStyle, setMapStyle] = useState('satellite-3d'); // 'satellite-3d' | 'tactical-dark' | 'vector-light'
  const [pitch, setPitch] = useState(55); // 0 to 75
  const [bearing, setBearing] = useState(-20);
  const [surgeLevel, setSurgeLevel] = useState(1.4); // Flood surge slider (meters)
  const [show3dBuildings, setShow3dBuildings] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize MapLibre 3D WebGL Canvas
  useEffect(() => {
    if (mapMode !== '3d') return;
    if (!containerRef.current) return;

    let maplib = getMapLibre();
    if (!maplib) {
      setMapMode('2d');
      return;
    }

    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = new maplib.Map({
        container: containerRef.current,
        style: get3DMapStyle(mapStyle),
        center: [nagpurCenter[1], nagpurCenter[0]],
        zoom: 12.2,
        pitch: pitch,
        bearing: bearing,
        antialias: true,
      });

      mapRef.current = map;

      map.on('load', () => {
        try {
          // Terrain Elevation exaggeration
          map.setTerrain({ source: 'terrain-dem', exaggeration: 2.2 });

          // 1. Add Zone Hazard Polygons
          map.addSource('zones-3d', {
            type: 'geojson',
            data: zonesToGeoJSON(zones, surgeLevel),
          });

          // 3D Building / Zone Extrusion Layer
          map.addLayer({
            id: 'zones-extrusion',
            type: 'fill-extrusion',
            source: 'zones-3d',
            layout: { visibility: show3dBuildings ? 'visible' : 'none' },
            paint: {
              'fill-extrusion-color': ['get', 'severityColor'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.65,
            },
          });

          // Flat hazard boundary lines
          map.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones-3d',
            paint: {
              'line-color': ['get', 'severityColor'],
              'line-width': 3,
              'line-opacity': 0.9,
            },
          });

          // 2. Add Nag & Pili River Flows
          map.addSource('rivers-3d', {
            type: 'geojson',
            data: riversToGeoJSON(NAGPUR_RIVERS),
          });

          map.addLayer({
            id: 'rivers-glow',
            type: 'line',
            source: 'rivers-3d',
            layout: { visibility: showRivers ? 'visible' : 'none' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 8,
              'line-opacity': 0.4,
              'line-blur': 4,
            },
          });

          map.addLayer({
            id: 'rivers-core',
            type: 'line',
            source: 'rivers-3d',
            layout: { visibility: showRivers ? 'visible' : 'none' },
            paint: {
              'line-color': '#38bdf8',
              'line-width': 4,
              'line-opacity': 0.95,
            },
          });

          // 3. Add Nagpur Roads
          map.addSource('roads-3d', {
            type: 'geojson',
            data: roadsToGeoJSON(roads),
          });

          map.addLayer({
            id: 'roads-line',
            type: 'line',
            source: 'roads-3d',
            paint: {
              'line-color': [
                'case',
                ['get', 'isBlocked'], '#ef4444',
                '#06b6d4'
              ],
              'line-width': [
                'case',
                ['get', 'isBlocked'], 5,
                3.5
              ],
              'line-dasharray': [
                'case',
                ['get', 'isBlocked'], ['literal', [2, 2]],
                ['literal', [1, 0]]
              ],
            },
          });

          // Click Handlers
          map.on('click', 'zones-extrusion', (e) => {
            if (e.features && e.features[0]) {
              const zoneId = e.features[0].properties.id;
              setSelectedZoneId(zoneId);
            }
          });

          map.on('click', 'roads-line', (e) => {
            if (e.features && e.features[0]) {
              const roadId = e.features[0].properties.id;
              toggleRoadStatus(roadId);
            }
          });

          // Mouseover Tooltips
          map.on('mousemove', 'zones-extrusion', (e) => {
            if (e.features && e.features[0]) {
              map.getCanvas().style.cursor = 'pointer';
              const p = e.features[0].properties;
              setHoveredFeature({
                type: 'zone',
                name: p.name,
                housesExposed: p.housesExposed,
                peopleExposed: p.peopleExposed,
                priority: p.priority,
                severityColor: p.severityColor,
              });
            }
          });

          map.on('mouseleave', 'zones-extrusion', () => {
            map.getCanvas().style.cursor = '';
            setHoveredFeature(null);
          });

        } catch (err) {
          console.warn('[Nagpur3DMap] Layer setup warning:', err);
        }
      });
    } catch (err) {
      console.error('[Nagpur3DMap] MapLibre fallback to 2D:', err);
      setMapMode('2d');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapMode, mapStyle]);

  // Handle Dynamic Pitch & Surge Level updates on existing map instance
  useEffect(() => {
    if (mapRef.current && mapMode === '3d') {
      mapRef.current.setPitch(pitch);
      mapRef.current.setBearing(bearing);
    }
  }, [pitch, bearing, mapMode]);

  useEffect(() => {
    if (mapRef.current && mapMode === '3d') {
      const src = mapRef.current.getSource('zones-3d');
      if (src) {
        src.setData(zonesToGeoJSON(zones, surgeLevel));
      }
    }
  }, [surgeLevel, zones, mapMode]);

  useEffect(() => {
    if (mapRef.current && mapMode === '3d') {
      if (mapRef.current.getLayer('zones-extrusion')) {
        mapRef.current.setLayoutProperty(
          'zones-extrusion',
          'visibility',
          show3dBuildings ? 'visible' : 'none'
        );
      }
    }
  }, [show3dBuildings, mapMode]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-lg bg-slate-900 flex flex-col" style={{ height }}>
      
      {/* ── Top Floating Toolbar (Mode, Styles, Camera controls) ───────────── */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Pills: Mode Switcher & 3D Pitch Controls */}
        <div className="flex items-center space-x-1.5 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto text-xs text-white">
          <button
            onClick={() => setMapMode('3d')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapMode === '3d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Nagpur Map</span>
          </button>

          <button
            onClick={() => setMapMode('2d')}
            className={`flex items-center space-x-1 px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
              mapMode === '2d'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>2D Tactical</span>
          </button>

          {mapMode === '3d' && (
            <div className="flex items-center space-x-1 pl-2 border-l border-slate-700/80">
              <span className="text-[10px] text-slate-400 font-mono-numeric uppercase px-1">Tilt:</span>
              <button
                onClick={() => setPitch(0)}
                className={`px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-800 ${pitch === 0 ? 'text-cyan-400 font-bold bg-slate-800' : 'text-slate-400'}`}
                title="Top-down 0°"
              >
                0°
              </button>
              <button
                onClick={() => setPitch(35)}
                className={`px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-800 ${pitch === 35 ? 'text-cyan-400 font-bold bg-slate-800' : 'text-slate-400'}`}
                title="Isometric 35°"
              >
                35°
              </button>
              <button
                onClick={() => setPitch(55)}
                className={`px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-800 ${pitch === 55 ? 'text-cyan-400 font-bold bg-slate-800' : 'text-slate-400'}`}
                title="3D Perspective 55°"
              >
                55°
              </button>
              <button
                onClick={() => setPitch(75)}
                className={`px-1.5 py-0.5 rounded text-[11px] hover:bg-slate-800 ${pitch === 75 ? 'text-cyan-400 font-bold bg-slate-800' : 'text-slate-400'}`}
                title="Cinematic Horizon 75°"
              >
                75°
              </button>
            </div>
          )}
        </div>

        {/* Right Pills: Map Style & Layer Toggles */}
        <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md p-1 rounded-xl border border-slate-700/60 shadow-xl pointer-events-auto text-xs text-white">
          
          <button
            onClick={() => setShow3dBuildings(!show3dBuildings)}
            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
              show3dBuildings ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
            title="Toggle 3D Buildings Extrusions"
          >
            3D Footprints
          </button>

          <select
            value={mapStyle}
            onChange={(e) => setMapStyle(e.target.value)}
            className="bg-slate-800 text-slate-200 rounded-lg px-2 py-1 text-xs border border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="satellite-3d">🛰️ 3D Satellite</option>
            <option value="tactical-dark">🌃 Dark Command</option>
            <option value="vector-light">☀️ Light Vector</option>
          </select>

          <button
            onClick={() => setCurrentView('map')}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Expand to Fullscreen Map"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>

      {/* ── Central Interactive Map Viewport (3D or 2D) ────────────────────── */}
      <div className="flex-1 w-full relative overflow-hidden">
        {mapMode === '3d' ? (
          <div ref={containerRef} className="w-full h-full bg-slate-950" />
        ) : (
          <MapContainer
            center={nagpurCenter}
            zoom={12}
            zoomControl={true}
            scrollWheelZoom={true}
            className="h-full w-full bg-slate-100"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              attribution="© CartoDB"
            />
            <LeafletMapAutoUpdater center={nagpurCenter} zoom={12} />

            {/* Nag & Pili Rivers on 2D Map */}
            {NAGPUR_RIVERS.map(river => (
              <Polyline
                key={river.id}
                positions={river.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{ color: river.color, weight: 6, opacity: 0.8 }}
              />
            ))}

            {/* Roads */}
            {roads.map(road => (
              <Polyline
                key={road.id}
                positions={road.geometry}
                eventHandlers={{ click: () => toggleRoadStatus(road.id) }}
                pathOptions={{
                  color: road.status === 'blocked' ? '#ef4444' : '#06b6d4',
                  weight: road.status === 'blocked' ? 5 : 3.5,
                  dashArray: road.status === 'blocked' ? '6, 6' : null,
                }}
              />
            ))}

            {/* Hazard Zones */}
            {zones.map(zone => (
              <Polygon
                key={zone.id}
                positions={zone.geometry}
                eventHandlers={{ click: () => setSelectedZoneId(zone.id) }}
                pathOptions={{
                  color: zone.severityColor,
                  fillColor: zone.severityColor,
                  fillOpacity: zone.severity === 'red' ? 0.38 : 0.22,
                  weight: selectedZoneId === zone.id ? 4 : 2,
                }}
              >
                <Popup>
                  <div className="p-1 font-sans text-xs">
                    <strong className="text-slate-900 block">{zone.name}</strong>
                    <div className="text-slate-600 mt-0.5">
                      Exposed Houses: <strong>{zone.housesExposed}</strong>
                    </div>
                    <div className="text-slate-500 mt-0.5">
                      Assigned: <strong>{zone.assignedSquad}</strong>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            ))}
          </MapContainer>
        )}
      </div>

      {/* ── Hover Tooltip Card Overlay ────────────────────────────────────── */}
      {hoveredFeature && (
        <div className="absolute top-16 left-4 z-20 bg-slate-900/95 border border-slate-700/80 text-white p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs pointer-events-none max-w-xs space-y-1">
          <div className="font-extrabold text-sm text-cyan-300">{hoveredFeature.name}</div>
          <div className="flex items-center space-x-2 text-slate-300">
            <span>Risk Priority:</span>
            <span className="px-2 py-0.5 rounded text-black font-black" style={{ backgroundColor: hoveredFeature.severityColor }}>
              {hoveredFeature.priority} / 100
            </span>
          </div>
          <div className="text-slate-300 font-mono-numeric">
            🏠 <strong>{hoveredFeature.housesExposed?.toLocaleString()}</strong> Houses Exposed ({hoveredFeature.peopleExposed?.toLocaleString()} Residents)
          </div>
        </div>
      )}

      {/* ── Bottom Interactive Flood Surge Elevation Controller ───────────── */}
      <div className="absolute bottom-3 left-3 right-3 z-20 bg-slate-900/95 border border-slate-700/80 p-3 rounded-2xl backdrop-blur-md text-white shadow-2xl flex flex-col md:flex-row items-center justify-between gap-3">
        
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Droplet className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-extrabold tracking-wider uppercase text-cyan-400">
                Nag River Live Flood Surge Simulator
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                +{surgeLevel.toFixed(1)}m Water Surge
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Drag slider to simulate real-time inundation surge across Manish Nagar &amp; Somalwada sectors
            </p>
          </div>
        </div>

        {/* Surge Slider */}
        <div className="flex items-center space-x-3 w-full md:w-72">
          <span className="text-[11px] text-slate-400 font-mono font-bold">0.0m</span>
          <input
            type="range"
            min="0.0"
            max="4.5"
            step="0.1"
            value={surgeLevel}
            onChange={(e) => setSurgeLevel(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 cursor-pointer h-2 bg-slate-800 rounded-lg"
          />
          <span className="text-[11px] text-rose-400 font-mono font-bold">+4.5m</span>
        </div>

        {/* Quick Reset */}
        <button
          onClick={() => setSurgeLevel(1.4)}
          className="flex items-center space-x-1 text-[11px] text-slate-400 hover:text-white px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>

      </div>

    </div>
  );
}
