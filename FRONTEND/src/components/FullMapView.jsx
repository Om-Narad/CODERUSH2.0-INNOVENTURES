/**
 * FullMapView.jsx — SentinelPlan Photorealistic 3D Map
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the old flat Leaflet/Carto dark map with a MapLibre GL JS 3D map.
 *
 * Features:
 *  - Photorealistic satellite imagery (ESRI World Imagery — free, no API key)
 *  - 3D terrain exaggeration (AWS Terrain Tiles via MapLibre protocol)
 *  - Atmospheric sky layer for depth
 *  - Zone polygons as GeoJSON fill + outline layers (color by severity)
 *  - Clickable roads as GeoJSON line layers (cyan = open, red = blocked)
 *  - Population density heatmap circles
 *  - Camera pitched 45° for visible 3D terrain
 *  - Sidebar tabs: Priority Action Feed | SOS Alerts
 *  - All state updates via setData() — no map re-mount on re-render
 */
import React, { useEffect, useRef, useState } from 'react';
// MapLibre GL JS v4+ ESM build uses named exports — import namespace
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSentinel } from '../context/SentinelContext';
import PriorityActionFeed from './PriorityActionFeed';
import { DENSITY_HEATMAP_POINTS } from '../data/mockData';
import {
  AlertTriangle,
  PanelRightClose,
  PanelRightOpen,
  Info,
  Siren,
  ShieldAlert,
} from 'lucide-react';

// ─── GeoJSON Helpers ──────────────────────────────────────────────────────────

/**
 * Convert zone array → GeoJSON FeatureCollection for MapLibre fill layer.
 * Geometry coords are stored as [lat, lng] but GeoJSON needs [lng, lat].
 */
function zonesToGeoJSON(zones) {
  return {
    type: 'FeatureCollection',
    features: zones.map(zone => ({
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
      },
      geometry: {
        type: 'Polygon',
        // Convert [lat, lng] → [lng, lat] for GeoJSON, and close the ring
        coordinates: [
          [
            ...zone.geometry.map(([lat, lng]) => [lng, lat]),
            zone.geometry[0] ? [zone.geometry[0][1], zone.geometry[0][0]] : undefined,
          ].filter(Boolean),
        ],
      },
    })),
  };
}

/**
 * Convert roads array → GeoJSON FeatureCollection for MapLibre line layer.
 */
function roadsToGeoJSON(roads) {
  return {
    type: 'FeatureCollection',
    features: roads.map(road => ({
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
        // Convert [lat, lng] → [lng, lat] for GeoJSON
        coordinates: road.geometry.map(([lat, lng]) => [lng, lat]),
      },
    })),
  };
}

/**
 * Convert density heatmap points → GeoJSON for MapLibre circle layer.
 */
function heatmapToGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: points.map((pt, i) => ({
      type: 'Feature',
      id: i,
      properties: {
        intensity: pt.intensity,
        label: pt.label,
      },
      geometry: {
        type: 'Point',
        coordinates: [pt.lng, pt.lat],
      },
    })),
  };
}

// ─── MapLibre Style Definition ────────────────────────────────────────────────

/**
 * Build the complete MapLibre style JSON.
 * Uses ESRI World Imagery for photorealistic satellite basemap.
 * Terrain DEM from open AWS Terrain Tiles (Mapzen Terrarium format).
 */
function buildMapStyle() {
  return {
    version: 8,
    name: 'SentinelPlan Satellite 3D',
    // Sky background
    sky: {
      'sky-color': '#1a2035',
      'horizon-color': '#1e3a5f',
      'fog-color': '#152232',
      'horizon-blend': 0.1,
      'sky-atmosphere-sun': [0.0, 0.0],
      'sky-atmosphere-sun-intensity': 5,
    },
    sources: {
      // ── Satellite Imagery: ESRI World Imagery (free, no key) ───────────────
      satellite: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© ESRI, DigitalGlobe, GeoEye, Earthstar Geographics, CNES/Airbus DS',
        maxzoom: 19,
      },
      // ── Terrain DEM: AWS Open Terrain Tiles (Mapzen Terrarium) ─────────────
      terrain: {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
        attribution: '© Mapzen, © OpenStreetMap contributors',
      },
    },
    layers: [
      // ── Satellite base layer ────────────────────────────────────────────────
      {
        id: 'satellite-layer',
        type: 'raster',
        source: 'satellite',
        minzoom: 0,
        maxzoom: 22,
      },
    ],
  };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FullMapView() {
  const {
    zones,
    roads,
    currentRegionMeta,
    selectedZoneId,
    setSelectedZoneId,
    toggleRoadStatus,
    simulateRoadBlock,
    sosAlerts,
  } = useSentinel();

  // Map container ref and MapLibre map instance ref
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  // Track whether all custom layers have been added
  const mapReadyRef = useRef(false);
  // Track popup instance
  const popupRef = useRef(null);

  // Sidebar state: 'feed' | 'sos' | null (collapsed)
  const [sidebarTab, setSidebarTab] = useState('feed');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Tooltip state for hover (shown in corner overlay)
  const [hoveredFeature, setHoveredFeature] = useState(null);

  const criticalZoneCount = zones.filter(z => z.severity === 'red').length;

  // ── Initialize MapLibre map ─────────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return; // already initialized

    const center = currentRegionMeta?.center || [26.185, 91.745];
    // MapLibre uses [lng, lat] order
    const lngLat = [center[1], center[0]];

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildMapStyle(),
      center: lngLat,
      zoom: 11.5,
      pitch: 50,          // 3D tilt angle in degrees
      bearing: -15,       // slight rotation for dramatic 3D view
      minZoom: 5,
      maxZoom: 20,
      antialias: true,    // enables smooth rendering for 3D
    });

    mapRef.current = map;

    // ── Navigation controls (zoom, compass, pitch) ──────────────────────────
    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    // ── Scale control ────────────────────────────────────────────────────────
    map.addControl(new maplibregl.ScaleControl({ unit: 'metric' }), 'bottom-right');

    // ── Full-screen control ──────────────────────────────────────────────────
    map.addControl(new maplibregl.FullscreenControl(), 'top-right');

    // ── On style load: add terrain + custom data layers ─────────────────────
    map.on('load', () => {
      // ── 3D Terrain ──────────────────────────────────────────────────────────
      map.setTerrain({
        source: 'terrain',
        exaggeration: 2.0, // amplify terrain relief (2x = very visible hills)
      });

      // ── Sky Layer (atmospheric haze) ────────────────────────────────────────
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun': [0.0, 0.0],
          'sky-atmosphere-sun-intensity': 5,
          'sky-atmosphere-color': 'rgba(20, 40, 80, 1)',
          'sky-atmosphere-halo-color': 'rgba(30, 80, 160, 0.5)',
        },
      });

      // ── Zone Polygon Source + Layers ────────────────────────────────────────
      map.addSource('zones', {
        type: 'geojson',
        data: zonesToGeoJSON(zones),
      });

      // Fill layer: semi-transparent colored fill per severity
      map.addLayer({
        id: 'zones-fill',
        type: 'fill',
        source: 'zones',
        paint: {
          'fill-color': ['get', 'severityColor'],
          'fill-opacity': [
            'case',
            ['==', ['get', 'severity'], 'red'], 0.35,
            ['==', ['get', 'severity'], 'amber'], 0.25,
            0.18,
          ],
        },
      });

      // Outline / border layer
      map.addLayer({
        id: 'zones-outline',
        type: 'line',
        source: 'zones',
        paint: {
          'line-color': ['get', 'severityColor'],
          'line-width': 2.5,
          'line-opacity': 0.9,
        },
      });

      // Selected zone highlight (thicker border, pulsing look via opacity)
      map.addLayer({
        id: 'zones-selected',
        type: 'line',
        source: 'zones',
        filter: ['==', ['get', 'id'], ''],
        paint: {
          'line-color': '#38bdf8',
          'line-width': 4,
          'line-opacity': 1,
          'line-dasharray': [2, 2],
        },
      });

      // ── Population Density Heatmap Source + Layer ───────────────────────────
      map.addSource('heatmap', {
        type: 'geojson',
        data: heatmapToGeoJSON(DENSITY_HEATMAP_POINTS),
      });

      // Outer glow ring
      map.addLayer({
        id: 'heatmap-outer',
        type: 'circle',
        source: 'heatmap',
        paint: {
          'circle-radius': ['*', 50, ['get', 'intensity']],
          'circle-color': '#ef4444',
          'circle-opacity': ['*', 0.12, ['get', 'intensity']],
          'circle-blur': 1,
        },
      });

      // Inner hot spot
      map.addLayer({
        id: 'heatmap-inner',
        type: 'circle',
        source: 'heatmap',
        paint: {
          'circle-radius': ['*', 15, ['get', 'intensity']],
          'circle-color': '#f59e0b',
          'circle-opacity': ['*', 0.5, ['get', 'intensity']],
          'circle-blur': 0.5,
          'circle-stroke-width': 1,
          'circle-stroke-color': '#f59e0b',
          'circle-stroke-opacity': 0.3,
        },
      });

      // ── Roads Source + Layers ───────────────────────────────────────────────
      map.addSource('roads', {
        type: 'geojson',
        data: roadsToGeoJSON(roads),
      });

      // Invisible wide hit-target layer for easy clicking
      map.addLayer({
        id: 'roads-hit',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': '#ffffff',
          'line-width': 20,
          'line-opacity': 0.001,
        },
      });

      // Visible road lines — color by status
      map.addLayer({
        id: 'roads-line',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'status'], 'blocked'], '#ef4444',
            '#38bdf8',
          ],
          'line-width': 4,
          'line-opacity': 0.9,
          // Dashed style for blocked roads
          'line-dasharray': [
            'case',
            ['==', ['get', 'status'], 'blocked'],
            ['literal', [6, 8]],
            ['literal', [1, 0]],
          ],
        },
      });

      // Road glow effect (wider blurred copy)
      map.addLayer({
        id: 'roads-glow',
        type: 'line',
        source: 'roads',
        paint: {
          'line-color': [
            'case',
            ['==', ['get', 'status'], 'blocked'], '#ef444444',
            '#38bdf844',
          ],
          'line-width': 12,
          'line-opacity': 0.25,
          'line-blur': 4,
        },
      }, 'roads-line'); // insert below the main line

      // ── Click: Roads ─────────────────────────────────────────────────────────
      map.on('click', 'roads-hit', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const roadId = feature.properties.id;

        // Toggle road status
        toggleRoadStatus(roadId);

        // Show a brief popup
        if (popupRef.current) popupRef.current.remove();
        const isBlocked = feature.properties.status === 'blocked';
        const newStatus = isBlocked ? 'OPEN' : 'BLOCKED';
        popupRef.current = new maplibregl.Popup({ closeOnClick: true, className: 'sentinel-popup' })
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="background:#151c28;border:1px solid #334155;border-radius:10px;padding:10px;min-width:180px;font-family:system-ui,sans-serif;color:#e2e8f0">
              <div style="font-weight:700;font-size:13px;margin-bottom:4px;color:#fff">${feature.properties.name}</div>
              <div style="font-size:11px;color:#94a3b8">Status changed to:</div>
              <div style="font-weight:700;font-size:12px;margin-top:2px;color:${isBlocked ? '#22c55e' : '#ef4444'}">
                ${newStatus}
              </div>
              <div style="font-size:10px;color:#64748b;margin-top:4px;">Zone priorities recalculated</div>
            </div>
          `)
          .addTo(map);
      });

      // ── Click: Zones ──────────────────────────────────────────────────────────
      map.on('click', 'zones-fill', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        setSelectedZoneId(feature.properties.id);
      });

      // ── Hover: Roads (cursor change) ──────────────────────────────────────────
      map.on('mouseenter', 'roads-hit', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const p = e.features[0].properties;
          setHoveredFeature({ type: 'road', name: p.name, status: p.status });
        }
      });
      map.on('mouseleave', 'roads-hit', () => {
        map.getCanvas().style.cursor = '';
        setHoveredFeature(null);
      });

      // ── Hover: Zones ──────────────────────────────────────────────────────────
      map.on('mouseenter', 'zones-fill', (e) => {
        map.getCanvas().style.cursor = 'pointer';
        if (e.features && e.features[0]) {
          const p = e.features[0].properties;
          setHoveredFeature({
            type: 'zone',
            name: p.name,
            priority: p.priority,
            peopleExposed: p.peopleExposed,
            severityColor: p.severityColor,
          });
        }
      });
      map.on('mouseleave', 'zones-fill', () => {
        map.getCanvas().style.cursor = '';
        setHoveredFeature(null);
      });

      mapReadyRef.current = true;
    });

    // Cleanup on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapReadyRef.current = false;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — map init once

  // ── Sync zones GeoJSON when zones change ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('zones');
    if (source) {
      source.setData(zonesToGeoJSON(zones));
    }
    // Update selected zone highlight filter
    if (selectedZoneId) {
      map.setFilter('zones-selected', ['==', ['get', 'id'], selectedZoneId]);
    } else {
      map.setFilter('zones-selected', ['==', ['get', 'id'], '']);
    }
  }, [zones, selectedZoneId]);

  // ── Sync roads GeoJSON when roads change ───────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;
    const source = map.getSource('roads');
    if (source) {
      source.setData(roadsToGeoJSON(roads));
    }
  }, [roads]);

  // ── Fly to region when currentRegionMeta changes ──────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !currentRegionMeta?.center) return;
    const [lat, lng] = currentRegionMeta.center;
    map.flyTo({
      center: [lng, lat],
      zoom: (currentRegionMeta.zoom || 12) - 0.5,
      pitch: 50,
      bearing: -15,
      speed: 1.4,
      curve: 1.2,
      essential: true,
    });
  }, [currentRegionMeta]);

  // ── Sidebar tab toggle helper ─────────────────────────────────────────────
  const handleTabClick = (tab) => {
    if (sidebarTab === tab && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setSidebarTab(tab);
      setSidebarOpen(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0b0f17]">

      {/* Top Banner Control Bar */}
      <div className="bg-[#151c28] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              <strong className="text-white">3D Photorealistic Map:</strong> Click roads to block/open · Drag to rotate · Scroll to zoom · Right-drag to tilt
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs text-slate-400">
            <span>
              Roads: <strong className="text-cyan-400">{roads.filter(r => r.status === 'open').length} Open</strong>{' '}
              / <strong className="text-rose-400">{roads.filter(r => r.status === 'blocked').length} Blocked</strong>
            </span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Simulate Road Block */}
          <button
            id="map-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-slate-950" />
            <span>Simulate Road Block</span>
          </button>

          {/* Toggle Sidebar */}
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-all cursor-pointer"
            title={sidebarOpen ? 'Collapse Panel' : 'Expand Panel'}
          >
            {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Main: Map + Sidebar ─────────────────────────────────────────────── */}
      <div className="flex-1 flex relative overflow-hidden">

        {/* MapLibre GL JS Map Container */}
        <div className="flex-1 h-full relative">

          {/* The MapLibre map renders into this div via ref */}
          <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" />

          {/* ── Hover Tooltip Overlay ─────────────────────────────────────── */}
          {hoveredFeature && (
            <div className="absolute bottom-16 left-4 z-20 bg-[#0f1419]/95 border border-slate-700 p-3 rounded-xl backdrop-blur-md shadow-2xl text-xs pointer-events-none">
              {hoveredFeature.type === 'road' ? (
                <div className="space-y-1">
                  <div className="font-bold text-white">{hoveredFeature.name}</div>
                  <div className={`font-semibold ${hoveredFeature.status === 'blocked' ? 'text-rose-400' : 'text-cyan-400'}`}>
                    {hoveredFeature.status === 'blocked' ? '⛔ BLOCKED' : '✅ OPEN'} · Click to toggle
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="font-bold text-white">{hoveredFeature.name}</div>
                  <div className="text-slate-300">
                    Priority: <strong style={{ color: hoveredFeature.severityColor }}>{hoveredFeature.priority}</strong>
                  </div>
                  <div className="text-slate-400">{hoveredFeature.peopleExposed?.toLocaleString()} people exposed</div>
                </div>
              )}
            </div>
          )}

          {/* ── Map Legend ───────────────────────────────────────────────── */}
          <div className="absolute bottom-10 left-4 z-10 bg-[#0f1419]/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-2xl text-xs space-y-2">
            <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">Map Legend</h4>
            <div className="space-y-1.5 text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse inline-block"></span>
                <span>Critical Zone (Score ≥ 75)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500 inline-block"></span>
                <span>Warning Zone (Score 50–74)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
                <span>Stable Zone (Score &lt; 50)</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                <span className="w-4 h-1 bg-cyan-400 rounded inline-block"></span>
                <span>Open Evacuation Route</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-rose-500 rounded border border-dashed border-rose-300 inline-block"></span>
                <span>Blocked / Submerged Route</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                <span className="w-3 h-3 rounded-full bg-amber-500 opacity-60 inline-block"></span>
                <span>Population Density</span>
              </div>
            </div>
          </div>

          {/* ── 3D Mode Badge ────────────────────────────────────────────── */}
          <div className="absolute top-4 right-16 z-10 bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">
            3D Terrain Active
          </div>
        </div>

        {/* ── Collapsible Right Sidebar ────────────────────────────────────── */}
        {sidebarOpen && (
          <div className="w-96 h-full border-l border-slate-800 bg-[#0b0f17] flex flex-col z-10 shadow-2xl flex-shrink-0">

            {/* Sidebar Tab Bar */}
            <div className="flex border-b border-slate-800 bg-[#151c28] flex-shrink-0">
              {/* Priority Feed Tab */}
              <button
                onClick={() => handleTabClick('feed')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                  sidebarTab === 'feed'
                    ? 'text-cyan-300 border-b-2 border-cyan-400 bg-cyan-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Priority Feed</span>
              </button>

              {/* SOS Alerts Tab */}
              <button
                onClick={() => handleTabClick('sos')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer relative ${
                  sidebarTab === 'sos'
                    ? 'text-rose-300 border-b-2 border-rose-400 bg-rose-950/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Siren className="w-3.5 h-3.5" />
                <span>SOS Alerts</span>
                {/* Critical count badge */}
                {criticalZoneCount > 0 && (
                  <span className="absolute top-1.5 right-6 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse">
                    {criticalZoneCount}
                  </span>
                )}
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-3">
              {sidebarTab === 'feed' ? (
                <PriorityActionFeed />
              ) : (
                /* Compact SOS panel for sidebar — only critical zones + history */
                <SidebarSosPanel />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar-Compact SOS Panel (used in the map sidebar tab) ──────────────────

function SidebarSosPanel() {
  const {
    zones,
    sosAlerts,
    sendSosAlert,
    sendMassSos,
    sosNotification,
    dismissSosNotification,
  } = useSentinel();

  const [massSending, setMassSending] = useState(false);
  const affectedZones = zones.filter(z => z.severity === 'red' || z.severity === 'amber');
  const criticalZones = zones.filter(z => z.severity === 'red');

  const handleMassSos = () => {
    setMassSending(true);
    sendMassSos(zones);
    setTimeout(() => setMassSending(false), 2000);
  };

  return (
    <div className="space-y-3">
      {/* SOS Notification Toast (compact in sidebar) */}
      {sosNotification && (
        <div className="flex items-center gap-2 p-3 rounded-xl border border-rose-600/50 bg-rose-950/40 text-xs">
          <Siren className="w-4 h-4 text-rose-400 animate-pulse flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="font-bold text-rose-200">Alert Sent!</div>
            <div className="text-rose-300/70 truncate">{sosNotification.zoneName}</div>
          </div>
          <button onClick={dismissSosNotification} className="text-rose-400 hover:text-white cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Mass SOS Button */}
      <button
        id="sidebar-mass-sos-btn"
        onClick={handleMassSos}
        disabled={massSending || criticalZones.length === 0}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 border ${
          massSending
            ? 'bg-emerald-700/20 border-emerald-600/40 text-emerald-300 cursor-not-allowed'
            : criticalZones.length === 0
              ? 'bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border-rose-500/40 shadow-lg shadow-rose-900/30 cursor-pointer'
        }`}
      >
        <Siren className="w-3.5 h-3.5" />
        {massSending ? 'Mass SOS Dispatched!' : `Send Mass SOS (${criticalZones.length} Critical Zones)`}
      </button>

      {/* Affected Zones */}
      <div className="space-y-2">
        <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
          Affected Zones ({affectedZones.length})
        </h3>
        {affectedZones.map(zone => {
          const isCritical = zone.severity === 'red';
          return (
            <div
              key={zone.id}
              className={`rounded-xl border p-3 text-xs ${
                isCritical
                  ? 'border-rose-700/50 bg-rose-950/20'
                  : 'border-amber-700/40 bg-amber-950/15'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'}`} />
                  <span className="font-bold text-white text-[11px] truncate">{zone.name}</span>
                </div>
                <span className="text-[10px] font-bold flex-shrink-0" style={{ color: zone.severityColor }}>
                  P{zone.priority}
                </span>
              </div>
              <div className="text-slate-400 mb-2">
                {zone.peopleExposed.toLocaleString()} exposed · {zone.roadsOpen}/{zone.totalRoads} routes open
              </div>
              <button
                id={`sidebar-sos-${zone.id}`}
                onClick={() => sendSosAlert(zone.id, zones)}
                className={`w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[11px] font-bold transition-all active:scale-95 cursor-pointer ${
                  isCritical
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                <Siren className="w-3 h-3" />
                Send SOS Alert
              </button>
            </div>
          );
        })}
      </div>

      {/* History (compact) */}
      {sosAlerts.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-2">
            Alert History ({sosAlerts.length})
          </h3>
          <div className="space-y-1.5 max-h-60 overflow-y-auto">
            {sosAlerts.slice(0, 10).map(entry => (
              <div
                key={entry.id}
                className="flex items-start gap-2 p-2 rounded-lg border border-slate-800/60 bg-slate-900/40 text-[11px]"
              >
                <Siren className="w-3 h-3 text-rose-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white truncate">{entry.zoneName}</div>
                  <div className="text-slate-500">{entry.timestamp}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
