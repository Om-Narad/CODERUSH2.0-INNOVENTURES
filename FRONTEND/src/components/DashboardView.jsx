import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import StatCards from './StatCards';
import PriorityActionFeed from './PriorityActionFeed';
import AlertsLog from './AlertsLog';
import ResourceTable from './ResourceTable';
import FloodDetector from './FloodDetector';
import { MapContainer, TileLayer, Polygon, Polyline, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe,
  AlertTriangle,
  MapPin,
  Building,
  Home,
  Shield,
  Siren,
  Maximize2,
  Navigation,
  Layers,
  Info,
  CheckCircle2,
  Users,
} from 'lucide-react';

// Leaflet Viewport Auto-Fitter
function LeafletMapViewUpdater({ center, zoom, zones }) {
  const map = useMap();

  React.useEffect(() => {
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
        map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [30, 30] });
      }
    }
  }, [map, center, zoom, zones]);

  React.useEffect(() => {
    const timer = setTimeout(() => { map.invalidateSize(); }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  return null;
}

export default function DashboardView() {
  const {
    currentRegionMeta,
    zones,
    roads,
    stats,
    selectedZoneId,
    setSelectedZoneId,
    toggleRoadStatus,
    simulateRoadBlock,
    setCurrentView,
    sendMassSos,
    sosNotification,
    dismissSosNotification,
  } = useSentinel();

  const [hoveredItem, setHoveredItem] = useState(null);
  const nagpurCenter = currentRegionMeta?.center || [21.1458, 79.0882];

  // Dynamically calculate houses exposed across all zones
  const totalHousesExposed = zones.reduce(
    (sum, z) => sum + (z.housesExposed || Math.round(z.peopleExposed / 5)),
    0
  );

  const criticalZones = zones.filter(z => z.severity === 'red');

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-5 overflow-y-auto h-full w-full font-sans">
      
      {/* ─── Top Header Banner ────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 text-white shadow-md shadow-cyan-500/20 flex-shrink-0">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-900 tracking-tight font-sans">
                Sentinel<span className="text-cyan-600">Plan</span> — Nagpur Flood Command Center
              </h1>
              <span className="text-xs text-cyan-700 font-bold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 uppercase tracking-wide">
                Nagpur (MH)
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl font-medium">
              Real-time Nag River & Pili River flood monitoring, route blockage simulation, and house vulnerability matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto flex-shrink-0">
          <button
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Block</span>
          </button>
          
          <button
            onClick={() => setCurrentView('map')}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 transition-all cursor-pointer active:scale-95"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Map View</span>
          </button>
        </div>
      </div>

      {/* ─── Top Row: 4 Clean Stat Cards ──────────────────────────────────── */}
      <StatCards />

      {/* ─── Main Map-Centric Workspace (3 Columns: Left | Center Map | Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: Priority Zones / Houses List (3 Cols = ~25% Width) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[550px]">
          <PriorityActionFeed />
        </div>

        {/* CENTER COLUMN: Large Central MAP of Nagpur (6 Cols = ~50% Width - MAIN FOCUS) */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[550px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex flex-col h-full shadow-sm relative overflow-hidden">
            
            {/* Map Title Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    Central Nagpur Flood Map
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Live Nag & Pili River Corridors • Click routes to toggle status
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Nagpur Telemetry Online
                </span>
                <button
                  onClick={() => setCurrentView('map')}
                  className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                  title="Expand to Fullscreen Map"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Large Interactive Central Leaflet Map Container */}
            <div className="flex-1 w-full rounded-xl overflow-hidden relative border border-slate-200 min-h-[440px]">
              <MapContainer
                center={nagpurCenter}
                zoom={12}
                zoomControl={true}
                scrollWheelZoom={true}
                className="h-full w-full bg-slate-100 z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                  subdomains="abcd"
                  attribution="© CartoDB"
                />

                <LeafletMapViewUpdater center={nagpurCenter} zoom={12} zones={zones} />

                {/* Draw Nagpur Road Lines */}
                {roads.map(road => {
                  const isBlocked = road.status === 'blocked';
                  return (
                    <Polyline
                      key={road.id}
                      positions={road.geometry}
                      eventHandlers={{
                        click: () => toggleRoadStatus(road.id),
                        mouseover: () => setHoveredItem({ type: 'road', name: road.name, status: road.status }),
                        mouseout: () => setHoveredItem(null),
                      }}
                      pathOptions={{
                        color: isBlocked ? '#ef4444' : '#06b6d4',
                        weight: isBlocked ? 5 : 4,
                        dashArray: isBlocked ? '6, 8' : null,
                        opacity: 0.9,
                      }}
                    />
                  );
                })}

                {/* Draw Nagpur Zone Hazard Polygons */}
                {zones.map(zone => {
                  const isSelected = selectedZoneId === zone.id;
                  return (
                    <Polygon
                      key={zone.id}
                      positions={zone.geometry}
                      eventHandlers={{
                        click: () => setSelectedZoneId(zone.id),
                        mouseover: () => setHoveredItem({
                          type: 'zone',
                          name: zone.name,
                          priority: zone.priority,
                          peopleExposed: zone.peopleExposed,
                          housesExposed: zone.housesExposed || Math.round(zone.peopleExposed / 5),
                          severityColor: zone.severityColor,
                        }),
                        mouseout: () => setHoveredItem(null),
                      }}
                      pathOptions={{
                        color: isSelected ? '#0891b2' : zone.severityColor,
                        fillColor: zone.severityColor,
                        fillOpacity: zone.severity === 'red' ? 0.38 : zone.severity === 'amber' ? 0.25 : 0.16,
                        weight: isSelected ? 4 : 2.5,
                      }}
                    />
                  );
                })}
              </MapContainer>

              {/* Hover Tooltip Overlay */}
              {hoveredItem && (
                <div className="absolute top-3 left-3 z-10 bg-white/95 border border-slate-200 p-2.5 rounded-xl shadow-lg backdrop-blur-xs text-xs pointer-events-none max-w-xs">
                  {hoveredItem.type === 'road' ? (
                    <div>
                      <div className="font-bold text-slate-800">{hoveredItem.name}</div>
                      <div className={`font-semibold mt-0.5 ${hoveredItem.status === 'blocked' ? 'text-rose-600' : 'text-cyan-600'}`}>
                        {hoveredItem.status === 'blocked' ? '⛔ BLOCKED' : '✅ OPEN'} · Click to toggle
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="font-bold text-slate-800">{hoveredItem.name}</div>
                      <div className="text-slate-600 mt-0.5">
                        Priority: <strong style={{ color: hoveredItem.severityColor }}>{hoveredItem.priority}</strong>
                      </div>
                      <div className="text-slate-500 font-mono-numeric">
                        {hoveredItem.housesExposed?.toLocaleString()} houses ({hoveredItem.peopleExposed?.toLocaleString()} residents)
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Map Legend Overlay */}
              <div className="absolute bottom-3 left-3 z-10 bg-white/95 border border-slate-200 p-2.5 rounded-xl shadow-md backdrop-blur-xs text-[11px] space-y-1.5">
                <div className="font-bold text-slate-500 uppercase text-[9px] tracking-wider">Nagpur Map Legend</div>
                <div className="flex items-center space-x-3 text-slate-600">
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span>Critical Zone</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>Warning</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>Stable</span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 pt-1 border-t border-slate-100 text-slate-600">
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-1 bg-cyan-500 rounded" />
                    <span>Open Route</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <span className="w-3 h-1 bg-rose-500 rounded border border-dashed border-rose-300" />
                    <span>Blocked Route</span>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </div>

        {/* RIGHT COLUMN: Key Stats & "Houses" Information Vertical Panel (3 Cols = ~25% Width) */}
        <div className="lg:col-span-3 flex flex-col h-full space-y-4 min-h-[550px]">
          
          {/* Card 1: Houses Information Panel */}
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <Building className="w-4 h-4" />
                </div>
                <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                  Houses Exposure Stats
                </h2>
              </div>
              <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                Nagpur NMC
              </span>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Total Houses Exposed</div>
                  <div className="text-2xl font-extrabold text-slate-900 font-mono-numeric mt-0.5">
                    {totalHousesExposed.toLocaleString()}
                  </div>
                </div>
                <div className="p-2.5 bg-blue-500 text-white rounded-xl shadow-sm">
                  <Home className="w-5 h-5" />
                </div>
              </div>

              {/* Houses Breakdown Table / Badges */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Residential Units</span>
                  <strong className="text-slate-800 font-mono-numeric">
                    {Math.round(totalHousesExposed * 0.8).toLocaleString()} units
                  </strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-blue-500 h-1.5 rounded-full w-[80%]" />
                </div>

                <div className="flex items-center justify-between text-slate-600 pt-1">
                  <span>Commercial & Shops</span>
                  <strong className="text-slate-800 font-mono-numeric">
                    {Math.round(totalHousesExposed * 0.2).toLocaleString()} units
                  </strong>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-1.5">
                  <div className="bg-cyan-500 h-1.5 rounded-full w-[20%]" />
                </div>
              </div>

              {/* Top At-Risk Sector */}
              {zones[0] && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                  <div className="font-bold text-rose-700 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                    <span>Highest Risk Sector</span>
                  </div>
                  <div className="text-slate-800 font-bold mt-1">{zones[0].name}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    {zones[0].housesExposed || Math.round(zones[0].peopleExposed / 5)} houses at high inundation risk
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Live Nagpur Alerts Log */}
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col min-h-[220px]">
            <AlertsLog />
          </div>

          {/* Quick SOS Broadcast Trigger */}
          <button
            onClick={() => sendMassSos(zones)}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer active:scale-95 border border-rose-500"
          >
            <Siren className="w-4 h-4 animate-pulse" />
            <span>Dispatch Emergency Mass SOS</span>
          </button>

        </div>

      </div>

      {/* ─── Bottom Section: Resource Allocation Table ─────────────────────── */}
      <ResourceTable />

      {/* ─── AI Flood Detector / Satellite Analysis Tool ──────────────────── */}
      <FloodDetector />

    </div>
  );
}
