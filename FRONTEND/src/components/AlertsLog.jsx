import React from 'react';
import { useSentinel } from '../context/SentinelContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function AlertsLog() {
  const { alerts } = useSentinel();

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full shadow-sm">
      
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-50 text-amber-500 border border-amber-100">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">Alerts &amp; Log</h2>
            <p className="text-[11px] text-slate-500">Live Telemetry &amp; Event Timeline</p>
          </div>
        </div>
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
      </div>

      {/* Scrollable Log Feed */}
      <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 max-h-[620px]">
        <AnimatePresence initial={false}>
          {alerts.map(alert => {
            let icon = <Info className="w-3.5 h-3.5 text-cyan-500" />;
            let borderColor = 'border-slate-200';
            let bgStyle = 'bg-slate-50';

            if (alert.type === 'warning' || alert.message.includes('blocked')) {
              icon = <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
              borderColor = 'border-amber-200';
              bgStyle = 'bg-amber-50';
            } else if (alert.type === 'critical') {
              icon = <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />;
              borderColor = 'border-rose-200';
              bgStyle = 'bg-rose-50';
            } else if (alert.type === 'success') {
              icon = <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />;
              borderColor = 'border-emerald-200';
              bgStyle = 'bg-emerald-50';
            }

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: -15, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className={`p-3 rounded-lg border text-xs ${borderColor} ${bgStyle} transition-all`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono-numeric mb-1">
                  <div className="flex items-center space-x-1.5">
                    {icon}
                    <span className="font-semibold text-slate-700">{alert.timestamp}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.2 rounded bg-white border border-slate-200 text-slate-500">
                    EVENT
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-sans pl-5">
                  {alert.message}
                </p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

    </div>
  );
}
