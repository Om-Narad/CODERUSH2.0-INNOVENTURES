/**
 * SOSAlertsPanel.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * SOS Alert System for SentinelPlan
 * Provides:
 *  - List of critical/warning zones needing urgent alerts
 *  - Per-zone "Send SOS Alert" button
 *  - "Send Mass SOS" button for all critical zones
 *  - Alert history with timestamps
 *  - Toast notification on send
 */
import React, { useState } from 'react';
import { useSentinel } from '../context/SentinelContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Siren,
  AlertTriangle,
  Users,
  Clock,
  CheckCircle2,
  Radio,
  ChevronDown,
  ChevronUp,
  Zap,
  ShieldAlert,
  History,
  Bell,
  BellOff,
  Activity,
  X,
} from 'lucide-react';

// ── SOS Toast Notification ───────────────────────────────────────────────────
function SosToast({ notification, onDismiss }) {
  if (!notification) return null;
  return (
    <AnimatePresence>
      <motion.div
        key={notification.id}
        initial={{ opacity: 0, y: -30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-rose-500/60 bg-rose-950/95 backdrop-blur-md shadow-2xl shadow-rose-900/50 text-white max-w-md"
      >
        {/* Pulsing siren icon */}
        <div className="p-2 rounded-xl bg-rose-500/20 border border-rose-500/40">
          <Siren className="w-5 h-5 text-rose-400 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-sm text-rose-200">
            {notification.isMass ? '🚨 Mass SOS Dispatched!' : '✅ SOS Alert Sent!'}
          </div>
          <div className="text-xs text-rose-300/80 truncate mt-0.5">
            Notifying <strong className="text-white">{notification.peopleExposed?.toLocaleString()}</strong> residents in{' '}
            <span className="font-semibold">{notification.zoneName}</span>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="p-1 rounded-lg text-rose-400 hover:text-white hover:bg-rose-800/50 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

// ── SOS History Entry ────────────────────────────────────────────────────────
function SosHistoryEntry({ entry, index }) {
  const isCritical = entry.severity === 'red';
  const isWarning = entry.severity === 'amber';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04 }}
      className={`flex items-start gap-3 p-3 rounded-xl border text-xs transition-all ${
        entry.isMassAlert
          ? 'bg-rose-950/40 border-rose-700/50'
          : isCritical
          ? 'bg-rose-950/25 border-rose-800/40'
          : 'bg-amber-950/25 border-amber-800/40'
      }`}
    >
      {/* Icon */}
      <div
        className={`p-1.5 rounded-lg flex-shrink-0 ${
          entry.isMassAlert
            ? 'bg-rose-500/20 border border-rose-500/40'
            : isCritical
            ? 'bg-rose-500/15 border border-rose-500/30'
            : 'bg-amber-500/15 border border-amber-500/30'
        }`}
      >
        {entry.isMassAlert ? (
          <Zap className="w-3.5 h-3.5 text-rose-400" />
        ) : isCritical ? (
          <Siren className="w-3.5 h-3.5 text-rose-400" />
        ) : (
          <Bell className="w-3.5 h-3.5 text-amber-400" />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <span className="font-bold text-white truncate">
            {entry.isMassAlert ? '⚡ MASS SOS — ' : ''}{entry.zoneName}
          </span>
          <span className="text-slate-500 font-mono-numeric text-[10px] flex-shrink-0">{entry.timestamp}</span>
        </div>
        <div className="text-slate-400 flex items-center gap-2">
          <Users className="w-3 h-3 text-slate-500 flex-shrink-0" />
          <span>{entry.peopleExposed?.toLocaleString()} residents alerted</span>
          <span
            className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold font-mono-numeric"
            style={{ backgroundColor: `${entry.severityColor}22`, color: entry.severityColor }}
          >
            P{entry.priority}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

// ── Affected Zone Card ────────────────────────────────────────────────────────
function AffectedZoneCard({ zone, onSendSos, zones }) {
  const isCritical = zone.severity === 'red';
  const isWarning = zone.severity === 'amber';
  const [sending, setSending] = useState(false);

  const handleSend = async () => {
    setSending(true);
    onSendSos(zone.id, zones);
    // Brief visual feedback before resetting
    setTimeout(() => setSending(false), 1500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`rounded-xl border p-4 transition-all ${
        isCritical
          ? 'border-rose-700/60 bg-rose-950/20 hover:border-rose-600/70'
          : 'border-amber-700/50 bg-amber-950/15 hover:border-amber-600/60'
      }`}
    >
      {/* Zone Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              isCritical ? 'bg-rose-500 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white leading-tight truncate">{zone.name}</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isCritical ? '🔴 Critical Zone' : '🟡 Warning Zone'}
            </p>
          </div>
        </div>
        <span
          className="px-2 py-0.5 rounded text-[11px] font-bold font-mono-numeric flex-shrink-0"
          style={{ backgroundColor: `${zone.severityColor}20`, color: zone.severityColor, border: `1px solid ${zone.severityColor}40` }}
        >
          P{zone.priority}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold flex items-center gap-1">
            <Users className="w-3 h-3" /> Exposed
          </div>
          <div className="text-sm font-bold text-white font-mono-numeric mt-0.5">
            {zone.peopleExposed.toLocaleString()}
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-2 border border-slate-800/60">
          <div className="text-[10px] text-slate-500 uppercase tracking-wide font-semibold flex items-center gap-1">
            <Activity className="w-3 h-3" /> Routes Open
          </div>
          <div
            className={`text-sm font-bold font-mono-numeric mt-0.5 ${
              zone.roadsOpen === 0
                ? 'text-rose-400'
                : zone.roadsOpen === 1
                ? 'text-amber-400'
                : 'text-emerald-400'
            }`}
          >
            {zone.roadsOpen} / {zone.totalRoads}
          </div>
        </div>
      </div>

      {/* AI Rationale */}
      <p className="text-[11px] text-cyan-300/70 italic mb-3 leading-relaxed line-clamp-2">
        "{zone.rationale}"
      </p>

      {/* Send SOS Button */}
      <button
        id={`sos-btn-${zone.id}`}
        onClick={handleSend}
        disabled={sending}
        className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all active:scale-95 ${
          sending
            ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 cursor-not-allowed'
            : isCritical
            ? 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-lg shadow-rose-900/40 border border-rose-500/40'
            : 'bg-gradient-to-r from-amber-600 to-orange-700 hover:from-amber-500 hover:to-orange-600 text-white shadow-lg shadow-amber-900/30 border border-amber-500/40'
        }`}
      >
        {sending ? (
          <>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>SOS Alert Sent!</span>
          </>
        ) : (
          <>
            <Siren className="w-3.5 h-3.5" />
            <span>Send SOS Alert</span>
          </>
        )}
      </button>
    </motion.div>
  );
}

// ── Main SOS Alerts Panel ─────────────────────────────────────────────────────
export default function SOSAlertsPanel() {
  const {
    zones,
    sosAlerts,
    sosNotification,
    sendSosAlert,
    sendMassSos,
    dismissSosNotification,
  } = useSentinel();

  const [historyOpen, setHistoryOpen] = useState(true);
  const [massSending, setMassSending] = useState(false);

  // Filter: only critical and warning zones
  const affectedZones = zones.filter(z => z.severity === 'red' || z.severity === 'amber');
  const criticalZones = zones.filter(z => z.severity === 'red');

  const handleMassSos = () => {
    setMassSending(true);
    sendMassSos(zones);
    setTimeout(() => setMassSending(false), 2000);
  };

  const totalAffectedPeople = affectedZones.reduce((sum, z) => sum + z.peopleExposed, 0);

  return (
    <>
      {/* Global SOS Toast Notification */}
      <SosToast notification={sosNotification} onDismiss={dismissSosNotification} />

      <div className="min-h-screen bg-[#0b0f17] pb-8">
        <div className="max-w-4xl mx-auto px-4 pt-6">

          {/* ── Page Header ──────────────────────────────────────────────── */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-rose-600/30 to-rose-900/40 border border-rose-500/40">
                <Siren className="w-7 h-7 text-rose-400 animate-pulse" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">SOS Alerts</h1>
                <p className="text-sm text-slate-400 mt-0.5">
                  Dispatch emergency notifications to affected residents
                </p>
              </div>
            </div>

            {/* Live status badge */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800/50 text-emerald-400 text-xs font-mono-numeric">
              <Activity className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </div>
          </div>

          {/* ── Summary Stats Bar ─────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-[#151c28] rounded-xl border border-rose-800/40 p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Critical Zones
              </div>
              <div className="text-2xl font-bold text-rose-400 font-mono-numeric">{criticalZones.length}</div>
            </div>
            <div className="bg-[#151c28] rounded-xl border border-amber-800/40 p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> People at Risk
              </div>
              <div className="text-2xl font-bold text-amber-400 font-mono-numeric">
                {totalAffectedPeople.toLocaleString()}
              </div>
            </div>
            <div className="bg-[#151c28] rounded-xl border border-cyan-800/40 p-4">
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold flex items-center gap-1.5 mb-1">
                <Radio className="w-3.5 h-3.5 text-cyan-400" /> Alerts Sent
              </div>
              <div className="text-2xl font-bold text-cyan-400 font-mono-numeric">{sosAlerts.length}</div>
            </div>
          </div>

          {/* ── Mass SOS Button ───────────────────────────────────────────── */}
          <div className="mb-6 bg-gradient-to-r from-rose-950/60 to-rose-900/40 rounded-2xl border border-rose-600/40 p-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-rose-200 flex items-center gap-2">
                  <Zap className="w-4.5 h-4.5 text-rose-400" />
                  Send Mass SOS Alert
                </h2>
                <p className="text-xs text-rose-300/70 mt-1">
                  Instantly notify all <strong className="text-rose-200">{criticalZones.length}</strong> critical zone residents (
                  <strong className="text-rose-200">{criticalZones.reduce((s, z) => s + z.peopleExposed, 0).toLocaleString()}</strong> people) at once via SMS + push notifications.
                </p>
              </div>
              <button
                id="mass-sos-btn"
                onClick={handleMassSos}
                disabled={massSending || criticalZones.length === 0}
                className={`flex-shrink-0 flex items-center gap-2.5 px-5 py-3 rounded-xl text-sm font-bold transition-all active:scale-95 shadow-xl ${
                  massSending
                    ? 'bg-emerald-700/40 border border-emerald-600/40 text-emerald-300 cursor-not-allowed'
                    : criticalZones.length === 0
                    ? 'bg-slate-800 border border-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white border border-rose-500/50 shadow-rose-900/50 cursor-pointer'
                }`}
              >
                {massSending ? (
                  <>
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400" />
                    <span>Alerts Dispatched!</span>
                  </>
                ) : (
                  <>
                    <Siren className="w-4.5 h-4.5" />
                    <span>Send Mass SOS</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ── Affected Zones Grid ───────────────────────────────────────── */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Affected Zones ({affectedZones.length})
              </h2>
              <span className="text-xs text-slate-500">Click zone card to send individual SOS</span>
            </div>

            {affectedZones.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <BellOff className="w-8 h-8 mx-auto mb-2 opacity-40" />
                <p className="text-sm">No critical or warning zones detected.</p>
                <p className="text-xs mt-1">All zones are currently stable.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <AnimatePresence>
                  {affectedZones.map(zone => (
                    <AffectedZoneCard
                      key={zone.id}
                      zone={zone}
                      zones={zones}
                      onSendSos={sendSosAlert}
                    />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>

          {/* ── SOS Alert History ─────────────────────────────────────────── */}
          <div className="bg-[#151c28] rounded-2xl border border-slate-800 overflow-hidden">
            {/* History Header (collapsible) */}
            <button
              onClick={() => setHistoryOpen(prev => !prev)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-800/30 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                  <History className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-left">
                  <h2 className="text-sm font-bold text-white">Alert History</h2>
                  <p className="text-[11px] text-slate-400">
                    {sosAlerts.length === 0
                      ? 'No alerts sent yet this session'
                      : `${sosAlerts.length} alert${sosAlerts.length > 1 ? 's' : ''} dispatched this session`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {sosAlerts.length > 0 && (
                  <span className="text-[11px] font-mono-numeric px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800">
                    {sosAlerts.length}
                  </span>
                )}
                {historyOpen ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </button>

            {/* History List */}
            {historyOpen && (
              <div className="px-4 pb-4">
                {sosAlerts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500">
                    <Clock className="w-6 h-6 mx-auto mb-2 opacity-30" />
                    <p className="text-xs">No SOS alerts sent yet.</p>
                    <p className="text-[11px] mt-0.5 text-slate-600">
                      Use the buttons above to dispatch alerts to affected zones.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence initial={false}>
                      {sosAlerts.map((entry, idx) => (
                        <SosHistoryEntry key={entry.id} entry={entry} index={idx} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Disclaimer ───────────────────────────────────────────────── */}
          <p className="text-center text-[11px] text-slate-600 mt-6">
            ⚠️ Demo mode — SOS alerts are simulated. In production, these trigger real SMS/push notification pipelines via Twilio/FCM.
          </p>
        </div>
      </div>
    </>
  );
}
