import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { AlertCircle, Users, ShieldAlert, Home } from 'lucide-react';

export default function StatCards() {
  const { stats, zones } = useSentinel();

  // Compute total people exposed dynamically from zones list
  const totalPeopleExposed = zones.reduce((acc, z) => acc + z.peopleExposed, 0);
  const criticalZonesCount = zones.filter(z => z.severity === 'red').length;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      
      {/* Card 1: Active Hazard Zones */}
      <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-rose-100/60 rounded-full blur-xl group-hover:bg-rose-100 transition-all"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Hazard Zones</p>
            <div className="flex items-baseline space-x-2 mt-1">
              <span className="text-3xl font-extrabold text-slate-800 font-mono-numeric">{zones.length}</span>
              {criticalZonesCount > 0 && (
                <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                  {criticalZonesCount} Critical
                </span>
              )}
            </div>
          </div>
          <div className="p-3 bg-rose-50 border border-rose-100 text-rose-500 rounded-xl">
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2 flex items-center space-x-1">
          <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          <span>Flood surge active in River Valley</span>
        </p>
      </div>

      {/* Card 2: People Exposed */}
      <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-100/60 rounded-full blur-xl group-hover:bg-amber-100 transition-all"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">People Exposed</p>
            <p className="text-3xl font-extrabold text-slate-800 font-mono-numeric mt-1">
              {totalPeopleExposed.toLocaleString()}
            </p>
          </div>
          <div className="p-3 bg-amber-50 border border-amber-100 text-amber-500 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          Estimated population in flood polygon boundaries
        </p>
      </div>

      {/* Card 3: Responders Deployed / Available */}
      <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-cyan-100/60 rounded-full blur-xl group-hover:bg-cyan-100 transition-all"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Responders Deployed</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-extrabold text-cyan-600 font-mono-numeric">
                {stats.respondersDeployed}
              </span>
              <span className="text-lg text-slate-400 font-mono-numeric">/ {stats.respondersAvailable}</span>
            </div>
          </div>
          <div className="p-3 bg-cyan-50 border border-cyan-100 text-cyan-500 rounded-xl">
            <ShieldAlert className="w-6 h-6" />
          </div>
        </div>
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
          <div
            className="bg-cyan-500 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(100, (stats.respondersDeployed / stats.respondersAvailable) * 100)}%` }}
          ></div>
        </div>
      </div>

      {/* Card 4: Shelters at Capacity */}
      <div className="bg-white border border-slate-200 hover:border-slate-300 rounded-xl p-4 shadow-sm transition-all relative overflow-hidden group">
        <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-purple-100/60 rounded-full blur-xl group-hover:bg-purple-100 transition-all"></div>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Shelters at Capacity</p>
            <div className="flex items-baseline space-x-1 mt-1">
              <span className="text-3xl font-extrabold text-purple-600 font-mono-numeric">
                {stats.sheltersAtCapacity}
              </span>
              <span className="text-lg text-slate-400 font-mono-numeric">/ {stats.sheltersTotal}</span>
            </div>
          </div>
          <div className="p-3 bg-purple-50 border border-purple-100 text-purple-500 rounded-xl">
            <Home className="w-6 h-6" />
          </div>
        </div>
        <p className="text-[11px] text-slate-500 mt-2">
          {stats.sheltersTotal - stats.sheltersAtCapacity} shelters still accepting evacuees
        </p>
      </div>

    </div>
  );
}
