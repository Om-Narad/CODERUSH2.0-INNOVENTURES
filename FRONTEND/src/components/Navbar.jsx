import React, { useState, useRef, useEffect } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Shield, LayoutDashboard, MapPin, AlertTriangle, Activity, Globe, ChevronDown, Check, Siren } from 'lucide-react';

export default function Navbar() {
  const {
    currentView,
    setCurrentView,
    simulateRoadBlock,
    currentRegionId,
    currentRegionMeta,
    availableRegions,
    switchRegion,
    zones,
  } = useSentinel();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Count of critical zones — used for SOS badge
  const criticalZoneCount = zones.filter(z => z.severity === 'red').length;

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const regionsList = availableRegions.length > 0 ? availableRegions : [
    { id: 'assam', name: 'Guwahati & Brahmaputra Basin', country: 'India', hazard_level: 'Critical' },
    { id: 'bangladesh', name: 'Sylhet & Surma River Basin', country: 'Bangladesh', hazard_level: 'Critical' },
    { id: 'spain', name: 'Valencia & Turia River Basin', country: 'Spain', hazard_level: 'High' },
    { id: 'brazil', name: 'Rio Grande do Sul & Jacuí Basin', country: 'Brazil', hazard_level: 'Critical' },
    { id: 'usa', name: 'Kentucky & Mississippi Basin', country: 'USA', hazard_level: 'Moderate' },
    { id: 'global', name: 'Global Overview (Active Disasters)', country: 'Worldwide', hazard_level: 'Global Watch' },
  ];

  const getHazardBadge = (level) => {
    if (level === 'Critical') return 'bg-rose-50 text-rose-600 border-rose-200';
    if (level === 'High') return 'bg-amber-50 text-amber-600 border-amber-200';
    if (level === 'Moderate') return 'bg-blue-50 text-blue-600 border-blue-200';
    return 'bg-cyan-50 text-cyan-600 border-cyan-200';
  };

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
                Sentinel<span className="text-cyan-500">Plan</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-50 text-cyan-600 border border-cyan-200 uppercase tracking-wider">
                Global Multi-Region
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium tracking-wide flex items-center space-x-1">
              <span>Real-Time Flood Command Center</span>
            </p>
          </div>
        </div>

        {/* Region Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="region-select-btn"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-cyan-400 text-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-500 animate-pulse" />
            <div className="text-left hidden md:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Active Region</div>
              <div className="text-xs font-bold text-slate-800 max-w-[170px] truncate">
                {currentRegionMeta?.name || 'Guwahati & Brahmaputra'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-cyan-500 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-12 left-0 md:left-auto md:right-0 w-72 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 divide-y divide-slate-100">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-600 flex items-center justify-between">
                <span>Select Flood Monitoring Zone</span>
                <span className="text-slate-400">{regionsList.length} Available</span>
              </div>
              <div className="max-h-64 overflow-y-auto py-1 space-y-0.5">
                {regionsList.map((r) => {
                  const isSelected = r.id === currentRegionId;
                  return (
                    <button
                      key={r.id}
                      onClick={() => {
                        switchRegion(r.id);
                        setDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-50 border-l-2 border-cyan-500 text-cyan-700'
                          : 'hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="font-bold flex items-center space-x-1.5">
                          <span>{r.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400">{r.country}</div>
                      </div>
                      <div className="flex items-center space-x-1.5 flex-shrink-0">
                        <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded border ${getHazardBadge(r.hazard_level)}`}>
                          {r.hazard_level}
                        </span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-500" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* ── View Switcher Tabs (Dashboard | Map View | SOS Alerts) ────────── */}
        <nav className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
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
            {/* Critical zone count badge */}
            {criticalZoneCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full bg-rose-500 text-white text-[9px] font-black animate-pulse shadow-lg shadow-rose-700/50">
                {criticalZoneCount}
              </span>
            )}
          </button>
        </nav>

        {/* Quick Action & System Status */}
        <div className="flex items-center space-x-2">
          <button
            id="nav-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Simulate road closure in selected region"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Simulate Block</span>
          </button>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 text-xs font-mono-numeric">
            <Activity className="w-3 h-3 animate-pulse text-emerald-500" />
            <span>LIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
