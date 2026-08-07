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
    if (level === 'Critical') return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
    if (level === 'High') return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
    if (level === 'Moderate') return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 overflow-y-auto h-full w-full">
      
      {/* Active Region Header Banner */}
      <div className="bg-[#151c28] border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-lg gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
            <Globe className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold text-white tracking-wide">
                {currentRegionMeta?.name || 'Guwahati & Brahmaputra Basin'}
              </h1>
              <span className="text-xs text-slate-400 font-semibold px-2 py-0.5 rounded bg-slate-900 border border-slate-800">
                {currentRegionMeta?.country || 'India'}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 max-w-2xl">
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
