import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useSentinel } from '../context/SentinelContext';
import PriorityActionFeed from './PriorityActionFeed';
import { DENSITY_HEATMAP_POINTS, NAGPUR_RIVERS } from '../data/mockData';
import {
  AlertTriangle,
  PanelRightClose,
  PanelRightOpen,
  Info,
  Siren,
  ShieldAlert,
  Box,
  Layers,
  MapPin,
  Compass,
  RotateCcw,
  Eye,
  Sliders,
  Check,
  Maximize2
} from 'lucide-react';

// ─── GeoJSON Helpers ──────────────────────────────────────────────────────────

function zonesToGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: (zones || []).map(zone => ({
      type: 'Feature',
      id: zone.id,
      properties: {
        id: zone.id,
        name: zone.name,
        priority: zone.priority,
        severity: zone.severity,
        severityColor: zone.severityColor,
        peopleExposed: zone.peopleExposed,
        rationale: zone.rationale,
        roadsOpen: zone.roadsOpen,
        totalRoads: zone.totalRoads,
        height: 25 + Math.min((zone.priority || 50) * 0.8, 80), // 3D height extrusion
      },
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            ...(zone.geometry || []).map(([lat, lng]) => [lng, lat]),
            zone.geometry && zone.geometry[0] ? [zone.geometry[0][1], zone.geometry[0][0]] : undefined,
          ].filter(Boolean),
        ],
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
        type: road.type,
        isBlocked: road.status === 'blocked',
      },
      geometry: {
        type: 'LineString',
        coordinates: (road.geometry || []).map(([lat, lng]) => [lng, lat]),
      },
    })),
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
      },
      geometry: {
        type: 'LineString',
        coordinates: river.coordinates,
      },
    })),
  };
}

// ─── MapLibre Style Definition ────────────────────────────────────────────────

function buildMapStyle(styleType) {
  let rasterTiles = ['https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png'];
  let attribution = '© CartoDB Voyager, OpenStreetMap';

  if (styleType === 'satellite') {
    rasterTiles = ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'];
    attribution = '© Esri World Imagery';
  } else if (styleType === 'dark') {
    rasterTiles = ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'];
    attribution = '© CartoDB Dark';
  } else if (styleType === 'light') {
    rasterTiles = ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'];
    attribution = '© CartoDB Positron';
  }

  return {
    version: 8,
    name: 'Nagpur Flood Safe 3D',
    sources: {
      'base-tiles': {
        type: 'raster',
        tiles: rasterTiles,
        tileSize: 256,
        attribution,
        maxzoom: 19,
      },
      terrain: {
        type: 'raster-dem',
        tiles: [
          '/dem-tiles/{z}/{x}/{y}.png',
          '/api/dem/tile/{z}/{x}/{y}.png'
        ],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
      },
    },
    layers: [
      {
        id: 'base-raster',
        type: 'raster',
        source: 'base-tiles',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

// Leaflet Map Auto-Updater
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

export default function FullMapView() {
  const {
    zones,
    roads,
    currentRegionMeta,
    selectedZoneId,
    setSelectedZoneId,
    toggleRoadStatus,
    simulateRoadBlock,
    alerts,
    sendSosAlert,
  } = useSentinel();

  // Map Mode & Layers State
  const [mapMode, setMapMode] = useState('2d'); // '2d' | '3d'
  const [baseStyle, setBaseStyle] = useState('google-streets'); // 'google-streets' | 'satellite' | 'dark' | 'light'
  const [showZones, setShowZones] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showHeatmap, setShowHeatmap] = useState(true);
  
  // 3D Specific State
  const [pitch, setPitch] = useState(55);
  const [bearing, setBearing] = useState(-15);

  const [sidebarTab, setSidebarTab] = useState('feed');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const criticalZoneCount = zones.filter(z => z.severity === 'red').length;
  const nagpurCenter = currentRegionMeta?.center || [21.1458, 79.0882];

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  // 2D Tile Layer URL generator (Google Maps style default)
  const get2DTileUrl = () => {
    switch (baseStyle) {
      case 'satellite':
        return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      case 'dark':
        return 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      case 'light':
        return 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';
      case 'google-streets':
      default:
        return 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    }
  };

  // Initialize MapLibre 3D Map (when 3D mode is toggled)
  useEffect(() => {
    if (mapMode !== '3d') return;
    if (!mapContainerRef.current) return;

    try {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }

      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(baseStyle),
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
          map.setTerrain({ source: 'terrain', exaggeration: 2.2 });

          // 1. Add Zone Hazard Polygons
          map.addSource('zones', { type: 'geojson', data: zonesToGeoJSON(zones) });
          map.addLayer({
            id: 'zones-extrusion',
            type: 'fill-extrusion',
            source: 'zones',
            layout: { visibility: showZones ? 'visible' : 'none' },
            paint: {
              'fill-extrusion-color': ['get', 'severityColor'],
              'fill-extrusion-height': ['get', 'height'],
              'fill-extrusion-base': 0,
              'fill-extrusion-opacity': 0.7,
            },
          });

          map.addLayer({
            id: 'zones-outline',
            type: 'line',
            source: 'zones',
            layout: { visibility: showZones ? 'visible' : 'none' },
            paint: {
              'line-color': ['get', 'severityColor'],
              'line-width': 3,
            },
          });

          // 2. Add Nagpur Rivers Layer
          map.addSource('rivers', { type: 'geojson', data: riversToGeoJSON(NAGPUR_RIVERS) });
          map.addLayer({
            id: 'rivers-line',
            type: 'line',
            source: 'rivers',
            layout: { visibility: showRivers ? 'visible' : 'none' },
            paint: {
              'line-color': ['get', 'color'],
              'line-width': 5,
            },
          });

          // 3. Add Nagpur Roads Layer
          map.addSource('roads', { type: 'geojson', data: roadsToGeoJSON(roads) });
          map.addLayer({
            id: 'roads-line',
            type: 'line',
            source: 'roads',
            layout: { visibility: showRoads ? 'visible' : 'none' },
            paint: {
              'line-color': ['case', ['get', 'isBlocked'], '#ef4444', '#10b981'],
              'line-width': ['case', ['get', 'isBlocked'], 5, 3.5],
              'line-dasharray': ['case', ['get', 'isBlocked'], [2, 1], [1, 0]],
            },
          });

          // 3D Click Popup
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

        } catch (e) {
          console.warn('[FullMapView] 3D load warning:', e);
        }
      });

    } catch (err) {
      console.error('[FullMapView] MapLibre 3D error:', err);
      setMapMode('2d');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapMode, baseStyle, showZones, showRoads, showRivers]);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-900 text-slate-100 font-sans relative">
      
      {/* ─── MAIN MAP VIEW AREA ────────────────────────────────────────────── */}
      <div className="flex-1 relative h-full w-full flex flex-col overflow-hidden">
        
        {/* Top Control Bar (Mode Switcher, Basemaps & Overlays Toggles) */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          {/* 2D / 3D Mode Selector */}
          <div className="pointer-events-auto flex items-center space-x-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
            <button
              onClick={() => setMapMode('2d')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mapMode === '2d'
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              <span>2D Detailed Streets</span>
            </button>

            <button
              onClick={() => setMapMode('3d')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mapMode === '3d'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-300" />
              <span>3D Photorealistic</span>
            </button>
          </div>

          {/* Base Map Style Selector */}
          <div className="pointer-events-auto hidden sm:flex items-center space-x-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl text-xs font-medium">
            <button
              onClick={() => setBaseStyle('google-streets')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                baseStyle === 'google-streets' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🗺️ Google Streets
            </button>

            <button
              onClick={() => setBaseStyle('satellite')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                baseStyle === 'satellite' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🛰️ Satellite Hybrid
            </button>

            <button
              onClick={() => setBaseStyle('dark')}
              className={`px-3 py-1.5 rounded-xl transition-all ${
                baseStyle === 'dark' ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-400/40' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              🕶️ Dark Mode
            </button>
          </div>

          {/* Layer Overlay Toggles */}
          <div className="pointer-events-auto flex items-center space-x-1.5 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 shadow-2xl text-xs">
            <button
              onClick={() => setShowZones(!showZones)}
              className={`flex items-center space-x-1 transition-all ${showZones ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              <span>Zones</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowRoads(!showRoads)}
              className={`flex items-center space-x-1 transition-all ${showRoads ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              <span>Roads</span>
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowRivers(!showRivers)}
              className={`flex items-center space-x-1 transition-all ${showRivers ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              <span>Rivers</span>
            </button>
          </div>
        </div>

        {/* 3D Map Canvas */}
        {mapMode === '3d' && (
          <div ref={mapContainerRef} className="w-full h-full relative" />
        )}

        {/* 2D Leaflet Google Maps Style Canvas */}
        {mapMode === '2d' && (
          <MapContainer
            center={nagpurCenter}
            zoom={12.5}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
          >
            <LeafletMapAutoUpdater center={nagpurCenter} zoom={12.5} />

            {/* Base Tile Layer */}
            <TileLayer
              url={get2DTileUrl()}
              attribution="© CartoDB Voyager, OpenStreetMap contributors"
              maxZoom={19}
            />

            {baseStyle === 'satellite' && (
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png"
                attribution="© CartoDB Labels"
                maxZoom={19}
              />
            )}

            {/* Zones Overlay */}
            {showZones &&
              zones.map((zone) => {
                const isSelected = selectedZoneId === zone.id;
                return (
                  <Polygon
                    key={zone.id}
                    positions={zone.geometry}
                    pathOptions={{
                      color: zone.severityColor || '#3b82f6',
                      fillColor: zone.severityColor || '#3b82f6',
                      fillOpacity: isSelected ? 0.65 : 0.4,
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

            {/* Rivers Overlay */}
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

            {/* Roads Overlay */}
            {showRoads &&
              roads.map((road) => {
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
      </div>

      {/* ─── RIGHT SIDEBAR COLLAPSIBLE PANEL ──────────────────────────────── */}
      <div
        className={`bg-slate-950 border-l border-slate-800 transition-all duration-300 flex flex-col h-full z-10 ${
          sidebarOpen ? 'w-full md:w-96' : 'w-12'
        }`}
      >
        {/* Toggle Button */}
        <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-slate-900/60">
          {sidebarOpen ? (
            <div className="flex items-center justify-between w-full">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Nagpur Command Feed
              </span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <PanelRightClose className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 transition-colors mx-auto"
              title="Expand Side Panel"
            >
              <PanelRightOpen className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Sidebar Content */}
        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <PriorityActionFeed />
          </div>
        )}
      </div>
    </div>
  );
}
