import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import StatCards from './StatCards';
import PriorityActionFeed from './PriorityActionFeed';
import AlertsLog from './AlertsLog';
import ResourceTable from './ResourceTable';
import FloodDetector from './FloodDetector';
import Nagpur3DMap from './Nagpur3DMap';
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

  // Dynamically calculate houses exposed across all zones
  const totalHousesExposed = zones.reduce(
    (sum, z) => sum + (z.housesExposed || Math.round(z.peopleExposed / 5)),
    0
  );

  const highestRiskZone = [...zones].sort((a, b) => (b.priority || 0) - (a.priority || 0))[0];

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
              Real-time Nag &amp; Pili River monitoring, route-blockage simulation, and house-vulnerability matrix.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 self-start md:self-auto flex-shrink-0">
          <button
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-extrabold shadow-md shadow-amber-500/20 transition-all cursor-pointer active:scale-95"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Route Block</span>
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

      {/* ─── Main Map-Centric Workspace (3 Columns: Left | Center 3D Map | Right) ─ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT COLUMN: Priority Action Feed & Sector Cards (3 Cols = ~25% Width) */}
        <div className="lg:col-span-3 flex flex-col h-full min-h-[560px]">
          <PriorityActionFeed />
        </div>

        {/* CENTER COLUMN: Realistic Interactive 3D Map of Nagpur (6 Cols = ~50% Width - MAIN FOCUS) */}
        <div className="lg:col-span-6 flex flex-col h-full min-h-[560px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-3 flex flex-col h-full shadow-sm relative overflow-hidden">
            
            {/* Map Sub-Header Bar */}
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 mb-2.5 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-cyan-50 text-cyan-600 border border-cyan-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-800 tracking-wider uppercase">
                    Central Nagpur 3D Terrain &amp; River Map
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Live Nag &amp; Pili River Basins • 3D Buildings &amp; Inundation Elevation Simulator
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-1" />
                  Telemetry Active
                </span>
              </div>
            </div>

            {/* Hardware-Accelerated 3D WebGL Map Component */}
            <div className="flex-1 w-full min-h-[480px]">
              <Nagpur3DMap height="100%" />
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
