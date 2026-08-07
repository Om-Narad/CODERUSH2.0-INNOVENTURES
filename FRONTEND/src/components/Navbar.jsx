import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { DEMO_SCENARIO_SUBTITLE } from '../data/mockData';
import { Shield, LayoutDashboard, MapPin, AlertTriangle, Activity } from 'lucide-react';

export default function Navbar() {
  const { currentView, setCurrentView, simulateRoadBlock } = useSentinel();

  return (
    <header className="bg-[#0f1419]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 transition-colors shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo, Title & Demo Subtitle */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/20 text-white font-bold flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Sentinel<span className="text-cyan-400">Plan</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase tracking-wider">
                v2.0 Command Center
              </span>
            </div>
            {/* Subtitle with Scenario Location Context */}
            <p className="text-xs text-amber-400/90 font-medium tracking-wide">
              {DEMO_SCENARIO_SUBTITLE}
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            id="nav-dashboard-btn"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-mapview-btn"
            onClick={() => setCurrentView('map')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'map'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-4 h-4" />
            <span>Map View</span>
          </button>
        </nav>

        {/* Quick Action & System Status */}
        <div className="flex items-center space-x-3">
          <button
            id="nav-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Simulate a road closure to trigger live re-scoring"
          >
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Simulate Road Block</span>
            <span className="sm:hidden">Simulate</span>
          </button>

          <div className="hidden lg:flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono-numeric">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
