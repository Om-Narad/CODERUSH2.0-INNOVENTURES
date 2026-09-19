import React, { useEffect, useRef, useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { NAGPUR_RIVERS, NAGPUR_AREA_LABELS, NAGPUR_DEM_INFO } from '../data/mockData';
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
  Sliders,
  Sun,
  Moon,
  Compass
} from 'lucide-react';

// Custom Leaflet Area Name Label Icon Builder
const createAreaLabelIcon = (name, category) => {
  return L.divIcon({
    className: 'nagpur-area-label-badge',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 5px;
        background: rgba(15, 23, 42, 0.92);
        color: #ffffff;
        border: 1.5px solid rgba(56, 189, 248, 0.7);
        padding: 4px 10px;
        border-radius: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 700;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.5);
        backdrop-filter: blur(6px);
        transform: translate(-50%, -50%);
        pointer-events: auto;
      ">
        <span style="
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #38bdf8;
          box-shadow: 0 0 8px #38bdf8;
          flex-shrink: 0;
        "></span>
        <span style="letter-spacing: 0.3px;">${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// GeoJSON formatting helpers for 3D MapLibre layers
function zonesToGeoJSON(zones, surgeLevel) {
  return {
    type: 'FeatureCollection',
    features: (zones || []).map(zone => {
      const expansion = (surgeLevel || 0) * 0.0006;
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
          height: 25 + Math.min((zone.priority || 50) * 0.8, 80), // Extrusion height for 3D
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

// 3D MapLibre Style Builders with Copernicus 30m DEM
function get3DMapStyle() {
  const rasterTiles = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
  const attribution = '© Esri World Imagery, Copernicus DEM 30m OpenTopography';

  return {
    version: 8,
    name: 'Nagpur 3D Photorealistic',
    sources: {
      'base-tiles': {
        type: 'raster',
        tiles: rasterTiles,
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
      'label-tiles': {
        type: 'raster',
        tiles: ['https://a.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png'],
        tileSize: 256,
        maxzoom: 19,
      },
      'terrain-dem': {
        type: 'raster-dem',
        tiles: [
          '/api/dem/tile/{z}/{x}/{y}.png',
          '/dem-tiles/{z}/{x}/{y}.png'
        ],
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
      {
        id: 'labels-layer',
        type: 'raster',
        source: 'label-tiles',
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

export default function Nagpur3DMap({ height = '520px' }) {
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

  // Map State & Controls
  const [mapMode, setMapMode] = useState('3d'); // '3d' | '2d'
  const [pitch, setPitch] = useState(55);
  const [bearing, setBearing] = useState(-15);
  const [surgeLevel, setSurgeLevel] = useState(1.4);
  const [demExaggeration, setDemExaggeration] = useState(2.5);
  const [show3dBuildings, setShow3dBuildings] = useState(true);
  const [showRivers, setShowRivers] = useState(true);

  const containerRef = useRef(null);
  const mapRef = useRef(null);

  // Initialize MapLibre 3D WebGL Canvas
  useEffect(() => {
    if (mapMode !== '3d') return;
    if (!containerRef.current) return;

    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = new maplibregl.Map({
        container: containerRef.current,
        style: get3DMapStyle(),
        center: [nagpurCenter[1], nagpurCenter[0]],
        zoom: 12.4,
        pitch: pitch,
        bearing: bearing,
        antialias: true,
      });

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

      map.on('load', () => {
        try {
          // Terrain Elevation exaggeration using Copernicus 30m DEM
          map.setTerrain({ source: 'terrain-dem', exaggeration: demExaggeration });

          // Add Nagpur Area Name Markers on 3D Map
          NAGPUR_AREA_LABELS.forEach((area) => {
            const el = document.createElement('div');
            el.className = 'nagpur-3d-area-pill';
            el.style.cssText = `
              display: flex;
              align-items: center;
              gap: 5px;
              background: rgba(15, 23, 42, 0.92);
              color: #ffffff;
              border: 1.5px solid rgba(56, 189, 248, 0.7);
              padding: 3px 9px;
              border-radius: 20px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              backdrop-filter: blur(4px);
              cursor: pointer;
            `;
            el.innerHTML = `
              <span style="width: 6px; height: 6px; border-radius: 50%; background: #38bdf8; box-shadow: 0 0 6px #38bdf8;"></span>
              <span>${area.name}</span>
            `;

            new maplibregl.Marker({ element: el })
              .setLngLat([area.lng, area.lat])
              .addTo(map);
          });

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
              'fill-extrusion-opacity': 0.7,
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
            },
          });

          // 2. Add Nagpur Rivers Layer
          map.addSource('rivers-3d', {
            type: 'geojson',
            data: riversToGeoJSON(NAGPUR_RIVERS),
          });

          map.addLayer({
            id: 'rivers-line',
            type: 'line',
            source: 'rivers-3d',
            layout: { visibility: showRivers ? 'visible' : 'none' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 5,
              'line-blur': 1,
            },
          });

          // 3. Add Nagpur Roads Layer
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
                ['get', 'isBlocked'],
                '#ef4444', // Red for blocked roads
                '#10b981', // Green for open roads
              ],
              'line-width': ['case', ['get', 'isBlocked'], 5, 3.5],
              'line-dasharray': ['case', ['get', 'isBlocked'], [2, 1], [1, 0]],
            },
          });

          // Interactive click popups on 3D zone extrusions
          map.on('click', 'zones-extrusion', (e) => {
            if (e.features && e.features[0]) {
              const props = e.features[0].properties;
              setSelectedZoneId(props.id);

              new maplibregl.Popup()
                .setLngLat(e.lngLat)
                .setHTML(`
                  <div style="font-family: sans-serif; padding: 4px;">
                    <strong style="color: #0f172a; font-size: 13px;">${props.name}</strong><br/>
                    <span style="font-size: 11px; color: ${props.severityColor}; font-weight: bold;">
                      Priority Score: ${props.priority} (${props.severity?.toUpperCase()})
                    </span><br/>
                    <span style="font-size: 11px; color: #64748b;">
                      Exposed Population: ${Number(props.peopleExposed).toLocaleString()} residents
                    </span>
                  </div>
                `)
                .addTo(map);
            }
          });

          map.on('mouseenter', 'zones-extrusion', () => {
            map.getCanvas().style.cursor = 'pointer';
          });
          map.on('mouseleave', 'zones-extrusion', () => {
            map.getCanvas().style.cursor = '';
          });

        } catch (err) {
          console.warn('[Nagpur3DMap] 3D layer setup warning:', err);
        }
      });

    } catch (e) {
      console.error('[Nagpur3DMap] MapLibre 3D error:', e);
      setMapMode('2d');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapMode, surgeLevel, show3dBuildings, showRivers]);

  // Update pitch/bearing/terrain exaggeration dynamically
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setPitch(pitch);
      mapRef.current.setBearing(bearing);
      try {
        mapRef.current.setTerrain({ source: 'terrain-dem', exaggeration: demExaggeration });
      } catch (e) {}
    }
  }, [pitch, bearing, demExaggeration]);

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md bg-slate-900 font-sans" style={{ height }}>
      
      {/* ─── Top Control Toolbar Bar ────────────────────────────────────────── */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        
        {/* Left Badge & Mode Switcher */}
        <div className="pointer-events-auto flex items-center space-x-1.5 bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-1 shadow-lg text-xs">
          {/* 3D Button */}
          <button
            onClick={() => setMapMode('3d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mapMode === '3d'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Box className="w-3.5 h-3.5" />
            <span>3D Photorealistic</span>
          </button>

          {/* 2D Detailed Map Button */}
          <button
            onClick={() => setMapMode('2d')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              mapMode === '2d'
                ? 'bg-white text-slate-900 shadow-md border border-slate-200'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-cyan-600" />
            <span>2D Detailed Map</span>
          </button>
        </div>

        {/* DEM Elevation Status Badge */}
        <div className="pointer-events-auto flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md border border-emerald-500/40 rounded-xl px-3.5 py-1.5 shadow-lg text-xs text-emerald-300">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="font-bold font-mono tracking-wide">Copernicus 30m DEM Active</span>
          <span className="text-[10px] text-emerald-400/90 font-mono">(265.8m – 399.4m Elev)</span>
        </div>

      </div>

      {/* ─── 3D Map View Container ─────────────────────────────────────────── */}
      {mapMode === '3d' && (
        <div ref={containerRef} className="w-full h-full relative" />
      )}

      {/* ─── 2D Leaflet Map Container ───────────────────────────────────────── */}
      {mapMode === '2d' && (
        <MapContainer
          center={nagpurCenter}
          zoom={12.5}
          scrollWheelZoom={true}
          className="w-full h-full z-0"
        >
          <LeafletMapAutoUpdater center={nagpurCenter} zoom={12.5} />

          {/* High Detail Basemap Tile Layer */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution="© CartoDB Voyager, OpenStreetMap contributors"
            maxZoom={19}
          />

          {/* Street & Area Labels Overlay */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
            attribution="© CartoDB Labels"
            maxZoom={19}
          />

          {/* Render Major Nagpur Area Labels */}
          {NAGPUR_AREA_LABELS.map((area) => (
            <Marker
              key={area.id}
              position={[area.lat, area.lng]}
              icon={createAreaLabelIcon(area.name, area.category)}
            >
              <Popup>
                <div className="font-sans text-xs p-0.5">
                  <strong className="text-slate-900 text-sm">{area.name}</strong>
                  <div className="text-cyan-700 font-semibold mt-0.5">{area.category}</div>
                  <div className="text-slate-500 text-[11px]">Nagpur City Sector</div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Render Nagpur Flood Risk Polygons */}
          {zones.map((zone) => {
            const isSelected = selectedZoneId === zone.id;
            return (
              <Polygon
                key={zone.id}
                positions={zone.geometry}
                pathOptions={{
                  color: zone.severityColor || '#3b82f6',
                  fillColor: zone.severityColor || '#3b82f6',
                  fillOpacity: isSelected ? 0.65 : 0.38,
                  weight: isSelected ? 4 : 2,
                }}
                eventHandlers={{
                  click: () => setSelectedZoneId(zone.id),
                }}
              >
                <Popup>
                  <div className="font-sans p-1 text-slate-800">
                    <h3 className="font-bold text-sm text-slate-900">{zone.name}</h3>
                    <div className="text-xs mt-1 space-y-0.5">
                      <div className="flex items-center space-x-1 font-bold" style={{ color: zone.severityColor }}>
                        <span>Priority Score: {zone.priority} ({zone.severity?.toUpperCase()})</span>
                      </div>
                      <div>Exposed Population: <strong>{zone.peopleExposed?.toLocaleString()}</strong></div>
                      <div>Assigned Squad: <strong>{zone.assignedSquad}</strong></div>
                      <div className="text-[11px] text-slate-500 mt-1">{zone.rationale}</div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            );
          })}

          {/* Render Nagpur Rivers Channels */}
          {showRivers &&
            NAGPUR_RIVERS.map((river) => (
              <Polyline
                key={river.id}
                positions={river.coordinates.map(([lng, lat]) => [lat, lng])}
                pathOptions={{
                  color: river.color,
                  weight: 5,
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div className="font-sans text-xs">
                    <strong>{river.name}</strong><br />
                    Water Surge: +{river.waterSurgeMeters}m
                  </div>
                </Popup>
              </Polyline>
            ))}

          {/* Render Nagpur Roads Network */}
          {roads.map((road) => {
            const isBlocked = road.status === 'blocked';
            return (
              <Polyline
                key={road.id}
                positions={road.geometry}
                pathOptions={{
                  color: isBlocked ? '#ef4444' : '#10b981',
                  weight: isBlocked ? 5 : 3.5,
                  dashArray: isBlocked ? '6, 6' : null,
                  opacity: 0.9,
                }}
                eventHandlers={{
                  click: () => toggleRoadStatus(road.id),
                }}
              >
                <Popup>
                  <div className="font-sans text-xs">
                    <strong>{road.name}</strong><br />
                    Type: {road.type}<br />
                    Status: <span style={{ color: isBlocked ? '#ef4444' : '#10b981', fontWeight: 'bold' }}>
                      {road.status?.toUpperCase()}
                    </span><br />
                    <button
                      onClick={() => toggleRoadStatus(road.id)}
                      style={{
                        marginTop: '4px',
                        padding: '2px 8px',
                        background: '#0ea5e9',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '11px',
                        fontWeight: 'bold',
                      }}
                    >
                      Toggle Block Status
                    </button>
                  </div>
                </Popup>
              </Polyline>
            );
          })}
        </MapContainer>
      )}

      {/* ─── Bottom Floating 3D Controls Dock ────────────────────────────────── */}
      {mapMode === '3d' && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-none flex flex-wrap items-center justify-between gap-3">
          
          {/* Tilt & Rotation Controls */}
          <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl flex items-center space-x-3 text-xs text-slate-300">
            <div className="flex items-center space-x-1.5">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Tilt: <strong>{pitch}°</strong></span>
              <input
                type="range"
                min="0"
                max="70"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-20 accent-cyan-500 cursor-pointer"
              />
            </div>

            <div className="w-px h-4 bg-slate-800" />

            <div className="flex items-center space-x-1.5">
              <span>Rotate: <strong>{bearing}°</strong></span>
              <button
                onClick={() => setBearing((prev) => (prev - 45) % 360)}
                className="p-1 rounded bg-slate-900 border border-slate-700 hover:text-cyan-300 transition-colors"
                title="Rotate 45°"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="w-px h-4 bg-slate-800" />

            <div className="flex items-center space-x-1.5">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>3D Terrain Height: <strong className="text-emerald-300">{demExaggeration.toFixed(1)}x</strong></span>
              <input
                type="range"
                min="0.5"
                max="5.0"
                step="0.1"
                value={demExaggeration}
                onChange={(e) => setDemExaggeration(Number(e.target.value))}
                className="w-20 accent-emerald-500 cursor-pointer"
                title="Adjust Copernicus 30m DEM Terrain Elevation Exaggeration"
              />
            </div>
          </div>

          {/* Flood Surge Simulator Slider */}
          <div className="pointer-events-auto bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-xl p-2.5 shadow-xl flex items-center space-x-2 text-xs text-slate-300">
            <Droplet className="w-4 h-4 text-cyan-400 animate-bounce" />
            <span className="font-mono text-[11px]">Surge Level: <strong className="text-cyan-300">+{surgeLevel.toFixed(1)}m</strong></span>
            <input
              type="range"
              min="0.5"
              max="3.5"
              step="0.1"
              value={surgeLevel}
              onChange={(e) => setSurgeLevel(Number(e.target.value))}
              className="w-24 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      )}
    </div>
  );
}
