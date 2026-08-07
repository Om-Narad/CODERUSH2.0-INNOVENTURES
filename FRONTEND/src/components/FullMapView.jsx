/**
 * FullMapView.jsx — SentinelPlan Interactive 3D/2D Map View
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a full-screen interactive disaster response map.
 * Supports both 3D Photorealistic Satellite mode (MapLibre GL JS) and
 * 2D Tactical Vector mode (Leaflet) with seamless switching & WebGL fallback.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapContainer, TileLayer, Polygon, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

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
  Loader2,
  RefreshCw,
  Box,
  Layers,
} from 'lucide-react';

const maplib = maplibregl;

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

function heatmapToGeoJSON(points) {
  return {
    type: 'FeatureCollection',
    features: (points || []).map((pt, i) => ({
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

function buildMapStyle() {
  return {
    version: 8,
    name: 'SentinelPlan Satellite 3D',
    sources: {
      satellite: {
        type: 'raster',
        tiles: [
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        ],
        tileSize: 256,
        attribution: '© ESRI World Imagery',
        maxzoom: 19,
      },
      terrain: {
        type: 'raster-dem',
        tiles: [
          'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        ],
        tileSize: 256,
        encoding: 'terrarium',
        maxzoom: 14,
        attribution: '© Mapzen Terrarium',
      },
    },
    layers: [
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

// ─── Leaflet Helper Component for 2D Map Auto-fitting ─────────────────────────

function LeafletMapViewUpdater({ center, zoom, zones }) {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, zoom || 12);
    }

    if (zones && zones.length > 0) {
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      let valid = false;
      zones.forEach(z => {
        if (Array.isArray(z.geometry)) {
          z.geometry.forEach(([lat, lng]) => {
            if (typeof lat === 'number' && typeof lng === 'number') {
              valid = true;
              if (lat < minLat) minLat = lat;
              if (lat > maxLat) maxLat = lat;
              if (lng < minLng) minLng = lng;
              if (lng > maxLng) maxLng = lng;
            }
          });
        }
      });
      if (valid && minLat < maxLat && minLng < maxLng) {
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [40, 40] });
      }
    }
  }, [map, center, zoom, zones]);

  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
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
  } = useSentinel();

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const mapReadyRef = useRef(false);
  const popupRef = useRef(null);

  // Map Mode: '3d' | '2d'
  const [mapMode, setMapMode] = useState('3d');

  // Sidebar state
  const [sidebarTab, setSidebarTab] = useState('feed');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Loading & WebGL error handling state
  const [isMapLoading, setIsMapLoading] = useState(true);
  const [mapError, setMapError] = useState(null);

  const criticalZoneCount = zones.filter(z => z.severity === 'red').length;
  const center = currentRegionMeta?.center || [26.185, 91.745];

  // ── Initialize MapLibre 3D Map ─────────────────────────────────────────────
  useEffect(() => {
    if (mapMode !== '3d') return;
    if (mapRef.current) return;

    // Check WebGL support
    if (!maplib.supported()) {
      setMapError('WebGL is not supported on this browser/device. Switched to 2D Tactical View.');
      setMapMode('2d');
      setIsMapLoading(false);
      return;
    }

    try {
      const lngLat = [center[1], center[0]];

      const map = new maplib.Map({
        container: mapContainerRef.current,
        style: buildMapStyle(),
        center: lngLat,
        zoom: currentRegionMeta?.zoom ? currentRegionMeta.zoom - 0.5 : 11.5,
        pitch: 50,
        bearing: -15,
        minZoom: 4,
        maxZoom: 20,
        antialias: true,
      });

      mapRef.current = map;

      // Add Controls
      map.addControl(new maplib.NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new maplib.ScaleControl({ unit: 'metric' }), 'bottom-right');
      map.addControl(new maplib.FullscreenControl(), 'top-right');

      map.on('error', (e) => {
        console.warn('MapLibre runtime notice:', e?.error?.message || e);
      });

      map.on('load', () => {
        try {
          // 3D Terrain DEM exaggeration
          map.setTerrain({
            source: 'terrain',
            exaggeration: 2.0,
          });

          // Zones source + fill & outline layers
          map.addSource('zones', {
            type: 'geojson',
            data: zonesToGeoJSON(zones),
          });

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

          // Heatmap source + layers
          map.addSource('heatmap', {
            type: 'geojson',
            data: heatmapToGeoJSON(DENSITY_HEATMAP_POINTS),
          });

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

          // Roads source + line layers
          map.addSource('roads', {
            type: 'geojson',
            data: roadsToGeoJSON(roads),
          });

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
              'line-dasharray': [
                'case',
                ['==', ['get', 'status'], 'blocked'],
                ['literal', [6, 8]],
                ['literal', [1, 0]],
              ],
            },
          });

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
          }, 'roads-line');

          // Click: Roads
          map.on('click', 'roads-hit', (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            const roadId = feature.properties.id;
            toggleRoadStatus(roadId);

            if (popupRef.current) popupRef.current.remove();
            const isBlocked = feature.properties.status === 'blocked';
            const newStatus = isBlocked ? 'OPEN' : 'BLOCKED';
            popupRef.current = new maplib.Popup({ closeOnClick: true, className: 'sentinel-popup' })
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

          // Click: Zones
          map.on('click', 'zones-fill', (e) => {
            if (!e.features || e.features.length === 0) return;
            const feature = e.features[0];
            setSelectedZoneId(feature.properties.id);
          });

          // Hover: Roads
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

          // Hover: Zones
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
          setIsMapLoading(false);

          // Force canvas resize after mount
          requestAnimationFrame(() => map.resize());
        } catch (err) {
          console.error('Error adding 3D map layers:', err);
          setMapError('Failed to initialize 3D map data layers.');
          setIsMapLoading(false);
        }
      });
    } catch (err) {
      console.error('MapLibre init error:', err);
      setMapError('Could not initialize 3D map renderer.');
      setIsMapLoading(false);
    }

    // ResizeObserver ensures canvas updates when container size changes
    const resizeObserver = new ResizeObserver(() => {
      if (mapRef.current) mapRef.current.resize();
    });

    if (mapContainerRef.current) {
      resizeObserver.observe(mapContainerRef.current);
    }

    // Scheduled resizes after mount to catch tab-switch reflow
    const timer1 = setTimeout(() => mapRef.current?.resize(), 100);
    const timer2 = setTimeout(() => mapRef.current?.resize(), 350);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      resizeObserver.disconnect();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        mapReadyRef.current = false;
      }
    };
  }, [mapMode, center, currentRegionMeta]);

  // Sync MapLibre 3D map layers when zones or roads change
  useEffect(() => {
    if (mapMode !== '3d') return;
    const map = mapRef.current;
    if (!map || !mapReadyRef.current) return;

    const zSource = map.getSource('zones');
    if (zSource) zSource.setData(zonesToGeoJSON(zones));

    const rSource = map.getSource('roads');
    if (rSource) rSource.setData(roadsToGeoJSON(roads));

    if (selectedZoneId) {
      map.setFilter('zones-selected', ['==', ['get', 'id'], selectedZoneId]);
    } else {
      map.setFilter('zones-selected', ['==', ['get', 'id'], '']);
    }
  }, [mapMode, zones, roads, selectedZoneId]);

  // FlyTo camera on region update
  useEffect(() => {
    if (mapMode !== '3d') return;
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
  }, [mapMode, currentRegionMeta]);

  // Trigger resize when sidebar toggles
  useEffect(() => {
    const timer = setTimeout(() => {
      if (mapRef.current) mapRef.current.resize();
    }, 150);
    return () => clearTimeout(timer);
  }, [sidebarOpen]);

  const handleTabClick = (tab) => {
    if (sidebarTab === tab && sidebarOpen) {
      setSidebarOpen(false);
    } else {
      setSidebarTab(tab);
      setSidebarOpen(true);
    }
  };

  const switchMapMode = (mode) => {
    if (mode === mapMode) return;
    setIsMapLoading(true);
    setMapError(null);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
      mapReadyRef.current = false;
    }
    setMapMode(mode);
    setTimeout(() => setIsMapLoading(false), 200);
  };

  return (
    <div className="flex flex-col flex-1 w-full h-full min-h-[calc(100vh-4rem)] overflow-hidden bg-[#0b0f17]">

      {/* Top Banner Control Bar */}
      <div className="bg-[#151c28] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10 shadow-md flex-shrink-0">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              <strong className="text-white">{mapMode === '3d' ? '3D Photorealistic Map' : '2D Tactical View'}:</strong> Click roads to toggle open/blocked · Click zones to view status
            </span>
          </div>

          {/* Map Mode Switcher Toggle */}
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => switchMapMode('3d')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === '3d'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              <span>3D Satellite</span>
            </button>
            <button
              onClick={() => switchMapMode('2d')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                mapMode === '2d'
                  ? 'bg-cyan-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>2D Tactical</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            id="map-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-slate-950" />
            <span>Simulate Road Block</span>
          </button>

          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-all cursor-pointer"
            title={sidebarOpen ? 'Collapse Panel' : 'Expand Panel'}
          >
            {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* ── Main Layout: Map Canvas + Right Sidebar ─────────────────────────── */}
      <div className="flex-1 flex relative overflow-hidden min-h-[450px]">

        {/* Map Container */}
        <div className="flex-1 h-full relative w-full overflow-hidden">

          {/* MODE 1: 3D MapLibre Satellite View */}
          {mapMode === '3d' && (
            <div ref={mapContainerRef} className="absolute inset-0 w-full h-full min-h-full" />
          )}

          {/* MODE 2: 2D Tactical Leaflet View */}
          {mapMode === '2d' && (
            <div className="absolute inset-0 w-full h-full">
              <MapContainer
                center={center}
                zoom={currentRegionMeta?.zoom || 12}
                minZoom={5}
                maxZoom={18}
                zoomControl={true}
                scrollWheelZoom={true}
                className="h-full w-full bg-[#0b0f17]"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  attribution="© CartoDB"
                />

                <LeafletMapViewUpdater center={center} zoom={currentRegionMeta?.zoom} zones={zones} />

                {/* Draw Roads in 2D Mode */}
                {roads.map(road => {
                  const isBlocked = road.status === 'blocked';
                  return (
                    <Polyline
                      key={road.id}
                      positions={road.geometry}
                      eventHandlers={{
                        click: () => toggleRoadStatus(road.id),
                        mouseover: () => setHoveredFeature({ type: 'road', name: road.name, status: road.status }),
                        mouseout: () => setHoveredFeature(null),
                      }}
                      pathOptions={{
                        color: isBlocked ? '#ef4444' : '#38bdf8',
                        weight: isBlocked ? 5 : 4,
                        dashArray: isBlocked ? '6, 8' : null,
                        opacity: 0.9,
                      }}
                    />
                  );
                })}

                {/* Draw Zones in 2D Mode */}
                {zones.map(zone => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <Polygon
                      key={zone.id}
                      positions={zone.geometry}
                      eventHandlers={{
                        click: () => setSelectedZoneId(zone.id),
                        mouseover: () => setHoveredFeature({
                          type: 'zone',
                          name: zone.name,
                          priority: zone.priority,
                          peopleExposed: zone.peopleExposed,
                          severityColor: zone.severityColor,
                        }),
                        mouseout: () => setHoveredFeature(null),
                      }}
                      pathOptions={{
                        color: isSelected ? '#38bdf8' : zone.severityColor,
                        fillColor: zone.severityColor,
                        fillOpacity: zone.severity === 'red' ? 0.45 : zone.severity === 'amber' ? 0.3 : 0.2,
                        weight: isSelected ? 4 : 2,
                      }}
                    />
                  );
                })}
              </MapContainer>
            </div>
          )}

          {/* Loading Overlay */}
          {isMapLoading && !mapError && mapMode === '3d' && (
            <div className="absolute inset-0 z-30 bg-[#0b0f17]/90 backdrop-blur-md flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-2 border-cyan-900 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                </div>
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
                </span>
              </div>
              <div className="text-center space-y-1">
                <h3 className="text-sm font-bold text-white tracking-wide">Loading 3D Map View…</h3>
                <p className="text-xs text-slate-400">ESRI Satellite Imagery · AWS DEM 3D Terrain ({currentRegionMeta?.name || 'Assam'})</p>
              </div>
            </div>
          )}

          {/* Error Fallback Overlay */}
          {mapError && mapMode === '3d' && (
            <div className="absolute inset-0 z-30 bg-[#0b0f17]/95 backdrop-blur-lg flex flex-col items-center justify-center p-6 text-center">
              <div className="max-w-md bg-[#151c28] border border-amber-800/60 p-6 rounded-2xl shadow-2xl space-y-4">
                <div className="p-3 bg-amber-950/60 rounded-full inline-block text-amber-400 border border-amber-800/50">
                  <AlertTriangle className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">3D Map Notice</h3>
                  <p className="text-xs text-slate-300 mt-2">{mapError}</p>
                </div>
                <button
                  onClick={() => switchMapMode('2d')}
                  className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>Switch to 2D Tactical View</span>
                </button>
              </div>
            </div>
          )}

          {/* Hover Tooltip Overlay */}
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

          {/* Map Legend */}
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
            </div>
          </div>

          {/* Map Mode Badge */}
          <div className="absolute top-4 right-16 z-10 bg-cyan-950/80 border border-cyan-800/60 text-cyan-300 text-[10px] font-bold px-2.5 py-1 rounded-full backdrop-blur-sm uppercase tracking-wider">
            {mapMode === '3d' ? '3D Satellite Active' : '2D Tactical Active'}
          </div>
        </div>

        {/* Collapsible Right Sidebar */}
        {sidebarOpen && (
          <div className="w-96 h-full border-l border-slate-800 bg-[#0b0f17] flex flex-col z-10 shadow-2xl flex-shrink-0">

            {/* Sidebar Tab Bar */}
            <div className="flex border-b border-slate-800 bg-[#151c28] flex-shrink-0">
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
                <SidebarSosPanel />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Sidebar-Compact SOS Panel ────────────────────────────────────────────────

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
                <Siren className="w-3.5 h-3.5" />
                Send SOS Alert
              </button>
            </div>
          );
        })}
      </div>

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
                <Siren className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
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
