import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { ShieldCheck, UserCheck, Users, Home, ShieldAlert } from 'lucide-react';

export default function ResourceTable() {
  const { zones, assignResponders, setSelectedZoneId, setCurrentView } = useSentinel();

  return (
    <div className="bg-[#151c28] border border-slate-800 rounded-xl p-5 shadow-lg mt-6">
      
      {/* Table Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800/80 mb-4 gap-2">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white tracking-wide">Resource & Tactical Deployment Matrix</h2>
            <p className="text-xs text-slate-400">Tactical Squad Assignments & Evacuation Shelter Tracking</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 text-xs text-slate-400 font-mono-numeric">
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>Critical Zone</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            <span>Warning Zone</span>
          </span>
          <span className="flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Stable Zone</span>
          </span>
        </div>
      </div>

      {/* Table Body */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-900/60">
              <th className="py-3 px-4 rounded-l-lg">Zone Name</th>
              <th className="py-3 px-4">People Exposed</th>
              <th className="py-3 px-4">Assigned Responder Squad</th>
              <th className="py-3 px-4">Assigned Evacuation Shelter</th>
              <th className="py-3 px-4">Deployment Status</th>
              <th className="py-3 px-4 text-right rounded-r-lg">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {zones.map((zone) => {
              const isAssigned = zone.status === 'Assigned';

              let dotBg = 'bg-emerald-500';
              if (zone.severity === 'red') {
                dotBg = 'bg-rose-500 animate-pulse';
              } else if (zone.severity === 'amber') {
                dotBg = 'bg-amber-500';
              }

              return (
                <tr key={zone.id} className="hover:bg-slate-900/80 transition-colors">
                  
                  {/* Zone Name */}
                  <td className="py-3.5 px-4">
                    <div
                      className="flex items-center space-x-2.5 cursor-pointer"
                      onClick={() => {
                        setSelectedZoneId(zone.id);
                        setCurrentView('map');
                      }}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${dotBg}`} />
                      <span className="font-bold text-slate-100 hover:text-cyan-400 transition-colors">
                        {zone.name}
                      </span>
                    </div>
                  </td>

                  {/* People Exposed */}
                  <td className="py-3.5 px-4 font-mono-numeric text-slate-200 font-medium">
                    <div className="flex items-center space-x-1.5">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{zone.peopleExposed.toLocaleString()} evacuees</span>
                    </div>
                  </td>

                  {/* Assigned Responder Squad (Replaces duplicate Priority column) */}
                  <td className="py-3.5 px-4 font-mono-numeric">
                    <div className="flex items-center space-x-1.5">
                      <ShieldAlert className={`w-3.5 h-3.5 ${isAssigned ? 'text-cyan-400' : 'text-slate-500'}`} />
                      <span className={isAssigned ? 'text-cyan-300 font-bold' : 'text-slate-400'}>
                        {zone.assignedSquad} ({zone.recommendedResponders} Units)
                      </span>
                    </div>
                  </td>

                  {/* Assigned Evacuation Shelter */}
                  <td className="py-3.5 px-4 text-slate-300">
                    <div className="flex items-center space-x-1.5">
                      <Home className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
                      <span className="truncate max-w-[240px]">{zone.nearestShelter}</span>
                    </div>
                  </td>

                  {/* Status Badge */}
                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-full border text-[11px] font-bold ${
                        isAssigned
                          ? 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80'
                          : 'bg-slate-800/80 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <UserCheck className="w-3 h-3 text-emerald-400" />
                          <span>Squad Deployed</span>
                        </>
                      ) : (
                        <span>Standby (Pending)</span>
                      )}
                    </span>
                  </td>

                  {/* Action Button */}
                  <td className="py-3.5 px-4 text-right">
                    <button
                      id={`table-assign-${zone.id}`}
                      onClick={() => assignResponders(zone.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm cursor-pointer ${
                        isAssigned
                          ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
                      }`}
                    >
                      {isAssigned ? 'Recall Squad' : 'Deploy Squad'}
                    </button>
                  </td>

                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}
