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

  const center = currentRegionMeta?.center || [21.1458, 79.0882];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full shadow-sm relative group">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-500 border border-cyan-100">
            <MapPin className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Zone Preview Map</h2>
            <p className="text-[11px] text-slate-500">{currentRegionMeta?.name || 'Nagpur Sector'} Polygons</p>
          </div>
        </div>
        <button
          onClick={() => setCurrentView('map')}
          className="flex items-center space-x-1 text-xs text-cyan-600 hover:text-cyan-700 font-semibold bg-cyan-50 border border-cyan-200 px-2.5 py-1 rounded-lg transition-all cursor-pointer hover:bg-cyan-100"
        >
          <span>Expand Map</span>
          <Maximize2 className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Mini Leaflet Map Box */}
      <div
        onClick={() => setCurrentView('map')}
        className="relative flex-1 rounded-lg overflow-hidden border border-slate-200 cursor-pointer min-h-[380px] select-none"
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
          {/* Light base map tile */}
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            subdomains="abcd"
          />

          <FitMiniBounds zones={zones} regionMeta={currentRegionMeta} />

          {/* Draw Roads */}
          {roads.map(road => (
            <Polyline
              key={road.id}
              positions={road.geometry}
              pathOptions={{
                color: road.status === 'open' ? '#0891b2' : '#ef4444',
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
        <div className="absolute inset-0 bg-white/10 group-hover:bg-white/5 transition-all flex items-center justify-center pointer-events-none">
          <div className="bg-white/95 border border-cyan-200 text-cyan-700 px-4 py-2 rounded-xl shadow-lg backdrop-blur-md flex items-center space-x-2 opacity-90 group-hover:scale-105 transition-all">
            <Maximize2 className="w-4 h-4 text-cyan-500 animate-pulse" />
            <span className="text-xs font-bold tracking-wide">Click to launch Full Interactive Map View</span>
          </div>
        </div>
      </div>

    </div>
  );
}
