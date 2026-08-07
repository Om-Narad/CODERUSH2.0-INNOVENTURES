import React, { useEffect } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { MapContainer, TileLayer, Polygon, Polyline, useMap } from 'react-leaflet';
import { Maximize2, MapPin } from 'lucide-react';

function FitMiniBounds({ zones, regionMeta }) {
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
      map.fitBounds([[minLat, minLng], [maxLat, maxLng]], { padding: [30, 30] });
    }
  }, [map, zones, regionMeta]);

  return null;
}

export default function MiniPreviewMap() {
  const { zones, roads, currentRegionMeta, setCurrentView } = useSentinel();

  const center = currentRegionMeta?.center || [26.185, 91.742];

  return (
    <div className="bg-[#151c28] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-lg relative group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Zone Preview Map</h2>
            <p className="text-[11px] text-slate-400">{currentRegionMeta?.name || 'Assam Sector'} Polygons</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('map')}
          className="flex items-center space-x-1 text-xs text-cyan-400 hover:text-cyan-300 font-semibold bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
        >
          <span>Expand Map</span>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Leaflet Map Box */}
      <div
        onClick={() => setCurrentView('map')}
        className="relative flex-1 rounded-lg overflow-hidden border border-slate-800 cursor-pointer min-h-[380px] select-none"
      >
        <MapContainer
          center={center}
          zoom={13}
          minZoom={11}
          maxZoom={18}
          zoomControl={false}
          dragging={false}
          doubleClickZoom={false}
          scrollWheelZoom={false}
          attributionControl={false}
          className="h-full w-full pointer-events-none"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          <FitMiniBounds zones={zones} regionMeta={currentRegionMeta} />

          {/* Draw Roads */}
          {roads.map(road => (
            <Polyline
              key={road.id}
              positions={road.geometry}
              pathOptions={{
                color: road.status === 'open' ? '#38bdf8' : '#ef4444',
                weight: 3,
                dashArray: road.status === 'open' ? null : '6, 6',
                opacity: 0.85,
              }}
            />
          ))}

          {/* Draw Zone Polygons */}
          {zones.map(zone => (
            <Polygon
              key={zone.id}
              positions={zone.geometry}
              pathOptions={{
                color: zone.severityColor,
                fillColor: zone.severityColor,
                fillOpacity: zone.severity === 'red' ? 0.45 : zone.severity === 'amber' ? 0.35 : 0.25,
                weight: 2,
              }}
            />
          ))}
        </MapContainer>

        {/* Hover Overlay Banner */}
        <div className="absolute inset-0 bg-slate-950/30 group-hover:bg-slate-950/10 transition-all flex items-center justify-center pointer-events-none">
          <div className="bg-[#0f1419]/90 border border-cyan-500/40 text-cyan-300 px-4 py-2 rounded-xl shadow-xl backdrop-blur-md flex items-center space-x-2 opacity-90 group-hover:scale-105 transition-all">
            <Maximize2 className="w-4 h-4 text-cyan-400 animate-pulse" />
            <span className="text-xs font-bold tracking-wide">Click to launch Full Interactive Map View</span>
          </div>
        </div>
      </div>

    </div>
  );
}
