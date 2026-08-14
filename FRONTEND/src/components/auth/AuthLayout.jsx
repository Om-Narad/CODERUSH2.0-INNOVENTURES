import React from 'react';
import { Shield, MapPin, Lock, ArrowLeft } from 'lucide-react';

/**
 * AuthLayout component serving as the brand visual shell for Login and Signup pages.
 * Tailored specifically for Nagpur Flood Command Center.
 */
export default function AuthLayout({ children, currentMode, onToggleMode, onGoToDashboard }) {
  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col justify-between relative overflow-hidden font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* ─── Background Visual Motif (Faint Topo Map + Grid + Cyan Gradients) ─── */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Soft Radial Gradients */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-blue-500/10 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-cyan-600/5 blur-[120px]" />

        {/* Faint Tech Grid Pattern */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.03]" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
          <defs>
            <pattern id="auth-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#auth-grid)" />
        </svg>

        {/* Faint Flood Lines */}
        <svg className="absolute -right-20 top-1/4 w-[600px] h-[600px] text-cyan-600/10 opacity-40 pointer-events-none hidden md:block" viewBox="0 0 500 500" fill="none" stroke="currentColor">
          <path d="M50 200 Q150 120 250 220 T450 180" strokeWidth="1.5" strokeDasharray="4 4" />
          <path d="M30 250 Q170 180 270 280 T470 230" strokeWidth="2" />
          <path d="M80 300 Q190 230 290 320 T480 290" strokeWidth="1.5" strokeDasharray="6 6" />
          <circle cx="250" cy="220" r="4" fill="#06B6D4" opacity="0.4" />
          <circle cx="270" cy="280" r="5" fill="#EF4444" opacity="0.5" />
          <polygon points="200,180 300,160 350,240 280,290 210,250" stroke="#06B6D4" strokeWidth="1" strokeDasharray="3 3" fill="#06B6D4" fillOpacity="0.03" />
        </svg>
      </div>

      {/* ─── Top Navigation Header ─── */}
      <header className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        {onGoToDashboard ? (
          <button
            onClick={onGoToDashboard}
            className="inline-flex items-center space-x-2 text-xs font-semibold text-slate-600 hover:text-cyan-600 bg-white/80 hover:bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Command Center</span>
          </button>
        ) : (
          <div />
        )}

        <div className="flex items-center space-x-2">
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase">
            <MapPin className="w-3 h-3 mr-1 text-cyan-600" />
            NAGPUR, MAHARASHTRA
          </span>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span>SYSTEM ACTIVE</span>
          </div>
        </div>
      </header>

      {/* ─── Main Content Container ─── */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-4 py-8 sm:px-6">
        {/* BRAND LOGO & WORDMARK */}
        <div className="flex flex-col items-center mb-6 text-center space-y-2">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/30 text-white flex-shrink-0">
            <Shield className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500 ring-2 ring-white" />
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
              Sentinel<span className="text-cyan-500">Plan</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium tracking-wide mt-0.5">
              Nagpur Flood Command Center
            </p>
          </div>
        </div>

        {/* Dynamic Auth Card */}
        <div className="w-full max-w-md transition-all duration-300">
          {children}
        </div>
      </main>

      {/* ─── Institutional Security Footer ─── */}
      <footer className="relative z-10 w-full max-w-7xl mx-auto px-4 py-4 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white/40 backdrop-blur-xs flex flex-col sm:flex-row items-center justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-1.5 text-slate-500">
          <Lock className="w-3.5 h-3.5 text-cyan-600" />
          <span>Nagpur Municipal Corporation (NMC) Disaster Control Console</span>
        </div>
        <div className="flex items-center space-x-4 text-slate-500">
          <span>Terms of Service</span>
          <span>•</span>
          <span>NMC Data Protocol</span>
          <span>•</span>
          <span>Emergency Support</span>
        </div>
      </footer>
    </div>
  );
}
