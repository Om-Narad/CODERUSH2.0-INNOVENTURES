import React, { useEffect, useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { MapContainer, TileLayer, Polygon, Polyline, CircleMarker, Popup, Tooltip, useMap } from 'react-leaflet';
import PriorityActionFeed from './PriorityActionFeed';
import { DENSITY_HEATMAP_POINTS } from '../data/mockData';
import { AlertTriangle, PanelRightClose, PanelRightOpen, Navigation, Info } from 'lucide-react';

// Helper component to fit map bounds tightly around all zone polygons when region or zones change
function FitBoundsComponent({ zones, regionMeta }) {
  const map = useMap();

  useEffect(() => {
    if (regionMeta?.center) {
      map.setView(regionMeta.center, regionMeta.zoom || 12);
    }
    if (!zones || zones.length === 0) return;

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
      map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [50, 50] });
    }
  }, [map, zones, regionMeta]);

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

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Dynamic center based on active region
  const center = currentRegionMeta?.center || [26.185, 91.742];
  const zoom = currentRegionMeta?.zoom || 12;

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-[#0b0f17]">
      
      {/* Top Banner Control Bar */}
      <div className="bg-[#151c28] border-b border-slate-800 px-4 py-2.5 flex items-center justify-between z-10 shadow-md">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 text-xs font-mono-numeric">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="text-slate-300">
              <strong className="text-white font-sans">Interactive Evacuation Map:</strong> Click any road line to block/open. Zone scores auto-recalculate.
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-4 text-xs font-mono-numeric text-slate-400">
            <span>Roads: <strong className="text-cyan-400">{roads.filter(r => r.status === 'open').length} Open</strong> / <strong className="text-rose-400">{roads.filter(r => r.status === 'blocked').length} Blocked</strong></span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center space-x-3">
          {/* Guaranteed One-Click Demo Trigger */}
          <button
            id="map-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-extrabold text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4 text-slate-950" />
            <span>Simulate Road Block</span>
          </button>

          {/* Toggle Sidebar Collapse Button */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-cyan-400 hover:border-slate-700 transition-all cursor-pointer"
            title={sidebarOpen ? 'Collapse Priority Feed' : 'Expand Priority Feed'}
          >
            {sidebarOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Main Container: Map + Collapsible Sidebar */}
      <div className="flex-1 flex relative overflow-hidden">
        
        {/* Full-Screen Interactive Leaflet Map */}
        <div className="flex-1 h-full relative">
          <MapContainer
            center={center}
            zoom={13}
            minZoom={11}
            maxZoom={18}
            zoomControl={true}
            className="h-full w-full"
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              subdomains="abcd"
              maxZoom={19}
              attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* Automatically fit bounds around all zone polygons on load */}
            <FitBoundsComponent zones={zones} regionMeta={currentRegionMeta} />

            {/* Population Density Heat Overlay Circles */}
            {DENSITY_HEATMAP_POINTS.map((pt, idx) => (
              <React.Fragment key={`heat-${idx}`}>
                <CircleMarker
                  center={[pt.lat, pt.lng]}
                  radius={36 * pt.intensity}
                  pathOptions={{
                    color: '#ef4444',
                    fillColor: '#ef4444',
                    fillOpacity: 0.18 * pt.intensity,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[pt.lat, pt.lng]}
                  radius={12 * pt.intensity}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.45 * pt.intensity,
                    weight: 0,
                  }}
                >
                  <Tooltip permanent={false} direction="top">
                    <div className="text-xs font-mono-numeric">
                      <strong>{pt.label}</strong> (Density Index: {Math.round(pt.intensity * 100)}%)
                    </div>
                  </Tooltip>
                </CircleMarker>
              </React.Fragment>
            ))}

            {/* Draw Roads (Dual Polylines: Invisible Wide Click Target + Visible Line) */}
            {roads.map(road => {
              const isBlocked = road.status === 'blocked';
              return (
                <React.Fragment key={road.id}>
                  {/* Invisible Wide Hit-Target for Easy Clicking */}
                  <Polyline
                    positions={road.geometry}
                    eventHandlers={{
                      click: () => toggleRoadStatus(road.id),
                    }}
                    pathOptions={{
                      color: '#ffffff',
                      weight: 24,
                      opacity: 0.001,
                      className: 'cursor-pointer',
                    }}
                  />

                  {/* Visible Styled Road Line */}
                  <Polyline
                    positions={road.geometry}
                    eventHandlers={{
                      click: () => toggleRoadStatus(road.id),
                    }}
                    pathOptions={{
                      color: isBlocked ? '#ef4444' : '#38bdf8',
                      weight: isBlocked ? 5 : 5,
                      dashArray: isBlocked ? '8, 10' : null,
                      opacity: 0.95,
                      className: isBlocked ? 'road-blocked-dash cursor-pointer' : 'cursor-pointer',
                    }}
                  >
                    <Tooltip sticky direction="top">
                      <div className="p-1 font-sans text-xs">
                        <div className="flex items-center space-x-1 font-bold text-white">
                          <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                          <span>{road.name}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px] font-mono-numeric">
                          <span className="text-slate-400">Status:</span>
                          <span className={isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {isBlocked ? '⛔ BLOCKED (Click to Open)' : '✅ OPEN (Click to Block)'}
                          </span>
                        </div>
                      </div>
                    </Tooltip>
                    <Popup>
                      <div className="p-2 text-xs space-y-2">
                        <h4 className="font-bold text-white text-sm">{road.name}</h4>
                        <p className="text-slate-300">Type: {road.type}</p>
                        <div className="pt-2 border-t border-slate-700 flex items-center justify-between">
                          <span className="text-slate-400">Current State:</span>
                          <span className={isBlocked ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                            {road.status.toUpperCase()}
                          </span>
                        </div>
                        <button
                          onClick={() => toggleRoadStatus(road.id)}
                          className={`w-full mt-2 py-1.5 rounded text-xs font-bold transition-all ${
                            isBlocked
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-rose-500 hover:bg-rose-400 text-white'
                          }`}
                        >
                          {isBlocked ? 'Re-open Road' : 'Mark Road Blocked'}
                        </button>
                      </div>
                    </Popup>
                  </Polyline>
                </React.Fragment>
              );
            })}

            {/* Draw Zone Polygons */}
            {zones.map(zone => {
              const isSelected = selectedZoneId === zone.id;
              return (
                <Polygon
                  key={zone.id}
                  positions={zone.geometry}
                  eventHandlers={{
                    click: () => setSelectedZoneId(zone.id),
                  }}
                  pathOptions={{
                    color: zone.severityColor,
                    fillColor: zone.severityColor,
                    fillOpacity: isSelected ? 0.65 : zone.severity === 'red' ? 0.45 : zone.severity === 'amber' ? 0.35 : 0.25,
                    weight: isSelected ? 4 : 2,
                    dashArray: isSelected ? '4, 4' : null,
                  }}
                >
                  <Tooltip sticky direction="center">
                    <div className="p-1 text-xs font-sans">
                      <div className="font-bold text-white text-sm">{zone.name}</div>
                      <div className="text-slate-300 mt-0.5 font-mono-numeric">
                        Priority Score: <strong style={{ color: zone.severityColor }}>{zone.priority}</strong>
                      </div>
                      <div className="text-slate-400 text-[11px]">
                        Exposed: {zone.peopleExposed.toLocaleString()} people
                      </div>
                    </div>
                  </Tooltip>
                  <Popup>
                    <div className="p-2 text-xs space-y-2 max-w-xs">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-white text-sm">{zone.name}</h3>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold font-mono-numeric"
                          style={{ backgroundColor: `${zone.severityColor}22`, color: zone.severityColor, borderColor: zone.severityColor }}
                        >
                          PRIORITY {zone.priority}
                        </span>
                      </div>
                      <p className="text-slate-300 italic text-[11px]">"{zone.rationale}"</p>
                      <div className="grid grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-700">
                        <div>
                          <span className="text-slate-400 block">Exposed:</span>
                          <span className="font-bold text-white">{zone.peopleExposed.toLocaleString()}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block">Open Routes:</span>
                          <span className="font-bold text-cyan-400">{zone.roadsOpen} / {zone.totalRoads}</span>
                        </div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

          </MapContainer>

          {/* Map Legend Overlay */}
          <div className="absolute bottom-6 left-6 z-[1000] bg-[#0f1419]/90 border border-slate-800 p-3 rounded-xl backdrop-blur-md shadow-2xl text-xs space-y-2">
            <h4 className="font-bold text-white uppercase text-[10px] tracking-wider text-slate-400">Map Legend</h4>
            <div className="space-y-1.5 text-slate-300 font-mono-numeric">
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-rose-500 animate-pulse"></span>
                <span>Critical Zone (Score &gt;= 75)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                <span>Warning Zone (Score 50 - 74)</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500"></span>
                <span>Stable Zone (Score &lt; 50)</span>
              </div>
              <div className="flex items-center space-x-2 pt-1 border-t border-slate-800">
                <span className="w-4 h-1 bg-cyan-400 rounded"></span>
                <span>Open Evacuation Route</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="w-4 h-1 bg-rose-500 rounded border border-dashed border-rose-300"></span>
                <span>Blocked / Submerged Route</span>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible Right-Side Panel (Priority Action Feed in Sync) */}
        {sidebarOpen && (
          <div className="w-96 h-full border-l border-slate-800 bg-[#0b0f17] p-3 flex flex-col z-10 transition-all shadow-2xl">
            <PriorityActionFeed />
          </div>
        )}

      </div>

    </div>
  );
}
