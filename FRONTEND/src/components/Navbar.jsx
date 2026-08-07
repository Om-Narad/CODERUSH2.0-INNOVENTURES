import React, { useState, useRef, useEffect } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { Shield, LayoutDashboard, MapPin, AlertTriangle, Activity, Globe, ChevronDown, Check } from 'lucide-react';

export default function Navbar() {
  const {
    currentView,
    setCurrentView,
    simulateRoadBlock,
    currentRegionId,
    currentRegionMeta,
    availableRegions,
    switchRegion
  } = useSentinel();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    if (level === 'Critical') return 'bg-rose-950/80 text-rose-300 border-rose-800/60';
    if (level === 'High') return 'bg-amber-950/80 text-amber-300 border-amber-800/60';
    if (level === 'Moderate') return 'bg-blue-950/80 text-blue-300 border-blue-800/60';
    return 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60';
  };

  return (
    <header className="bg-[#0f1419]/95 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-50 transition-colors shadow-xl">
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
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                Sentinel<span className="text-cyan-400">Plan</span>
              </span>
              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800/60 uppercase tracking-wider">
                Global Multi-Region
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium tracking-wide flex items-center space-x-1">
              <span>Real-Time Flood Command Center</span>
            </p>
          </div>
        </div>

        {/* Region Selector Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            id="region-select-btn"
            onClick={() => setDropdownOpen(prev => !prev)}
            className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900 border border-cyan-500/40 hover:border-cyan-400 text-slate-200 text-xs font-semibold shadow-md transition-all cursor-pointer"
          >
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
            <div className="text-left hidden md:block">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Active Region</div>
              <div className="text-xs font-bold text-white max-w-[170px] truncate">
                {currentRegionMeta?.name || 'Guwahati & Brahmaputra'}
              </div>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-cyan-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {dropdownOpen && (
            <div className="absolute top-12 left-0 md:left-auto md:right-0 w-72 bg-[#121824] border border-slate-700/80 rounded-xl shadow-2xl z-50 py-2 divide-y divide-slate-800/80">
              <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-cyan-400 flex items-center justify-between">
                <span>Select Flood Monitoring Zone</span>
                <span className="text-slate-500">{regionsList.length} Available</span>
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
                          ? 'bg-cyan-950/70 border-l-2 border-cyan-400 text-cyan-200'
                          : 'hover:bg-slate-800/60 text-slate-300'
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
                        {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* View Switcher Tabs */}
        <nav className="hidden sm:flex items-center bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            id="nav-dashboard-btn"
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            id="nav-mapview-btn"
            onClick={() => setCurrentView('map')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 cursor-pointer ${
              currentView === 'map'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <MapPin className="w-3.5 h-3.5" />
            <span>Map View</span>
          </button>
        </nav>

        {/* Quick Action & System Status */}
        <div className="flex items-center space-x-2">
          <button
            id="nav-simulate-btn"
            onClick={simulateRoadBlock}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold tracking-wide transition-all shadow-sm active:scale-95 cursor-pointer"
            title="Simulate road closure in selected region"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Simulate Block</span>
          </button>

          <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono-numeric">
            <Activity className="w-3 h-3 animate-pulse text-emerald-400" />
            <span>LIVE</span>
          </div>
        </div>

      </div>
    </header>
  );
}
