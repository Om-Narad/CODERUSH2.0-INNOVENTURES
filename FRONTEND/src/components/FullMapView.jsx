import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Polyline, Popup, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { useSentinel } from '../context/SentinelContext';
import PriorityActionFeed from './PriorityActionFeed';
import {
  NAGPUR_RIVERS,
  NAGPUR_AREA_LABELS,
  NAGPUR_WATERBODIES,
  NAGPUR_LANDMARKS,
  NAGPUR_DEM_INFO,
} from '../data/mockData';
import {
  AlertTriangle,
  PanelRightClose,
  PanelRightOpen,
  Box,
  Layers,
  MapPin,
  Compass,
  RotateCcw,
  Maximize2,
  Play,
  Pause,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';

// Custom Area Label Badge Builder
const createAreaBadgeIcon = (name, category, type) => {
  const isCritical = type === 'critical';
  return L.divIcon({
    className: 'nagpur-area-label-badge',
    html: `
      <div style="
        display: flex;
        align-items: center;
        gap: 5px;
        background: ${isCritical ? 'rgba(225, 29, 72, 0.95)' : 'rgba(15, 23, 42, 0.92)'};
        color: #ffffff;
        border: 1.5px solid ${isCritical ? '#f43f5e' : 'rgba(56, 189, 248, 0.8)'};
        padding: 4px 10px;
        border-radius: 20px;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 11px;
        font-weight: 800;
        white-space: nowrap;
        box-shadow: 0 4px 14px rgba(0,0,0,0.4);
        backdrop-filter: blur(6px);
        transform: translate(-50%, -50%);
        pointer-events: auto;
      ">
        <span style="
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: ${isCritical ? '#ffffff' : '#38bdf8'};
          box-shadow: 0 0 8px ${isCritical ? '#ffffff' : '#38bdf8'};
          flex-shrink: 0;
        "></span>
        <span style="letter-spacing: 0.3px;">${name}</span>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};

// Custom Landmark Icon Builder
const createLandmarkIcon = (category) => {
  let symbol = '📍';
  let color = '#3b82f6';
  if (category === 'Hospital') { symbol = '🏥'; color = '#ef4444'; }
  else if (category === 'Education') { symbol = '🎓'; color = '#8b5cf6'; }
  else if (category === 'Religious Place') { symbol = '🕉️'; color = '#f59e0b'; }
  else if (category === 'Imp Landmark') { symbol = '🏛️'; color = '#06b6d4'; }

  return L.divIcon({
    className: 'nagpur-landmark-badge',
    html: `
      <div style="
        display: flex;
        align-items: center;
        justify-content: center;
        background: #ffffff;
        border: 2px solid ${color};
        border-radius: 50%;
        width: 26px;
        height: 26px;
        font-size: 13px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      ">
        ${symbol}
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
};

// MapLibre 3D Style Configuration (Keyless free tiles)
function buildMapStyle() {
  return {
    version: 8,
    name: 'Nagpur 3D Photorealistic',
    sources: {
      'esri-satellite': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
        attribution: '© Esri Imagery',
      },
      'esri-labels': {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 19,
      },
    },
    layers: [
      {
        id: 'esri-base',
        type: 'raster',
        source: 'esri-satellite',
        minzoom: 0,
        maxzoom: 22,
      },
      {
        id: 'esri-labels-layer',
        type: 'raster',
        source: 'esri-labels',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

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
  } = useSentinel();

  const nagpurCenter = currentRegionMeta?.center || [21.1458, 79.0882];

  // Map Mode & 3D Controls
  const [mapMode, setMapMode] = useState('2d'); // '2d' | '3d'
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-20);
  const [zoom, setZoom] = useState(12.8);
  const [showZones, setShowZones] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [showRivers, setShowRivers] = useState(true);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [showLegend, setShowLegend] = useState(true);
  const [isAutoSpinning, setIsAutoSpinning] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const spinAnimRef = useRef(null);

  // Initialize MapLibre 3D Map
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
        style: buildMapStyle(),
        center: [nagpurCenter[1], nagpurCenter[0]],
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        antialias: true,
      });

      mapRef.current = map;

      map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

      map.on('load', () => {
        try {
          NAGPUR_AREA_LABELS.forEach((area) => {
            const el = document.createElement('div');
            el.className = 'nagpur-3d-area-pill';
            const isCrit = area.type === 'critical';
            el.style.cssText = `
              display: flex;
              align-items: center;
              gap: 5px;
              background: ${isCrit ? 'rgba(225, 29, 72, 0.95)' : 'rgba(15, 23, 42, 0.92)'};
              color: #ffffff;
              border: 1.5px solid ${isCrit ? '#f43f5e' : 'rgba(56, 189, 248, 0.8)'};
              padding: 3px 9px;
              border-radius: 20px;
              font-family: system-ui, -apple-system, sans-serif;
              font-size: 11px;
              font-weight: 800;
              white-space: nowrap;
              box-shadow: 0 4px 14px rgba(0,0,0,0.6);
              backdrop-filter: blur(4px);
              cursor: pointer;
            `;
            el.innerHTML = `
              <span style="width: 6px; height: 6px; border-radius: 50%; background: ${isCrit ? '#ffffff' : '#38bdf8'};"></span>
              <span>${area.name}</span>
            `;

            new maplibregl.Marker({ element: el })
              .setLngLat([area.lng, area.lat])
              .addTo(map);
          });
        } catch (err) {
          console.warn('[FullMapView] 3D markers setup warning:', err);
        }
      });

    } catch (e) {
      console.error('[FullMapView] MapLibre 3D error:', e);
      setMapMode('2d');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [mapMode]);

  // Update pitch/bearing
  useEffect(() => {
    if (mapRef.current) {
      mapRef.current.setPitch(pitch);
      mapRef.current.setBearing(bearing);
    }
  }, [pitch, bearing]);

  // Auto-spin 360 loop
  useEffect(() => {
    if (!isAutoSpinning || mapMode !== '3d') {
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
      return;
    }

    const spin = () => {
      setBearing((prev) => (prev + 0.3) % 360);
      spinAnimRef.current = requestAnimationFrame(spin);
    };

    spinAnimRef.current = requestAnimationFrame(spin);
    return () => {
      if (spinAnimRef.current) cancelAnimationFrame(spinAnimRef.current);
    };
  }, [isAutoSpinning, mapMode]);

  const panCamera = (dLat, dLng) => {
    if (mapRef.current) {
      const c = mapRef.current.getCenter();
      mapRef.current.panTo([c.lng + dLng, c.lat + dLat]);
    }
  };

  const applyPreset = (p, b, z) => {
    setIsAutoSpinning(false);
    setPitch(p);
    setBearing(b);
    if (mapRef.current) {
      mapRef.current.easeTo({ pitch: p, bearing: b, zoom: z, duration: 1000 });
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-900 text-slate-100 font-sans relative">
      
      {/* ─── MAIN MAP CANVAS AREA ──────────────────────────────────────────── */}
      <div className="flex-1 relative h-full w-full flex flex-col overflow-hidden">
        
        {/* Top Floating Control Bar */}
        <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          
          {/* Mode Switcher */}
          <div className="pointer-events-auto flex items-center space-x-1 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
            <button
              onClick={() => { setMapMode('2d'); setIsAutoSpinning(false); }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mapMode === '2d'
                  ? 'bg-white text-slate-900 shadow-md font-extrabold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MapPin className="w-3.5 h-3.5 text-cyan-600" />
              <span>2D Detailed Streets</span>
            </button>

            <button
              onClick={() => { setMapMode('3d'); setIsAutoSpinning(false); }}
              className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                mapMode === '3d'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Box className="w-3.5 h-3.5 text-cyan-300" />
              <span>3D Photorealistic</span>
            </button>
          </div>

          {/* 3D Presets & Orbit Control */}
          {mapMode === '3d' && (
            <div className="pointer-events-auto flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 shadow-2xl text-xs">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presets:</span>
              <button
                onClick={() => applyPreset(60, -20, 13)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 rounded-lg font-bold cursor-pointer"
              >
                🚁 Drone View
              </button>
              <button
                onClick={() => applyPreset(0, 0, 12.5)}
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-bold cursor-pointer"
              >
                🛰️ Satellite Top
              </button>
              <button
                onClick={() => setIsAutoSpinning(!isAutoSpinning)}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg font-bold cursor-pointer ${
                  isAutoSpinning ? 'bg-rose-600 text-white animate-pulse' : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                }`}
              >
                {isAutoSpinning ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>360° Orbit</span>
              </button>
            </div>
          )}

          {/* Layer Visibility Toggles */}
          <div className="pointer-events-auto flex items-center space-x-2 bg-slate-950/90 backdrop-blur-md border border-slate-800 rounded-2xl px-3 py-1.5 shadow-2xl text-xs">
            <button
              onClick={() => setShowZones(!showZones)}
              className={`transition-all cursor-pointer ${showZones ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              Zones
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowRoads(!showRoads)}
              className={`transition-all cursor-pointer ${showRoads ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              Roads
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowRivers(!showRivers)}
              className={`transition-all cursor-pointer ${showRivers ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              Rivers &amp; Lakes
            </button>
            <span className="text-slate-700">|</span>
            <button
              onClick={() => setShowLandmarks(!showLandmarks)}
              className={`transition-all cursor-pointer ${showLandmarks ? 'text-cyan-400 font-bold' : 'text-slate-500 line-through'}`}
            >
              Landmarks
            </button>
          </div>
        </div>

        {/* 3D Map Canvas */}
        {mapMode === '3d' && (
          <div ref={mapContainerRef} className="w-full h-full relative" />
        )}

        {/* 2D Leaflet Google Maps Style Canvas (NO API KEY REQUIRED) */}
        {mapMode === '2d' && (
          <MapContainer
            center={nagpurCenter}
            zoom={12.5}
            scrollWheelZoom={true}
            attributionControl={false}
            className="w-full h-full z-0"
          >
            <LeafletMapAutoUpdater center={nagpurCenter} zoom={12.5} />

            {/* Clean Keyless OpenStreetMap Tiles - Watermark Free */}
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />

            {/* Render Area Label Badges */}
            {NAGPUR_AREA_LABELS.map((area) => (
              <Marker
                key={area.id}
                position={[area.lat, area.lng]}
                icon={createAreaBadgeIcon(area.name, area.category, area.type)}
              >
                <Popup>
                  <div className="font-sans text-xs p-0.5">
                    <strong className="text-slate-900 text-sm">{area.name}</strong>
                    <div className="text-cyan-700 font-bold mt-0.5">{area.category}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Waterbodies */}
            {showRivers && NAGPUR_WATERBODIES.map((wb) => (
              <Marker
                key={wb.id}
                position={[wb.lat, wb.lng]}
                icon={L.divIcon({
                  className: 'nagpur-wb-badge',
                  html: `
                    <div style="
                      background: #0284c7;
                      color: #ffffff;
                      padding: 3px 8px;
                      border-radius: 12px;
                      font-size: 11px;
                      font-weight: 800;
                      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                      border: 1px solid #38bdf8;
                      transform: translate(-50%, -50%);
                    ">
                      💧 ${wb.name}
                    </div>
                  `,
                  iconSize: [0, 0],
                })}
              />
            ))}

            {/* Render Landmarks */}
            {showLandmarks && NAGPUR_LANDMARKS.map((lm) => (
              <Marker
                key={lm.id}
                position={[lm.lat, lm.lng]}
                icon={createLandmarkIcon(lm.category)}
              >
                <Popup>
                  <div className="font-sans text-xs p-1">
                    <strong className="text-slate-900 text-sm">{lm.name}</strong>
                    <div className="text-purple-700 font-bold mt-0.5">{lm.category}</div>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Render Zone Polygons */}
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

            {/* Render River Channels */}
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
                />
              ))}

            {/* Render Roads */}
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
                  />
                );
              })}
          </MapContainer>
        )}

        {/* Floating Legend Box (Matching Image 1) */}
        <div className="absolute bottom-4 left-4 z-20 bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl text-xs text-slate-200 max-w-xs space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span className="font-extrabold text-cyan-400 uppercase tracking-wider text-[11px]">
              MAP LEGEND
            </span>
            <button
              onClick={() => setShowLegend(!showLegend)}
              className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
            >
              {showLegend ? 'Hide' : 'Show'}
            </button>
          </div>

          {showLegend && (
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px] font-medium">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-amber-500 rounded-full" />
                <span>Major Road (NH)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-emerald-500 rounded-full" />
                <span>Open Arterial</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-1 bg-rose-500 rounded-full border border-dashed border-rose-300" />
                <span>Inundated Road</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-2 bg-sky-500 rounded-xs" />
                <span>Waterbody / Lake</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span>Critical Risk Zone</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Warning Sector</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>🏥</span>
                <span>Hospital / Medical</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>🎓</span>
                <span>College / School</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>🕉️</span>
                <span>Religious Site</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span>🏛️</span>
                <span>Imp Landmark</span>
              </div>
            </div>
          )}
        </div>

        {/* 3D Navigation Controls Dock */}
        {mapMode === '3d' && (
          <div className="absolute bottom-4 right-4 z-20 pointer-events-auto bg-slate-950/92 backdrop-blur-md border border-slate-800 rounded-2xl p-3 shadow-2xl space-y-2 text-xs text-slate-300">
            <div className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider text-center">
              3D ORBIT &amp; TILT CONTROLS
            </div>

            <div className="flex items-center justify-center gap-1.5">
              {/* Directional Pad */}
              <div className="grid grid-cols-3 gap-1 w-24">
                <div />
                <button
                  onClick={() => panCamera(0.005, 0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center cursor-pointer active:scale-95"
                  title="Pan North"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  onClick={() => panCamera(0, -0.005)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center cursor-pointer active:scale-95"
                  title="Pan West"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => applyPreset(60, -20, 13)}
                  className="p-1 bg-cyan-950 border border-cyan-800 text-cyan-400 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer"
                  title="Reset"
                >
                  Reset
                </button>
                <button
                  onClick={() => panCamera(0, 0.005)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center cursor-pointer active:scale-95"
                  title="Pan East"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <div />
                <button
                  onClick={() => panCamera(-0.005, 0)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg flex items-center justify-center cursor-pointer active:scale-95"
                  title="Pan South"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <div />
              </div>

              {/* Sliders */}
              <div className="space-y-2 border-l border-slate-800 pl-3">
                <div className="flex items-center space-x-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-[10px]">Tilt: <strong>{pitch}°</strong></span>
                  <input
                    type="range"
                    min="0"
                    max="85"
                    value={pitch}
                    onChange={(e) => setPitch(Number(e.target.value))}
                    className="w-16 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center space-x-1.5">
                  <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-[10px]">Spin: <strong>{bearing}°</strong></span>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={bearing}
                    onChange={(e) => setBearing(Number(e.target.value))}
                    className="w-16 accent-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ─── RIGHT SIDEBAR COLLAPSIBLE PANEL ──────────────────────────────── */}
      <div
        className={`bg-slate-950 border-l border-slate-800 transition-all duration-300 flex flex-col h-full z-10 ${
          sidebarOpen ? 'w-full md:w-96' : 'w-12'
        }`}
      >
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

        {sidebarOpen && (
          <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
            <PriorityActionFeed />
          </div>
        )}
      </div>
    </div>
  );
}
