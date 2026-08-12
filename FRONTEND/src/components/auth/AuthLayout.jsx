import React from 'react';
import { Shield, Activity, Globe, Lock, ArrowLeft } from 'lucide-react';

/**
 * AuthLayout component serving as the brand visual shell for Login and Signup pages.
 * Matches SentinelPlan design system with map visual motifs and badge branding.
 */
export default function AuthLayout({ children, currentMode, onToggleMode, onGoToDashboard }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-blue-500 selection:text-white">
      
      {/* ─── Background Visual Motif (Faint Topo Map + Grid + Blue Gradients) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial Gradients */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-600/5 blur-[120px]" />

        {/* Faint Tech Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        {/* Subtle Faint World / Flood Map SVG Lines */}
        <svg className="absolute -right-20 top-1/4 w-[600px] h-[600px] text-blue-600/10 opacity-40 pointer-events-none hidden md:block" viewBox="0 0 500 500" fill="none" stroke="currentColor">
          {/* Topographical Contour Polygons */}
          <path d="M50 200 Q150 120 250 220 T450 180" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M30 250 Q170 180 270 280 T470 230" strokeWidth="2" />
          <path d="M80 300 Q190 230 290 320 T480 290" strokeWidth="1.5" strokeDasharray="6 6" />
          <path d="M120 350 Q220 280 320 370 T490 340" strokeWidth="1" />
          {/* Hazard Polygon Nodes */}
          <circle cx="250" cy="220" r="4" fill="#2563EB" opacity="0.3" />
          <circle cx="270" cy="280" r="5" fill="#EF4444" opacity="0.4" />
          <circle cx="290" cy="320" r="3" fill="#F59E0B" opacity="0.4" />
          <polygon points="200,180 300,160 350,240 280,290 210,250" stroke="#2563EB" strokeWidth="1" strokeDasharray="3 3" fill="#2563EB" fillOpacity="0.03" />
          <polygon points="260,260 380,240 420,330 320,360 250,310" stroke="#EF4444" strokeWidth="1" strokeDasharray="4 4" fill="#EF4444" fillOpacity="0.02" />
        </svg>

        {/* Left Side Faint Radar Rings */}
        <svg className="absolute -left-20 bottom-10 w-[450px] h-[450px] text-cyan-600/10 opacity-30 pointer-events-none hidden md:block" viewBox="0 0 400 400" fill="none" stroke="currentColor">
          <circle cx="200" cy="200" r="180" strokeWidth="1" strokeDasharray="4 4" />
          <circle cx="200" cy="200" r="120" strokeWidth="1.5" />
          <circle cx="200" cy="200" r="60" strokeWidth="1" strokeDasharray="2 2" />
          <line x1="200" y1="20" x2="200" y2="380" strokeWidth="1" strokeDasharray="4 4" />
          <line x1="20" y1="200" x2="380" y2="200" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* ─── Top Navigation Header ─── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {/* Back to Live Dashboard Button (if handler provided) */}
        {onGoToDashboard ? (
          <button
            onClick={onGoToDashboard}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-blue-600 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Command Center View</span>
          </button>
        ) : (
          <div />
        )}

        {/* Status Pills */}
        <div className="flex items-center space-x-2">
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-blue-50 text-blue-600 border border-blue-200 uppercase">
            <Globe className="w-3 h-3 mr-1 text-blue-500" />
            GLOBAL MULTI-REGION
          </span>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>LIVE OPERATIONAL</span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container (Centered Card) ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        
        {/* BRAND LOGO & WORDMARK (Centered Above Card) */}
        <div className="flex flex-col items-center mb-6 text-center space-y-2">
          {/* Badge with White Shield + Pulsing Active Dot */}
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-xl shadow-blue-600/30 text-white flex-shrink-0">
            <Shield className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 ring-2 ring-white" />
            </span>
          </div>

          {/* Wordmark */}
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Sentinel<span className="text-blue-600">Plan</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
              Real-Time Flood Command Center
            </p>
          </div>
        </div>

        {/* Dynamic Auth Card Content */}
        <div className="w-full max-w-md transition-all duration-300">
          {children}
        </div>
      </main>

      {/* ─── Institutional Security Footer ─── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <Lock className="w-3.5 h-3.5 text-blue-600" />
          <span>AES-256 Encrypted • Official Disaster Officer Console</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500">
          <a href="#terms" className="hover:text-blue-600 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="#privacy" className="hover:text-blue-600 transition-colors">Data Usage Policy</a>
          <span>•</span>
          <a href="#support" className="hover:text-blue-600 transition-colors">Help Desk</a>
        </div>
      </footer>
    </div>
  );
}
