import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import StatCards from './StatCards';
import PriorityActionFeed from './PriorityActionFeed';
import MiniPreviewMap from './MiniPreviewMap';
import AlertsLog from './AlertsLog';
import ResourceTable from './ResourceTable';
import FloodDetector from './FloodDetector';
import { Globe, AlertTriangle, ShieldCheck, MapPin } from 'lucide-react';

export default function DashboardView() {
  const { currentRegionMeta } = useSentinel();

  const getBadgeStyle = (level) => {
    if (level === 'Critical') return 'bg-rose-50 text-rose-600 border-rose-200';
    if (level === 'High') return 'bg-amber-50 text-amber-600 border-amber-200';
    if (level === 'Moderate') return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-cyan-50 text-cyan-600 border-cyan-200';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto h-full w-full">
      
      {/* Active Region Header Banner */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-sm gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-500">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-slate-800 tracking-wide">
                {currentRegionMeta?.name || 'Guwahati & Brahmaputra Basin'}
              </h1>
              <span className="text-xs text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-50 border border-slate-200">
                {currentRegionMeta?.country || 'India'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl">
              {currentRegionMeta?.description || 'Active real-time flood telemetry & dynamic route re-scoring.'}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto">
          <span className={`px-3 py-1 text-xs font-bold rounded-lg border flex items-center space-x-1.5 ${getBadgeStyle(currentRegionMeta?.hazard_level)}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Hazard Level: {currentRegionMeta?.hazard_level || 'Critical'}</span>
          </span>
        </div>
      </div>

      {/* Top Row: 4 Stat Cards */}
      <StatCards />

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT Column (40% width -> 5 cols in 12-grid) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <PriorityActionFeed />
        </div>

        {/* CENTER Column (35% width -> 4 cols in 12-grid) */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <MiniPreviewMap />
        </div>

        {/* RIGHT Column (25% width -> 3 cols in 12-grid) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[500px]">
          <AlertsLog />
        </div>

      </div>

      {/* Bottom: Resource Allocation Table */}
      <ResourceTable />

      {/* AI Flood Detection Panel */}
      <FloodDetector />

    </div>
  );
}
