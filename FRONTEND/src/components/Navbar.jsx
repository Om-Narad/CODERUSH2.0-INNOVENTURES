import React, { useState } from 'react';
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
  Globe,
  ChevronDown,
  LogIn,
} from 'lucide-react';

export default function Navbar() {
  const {
    currentView,
    setCurrentView,
    simulateRoadBlock,
    user,
    logout,
    zones,
    isAuthenticated,
  } = useSentinel();

  const [selectedSector, setSelectedSector] = useState('Nagpur Flood Command Center');

  // Count of critical zones — used for SOS badge
  const criticalZoneCount = zones.filter(z => z.severity === 'red').length || 5;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-50 transition-colors shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        
        {/* Brand Logo & Subtitle */}
        <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('dashboard')}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/20 text-white font-bold flex-shrink-0">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-extrabold tracking-tight text-slate-900 font-sans">
                Nagpur<span className="text-cyan-600">DisasterPortal</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wide">
                NAGPUR MUNICIPAL PORTAL
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium tracking-wide">
              NMC Monsoon &amp; Flood Command Center
            </p>
          </div>
        </div>

        {/* Selected Sector Selector Dropdown */}
        <div className="hidden xl:flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 space-x-2 text-xs">
          <Globe className="w-3.5 h-3.5 text-cyan-600" />
          <div>
            <div className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">SELECTED SECTOR</div>
            <div className="text-slate-800 font-bold flex items-center space-x-1 cursor-pointer">
              <span>{selectedSector}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        </div>

        {/* View Switcher Tabs (Dashboard | Map View | SOS Alerts | Auth) */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner space-x-1">
          {/* Dashboard */}
          <button
            id="nav-dashboard-btn"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-white text-cyan-600 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          {/* Map View */}
          <button
            id="nav-mapview-btn"
            onClick={() => setCurrentView('map')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'map'
                ? 'bg-white text-cyan-600 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>

          {/* Drainage Network */}
          <button
            id="nav-drainage-btn"
            onClick={() => setCurrentView('drainage')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'drainage'
                ? 'bg-white text-blue-600 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-600" />
            <span>Drainage Network</span>
          </button>

          {/* SOS Alerts Tab */}
          <button
            id="nav-sos-btn"
            onClick={() => setCurrentView('sos')}
            className={`relative flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              currentView === 'sos'
                ? 'bg-white text-rose-600 border border-slate-200 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
            }`}
          >
            <Siren className="w-3.5 h-3.5" />
            <span>SOS Alerts</span>
            {criticalZoneCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse shadow-md">
                {criticalZoneCount}
              </span>
            )}
          </button>

          {/* Auth Button */}
          {!isAuthenticated ? (
            <button
              onClick={() => setCurrentView('login')}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-white/60 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5 text-cyan-600" />
              <span>Sign In / Auth</span>
            </button>
          ) : (
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </nav>

        {/* Action Controls & Live Indicator */}
        <div className="flex items-center space-x-2">
          <button
            id="nav-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 text-xs font-bold transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Simulate road closure in Nagpur region"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden md:inline">Simulate Block</span>
          </button>

          <div className="hidden sm:flex items-center space-x-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
            <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
            <span>LIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
}

