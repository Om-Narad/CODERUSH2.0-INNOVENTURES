import React from 'react';
import { NMC_HELPLINES } from '../data/mockData';
import {
  Building2,
  PhoneCall,
  MapPin,
  ShieldAlert,
  Flame,
  Building,
  Waves,
  Shield,
  Ambulance,
} from 'lucide-react';

export default function NmcHelplines() {
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'CONTROL ROOM':
        return <Building className="w-4 h-4 text-cyan-600" />;
      case 'FIRE & RESCUE':
        return <Flame className="w-4 h-4 text-rose-500" />;
      case 'DISTRICT COMMAND':
        return <ShieldAlert className="w-4 h-4 text-amber-600" />;
      case 'FLOOD CONTROL':
        return <Waves className="w-4 h-4 text-blue-600" />;
      case 'POLICE & TRAFFIC':
        return <Shield className="w-4 h-4 text-indigo-600" />;
      case 'MEDICAL':
        return <Ambulance className="w-4 h-4 text-emerald-600" />;
      default:
        return <PhoneCall className="w-4 h-4 text-cyan-600" />;
    }
  };

  const handleCall = (number) => {
    window.location.href = `tel:${number.replace(/[^0-9+]/g, '')}`;
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* ─── Header Section ──────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-50 border border-cyan-100 text-cyan-600 flex-shrink-0">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                Nagpur Municipal Corporation (NMC) Disaster Control Services
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Direct emergency contact lines for NMC control rooms, fire stations, flood monitoring cell &amp; DEOC Collectorate
            </p>
          </div>
        </div>

        <span className="self-start sm:self-auto inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 uppercase tracking-wider">
          OFFICIAL NMC HELPLINES
        </span>
      </div>

      {/* ─── Helplines Grid (6 Cards) ────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {NMC_HELPLINES.map((item) => (
          <div
            key={item.id}
            className="bg-slate-50/70 border border-slate-200 hover:border-cyan-300 rounded-2xl p-4 flex flex-col justify-between transition-all hover:shadow-md group"
          >
            <div>
              {/* Category Badge & Icon */}
              <div className="flex items-center space-x-2 mb-2">
                <div className="p-1 rounded-lg bg-white border border-slate-200 shadow-2xs">
                  {getCategoryIcon(item.category)}
                </div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  {item.category}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-xs font-extrabold text-slate-800 leading-snug group-hover:text-cyan-700 transition-colors">
                {item.title}
              </h3>

              {/* Description */}
              <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">
                {item.description}
              </p>

              {/* Address */}
              <div className="flex items-start space-x-1.5 mt-3 text-[11px] text-slate-600">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 flex-shrink-0" />
                <span>{item.address}</span>
              </div>
            </div>

            {/* Action Call Buttons */}
            <div className="pt-4 mt-3 border-t border-slate-200/60 flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleCall(item.primaryCall)}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-bold shadow-sm cursor-pointer transition-all active:scale-95"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Call {item.primaryCall}</span>
              </button>

              {item.altCall && (
                <button
                  onClick={() => handleCall(item.altCall)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-medium cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-slate-400 text-[10px]">Alt:</span>
                  <span className="font-semibold">{item.altCall}</span>
                </button>
              )}

              {item.tollFree && (
                <button
                  onClick={() => handleCall(item.tollFree)}
                  className="inline-flex items-center space-x-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold cursor-pointer transition-all active:scale-95"
                >
                  <span className="text-[10px]">Toll Free:</span>
                  <span>{item.tollFree}</span>
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
