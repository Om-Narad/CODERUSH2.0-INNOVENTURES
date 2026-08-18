import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import {
  Shield,
  LayoutDashboard,
  MapPin,
  AlertTriangle,
  Activity,
  Siren,
  LogOut,
  User,
  Box,
} from 'lucide-react';

export default function Navbar() {
  const {
    currentView,
    setCurrentView,
    simulateRoadBlock,
    user,
    logout,
    zones,
  } = useSentinel();

  // Count of critical zones — used for SOS badge
  const criticalZoneCount = zones.filter(z => z.severity === 'red').length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 transition-colors shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Title */}
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
              <span className="text-xl font-bold tracking-tight text-slate-800 font-sans">
                Nagpur<span className="text-cyan-500">FloodSafe</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
                Nagpur (MH)
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-wide flex items-center space-x-1">
              <span>Nagpur Real-Time Flood Command Center</span>
            </p>
          </div>
        </div>

        {/* View Switcher Tabs (Dashboard | Map View | 3D Architecture | SOS Alerts) */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner space-x-1">
          {/* Dashboard */}
          <button
            id="nav-dashboard-btn"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-white text-cyan-600 border border-slate-200 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* Map View */}
          <button
            id="nav-mapview-btn"
            onClick={() => setCurrentView('map')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'map'
                ? 'bg-white text-cyan-600 border border-slate-200 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          {/* 3D Architecture */}
          <button
            id="nav-architecture-btn"
            onClick={() => setCurrentView('architecture')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'architecture'
                ? 'bg-slate-900 text-cyan-400 border border-cyan-500/50 shadow-md font-bold'
                : 'text-slate-600 hover:text-cyan-600 hover:bg-white/60'
            }`}
          >
            <Box className="w-3.5 h-3.5 text-cyan-500" />
            <span className="font-semibold">3D Architecture</span>
          </button>

          {/* SOS Alerts Tab */}
          <button
            id="nav-sos-btn"
            onClick={() => setCurrentView('sos')}
            className={`relative flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'sos'
                ? 'bg-white text-rose-500 border border-slate-200 shadow-sm font-bold'
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/60'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>SOS Alerts</span>
            {criticalZoneCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse shadow-lg shadow-rose-700/50">
                {criticalZoneCount}
              </span>
            )}
          </button>
        </nav>

        {/* Quick Action, Officer Profile & Logout */}
        <div className="flex items-center space-x-3">
          <button
            id="nav-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Simulate road closure in Nagpur region"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Simulate Block</span>
          </button>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-mono-numeric">
            <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
            <span>LIVE</span>
          </div>

          {/* User Profile & Logout */}
          <div className="flex items-center space-x-2 border-l border-slate-200 pl-3">
            <div className="hidden md:block text-right">
              <div className="text-xs font-bold text-slate-800 leading-tight truncate max-w-[140px]">
                {user?.name || 'Commander Sharma'}
              </div>
              <div className="text-[10px] text-slate-400 font-medium">
                {user?.role || 'Nagpur Disaster Officer'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-700 font-bold text-xs">
              <User className="w-4 h-4" />
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </header>
  );
}
