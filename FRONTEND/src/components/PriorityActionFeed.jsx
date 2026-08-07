import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  UserCheck,
  UserPlus,
  Shield,
  Navigation,
  Home,
  Bot,
} from 'lucide-react';

export default function PriorityActionFeed() {
  const {
    zones,
    roads,
    selectedZoneId,
    setSelectedZoneId,
    assignResponders,
  } = useSentinel();

  const toggleExpand = (zoneId) => {
    setSelectedZoneId(prev => (prev === zoneId ? null : zoneId));
  };

  return (
    <div className="bg-[#151c28] border border-slate-800 rounded-xl p-4 flex flex-col h-full shadow-lg">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-wide uppercase">Priority Action Feed</h2>
            <p className="text-[11px] text-slate-400">Live AI Risk Assessment (Highest Priority First)</p>
          </div>
        </div>
        <span className="text-xs font-mono-numeric px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
          {zones.length} Zones
        </span>
      </div>

      {/* Scrollable Zone Cards List */}
      <div className="space-y-3 overflow-y-auto pr-1 flex-1 max-h-[620px]">
        <AnimatePresence>
          {zones.map((zone, index) => {
            const isExpanded = selectedZoneId === zone.id;
            const isAssigned = zone.status === 'Assigned';

            // Severity dot & color styling
            let dotBg = 'bg-emerald-500';
            let badgeBg = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60';
            if (zone.severity === 'red') {
              dotBg = 'bg-rose-500 animate-pulse';
              badgeBg = 'bg-rose-950/90 text-rose-400 border-rose-800/60';
            } else if (zone.severity === 'amber') {
              dotBg = 'bg-amber-500';
              badgeBg = 'bg-amber-950/90 text-amber-400 border-amber-800/60';
            }

            // Get names of connecting roads
            const zoneRoadObjs = zone.roadIds
              .map(rId => roads.find(r => r.id === rId))
              .filter(Boolean);

            return (
              <motion.div
                key={zone.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className={`rounded-xl border transition-all duration-200 overflow-hidden ${
                  isExpanded
                    ? 'border-cyan-500/50 bg-slate-900/90 shadow-md shadow-cyan-950/30'
                    : 'border-slate-800/90 hover:border-slate-700 bg-slate-900/40'
                }`}
              >
                {/* Main Card Header Area */}
                <div
                  className="p-3.5 cursor-pointer select-none"
                  onClick={() => toggleExpand(zone.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2.5">
                      {/* Severity Dot */}
                      <span className={`w-3 h-3 rounded-full flex-shrink-0 ${dotBg}`} />
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-bold text-slate-400 font-mono-numeric">
                            #{index + 1}
                          </span>
                          <h3 className="text-sm font-bold text-white leading-tight">
                            {zone.name}
                          </h3>
                        </div>
                        {/* One-Line Stat */}
                        <p className="text-xs text-slate-400 font-mono-numeric mt-1">
                          <span className="text-slate-200">{zone.peopleExposed.toLocaleString()}</span> people exposed ·{' '}
                          <span className={zone.roadsOpen === 0 ? 'text-rose-400 font-bold' : zone.roadsOpen === 1 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                            {zone.roadsOpen} of {zone.totalRoads} routes open
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Priority Score & Expand Icon */}
                    <div className="flex flex-col items-end space-y-1">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded border font-mono-numeric ${badgeBg}`}>
                        PRIORITY {zone.priority}
                      </span>
                      <div className="text-slate-400 hover:text-slate-200 p-0.5">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  {/* AI Rationale in italics */}
                  <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-start space-x-1.5 text-xs text-cyan-300/90 italic">
                    <Bot className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0 mt-0.5 not-italic" />
                    <span>"{zone.rationale}"</span>
                  </div>

                  {/* Action Button Row */}
                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                        isAssigned
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/80'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {isAssigned ? '✓ Assigned' : 'Status: Pending'}
                    </span>

                    <button
                      id={`assign-btn-${zone.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        assignResponders(zone.id);
                      }}
                      className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                        isAssigned
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                          : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/20 active:scale-95'
                      }`}
                    >
                      {isAssigned ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>Responders Active</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Assign Responders</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Accordion Details */}
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="bg-slate-950/80 px-4 py-3 border-t border-slate-800 text-xs space-y-2.5"
                  >
                    <div className="grid grid-cols-2 gap-2 text-slate-300">
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Population at Risk</span>
                        <span className="text-sm font-bold text-white font-mono-numeric">
                          {zone.peopleExposed.toLocaleString()} evacuees
                        </span>
                      </div>
                      <div className="bg-slate-900 p-2 rounded border border-slate-800">
                        <span className="text-slate-400 block text-[10px] uppercase font-semibold">Recommended Responders</span>
                        <span className="text-sm font-bold text-cyan-400 font-mono-numeric">
                          {zone.recommendedResponders} tactical teams
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2 bg-slate-900/90 p-2 rounded border border-slate-800">
                      <Home className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] uppercase font-semibold text-slate-400 block">Nearest Evacuation Shelter</span>
                        <span className="text-slate-200 font-medium">{zone.nearestShelter}</span>
                      </div>
                    </div>

                    <div className="bg-slate-900/90 p-2 rounded border border-slate-800">
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block mb-1.5">Connected Evacuation Routes</span>
                      <div className="space-y-1">
                        {zoneRoadObjs.map(road => (
                          <div key={road.id} className="flex items-center justify-between text-[11px]">
                            <span className="flex items-center space-x-1 text-slate-300">
                              <Navigation className="w-3 h-3 text-cyan-400" />
                              <span>{road.name}</span>
                            </span>
                            <span
                              className={`px-1.5 py-0.2 rounded font-mono-numeric text-[10px] font-bold ${
                                road.status === 'open'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : 'bg-rose-950 text-rose-400 border border-rose-800'
                              }`}
                            >
                              {road.status.toUpperCase()}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
