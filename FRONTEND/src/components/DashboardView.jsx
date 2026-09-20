import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import StatCards from './StatCards';
import PriorityActionFeed from './PriorityActionFeed';
import AlertsLog from './AlertsLog';
import MiniPreviewMap from './MiniPreviewMap';
import NmcHelplines from './NmcHelplines';
import TacticalDeploymentMatrix from './TacticalDeploymentMatrix';
import NgoDirectory from './NgoDirectory';
import FloodDetector from './FloodDetector';
import {
  Building2,
  AlertTriangle,
  MapPin,
  Shield,
  Siren,
  Maximize2,
  Flame,
  Radio,
  ExternalLink,
} from 'lucide-react';

export default function DashboardView() {
  const {
    zones,
    setCurrentView,
    simulateRoadBlock,
    sendMassSos,
  } = useSentinel();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 overflow-y-auto h-full w-full font-sans bg-[#f8fafc]">
      
      {/* ─── 1. Command Center Top Header Banner (Screenshot 2) ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-2xs gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Nagpur Flood Command Center
              </h1>
              <span className="text-[10px] text-cyan-700 font-extrabold px-2 py-0.5 rounded-full bg-cyan-50 border border-cyan-200 uppercase tracking-wide">
                India
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl font-medium">
              Monsoon Nag River &amp; Gorewada Nullah overflow affecting Manish Nagar, Beltarodi, Ambazari &amp; Mankapur sectors.
            </p>
          </div>
        </div>

        {/* Hazard Level Badge & Action Controls */}
        <div className="flex items-center space-x-3 self-start md:self-auto flex-shrink-0">
          <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-extrabold">
            <AlertTriangle className="w-4 h-4 text-rose-500" />
            <span>Hazard Level: Critical</span>
          </div>

          <button
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Simulate Block</span>
          </button>
        </div>
      </div>

      {/* ─── 2. Top KPI Stat Cards (4 Cards - Screenshot 2) ───────────────────────────── */}
      <StatCards />

      {/* ─── 3. Main 3-Column Command Workspace (Screenshot 2) ────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* Left Col: Priority Action Feed (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col h-full min-h-[500px]">
          <PriorityActionFeed />
        </div>

        {/* Center Col: 2D Reference Risk Map (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full min-h-[500px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-sm relative overflow-hidden justify-between">
            {/* Map Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    2D REFERENCE RISK MAP
                  </span>
                </div>
                <div className="flex items-center space-x-3 text-[11px] text-slate-500 mt-0.5">
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    <span>Red</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Yellow</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Green Zones</span>
                  </span>
                </div>
              </div>

              <button
                onClick={() => setCurrentView('map')}
                className="flex items-center space-x-1 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
              >
                <span>Expand 2D Map</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </button>
            </div>

            {/* Interactive Leaflet 2D Map Canvas */}
            <div className="flex-1 w-full min-h-[380px] rounded-xl overflow-hidden border border-slate-100 relative">
              <MiniPreviewMap height="100%" />
            </div>
          </div>
        </div>

        {/* Right Col: Alerts & Log Telemetry (3 Cols) */}
        <div className="lg:col-span-3 flex flex-col h-full space-y-4 min-h-[500px]">
          <div className="flex-1 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col min-h-[420px]">
            <AlertsLog />
          </div>

          <button
            onClick={() => sendMassSos(zones)}
            className="w-full flex items-center justify-center space-x-2 py-3 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-extrabold text-xs shadow-md shadow-rose-200 transition-all cursor-pointer active:scale-95 border border-rose-500"
          >
            <Siren className="w-4 h-4 animate-pulse" />
            <span>Dispatch Emergency Mass SOS</span>
          </button>
        </div>

      </div>

      {/* ─── 4. NMC Disaster Control Services (Helplines Grid - Screenshot 3) ─────────────── */}
      <NmcHelplines />

      {/* ─── 5. Resource & Tactical Deployment Matrix (Screenshot 4) ────────────────────── */}
      <TacticalDeploymentMatrix />

      {/* ─── 6. Nagpur Disaster Relief NGOs Directory (Screenshots 1 & 5) ───────────────── */}
      <NgoDirectory />

      {/* ─── 7. AI Flood Detector / Satellite ML Inference Tool ─────────────────────────── */}
      <FloodDetector />

    </div>
  );
}
