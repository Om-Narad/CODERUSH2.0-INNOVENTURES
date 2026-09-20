import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Activity,
  AlertTriangle,
  Battery,
  BatteryCharging,
  CheckCircle2,
  ChevronRight,
  Clock,
  Droplet,
  Filter,
  Flame,
  Globe,
  HardDrive,
  Info,
  Layers,
  MapPin,
  Maximize2,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Sliders,
  Sparkles,
  UserCheck,
  Users,
  Wifi,
  WifiOff,
  Wrench,
  X,
} from 'lucide-react';

import { SENSOR_DEVICES_SEED, DRAIN_SEGMENTS_SEED, INITIAL_BLOCKAGES_SEED, generate_24h_history } from '../data/mockData';

// Custom Leaflet Marker Icon Builder for IoT Drainage Sensors
const createSensorMarkerIcon = (healthStatus, hasBlockage, batteryPct) => {
  let color = '#10b981'; // green normal
  let bg = '#ecfdf5';
  let border = '#059669';

  if (hasBlockage) {
    color = '#ef4444'; // red blocked
    bg = '#fef2f2';
    border = '#dc2626';
  } else if (healthStatus === 'degraded' || batteryPct <= 20) {
    color = '#f59e0b'; // amber warning
    bg = '#fffbeb';
    border = '#d97706';
  } else if (healthStatus === 'offline') {
    color = '#64748b'; // grey offline
    bg = '#f8fafc';
    border = '#475569';
  }

  return L.divIcon({
    className: 'nagpur-sensor-marker',
    html: `
      <div style="
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        background: ${bg};
        border: 2px solid ${border};
        border-radius: 50%;
        color: ${color};
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        transform: translate(-50%, -50%);
      ">
        <span style="font-size: 14px;">💧</span>
        ${
          hasBlockage
            ? `<span style="
                position: absolute;
                top: -3px;
                right: -3px;
                width: 12px;
                height: 12px;
                background: #ef4444;
                border: 2px solid #ffffff;
                border-radius: 50%;
                animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;
              "></span>`
            : ''
        }
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

function MapAutoCenter({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, 13);
  }, [map, center]);
  return null;
}

export default function DrainageNetworkView() {
  // State
  const [sensors, setSensors] = useState(SENSOR_DEVICES_SEED);
  const [segments, setSegments] = useState(DRAIN_SEGMENTS_SEED);
  const [blockages, setBlockages] = useState(INITIAL_BLOCKAGES_SEED);
  const [selectedSensor, setSelectedSensor] = useState(SENSOR_DEVICES_SEED[0]);
  const [selectedHistory, setSelectedHistory] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [healthFilter, setHealthFilter] = useState('All');
  const [wsStatus, setWsStatus] = useState('connected'); // connected | reconnecting | offline
  
  // Verification Modal State
  const [verifyingBlockage, setVerifyingBlockage] = useState(null);
  const [officerIdInput, setOfficerIdInput] = useState('OFFICER-SHARMA-NMC');
  const [verificationNotes, setVerificationNotes] = useState('');
  const [selectedCrew, setSelectedCrew] = useState('NMC-QUICK-RESPONSE-1');

  // Bulk Selection
  const [selectedDeviceIds, setSelectedDeviceIds] = useState([]);

  // Fetch or fallback 24h history when sensor is selected
  useEffect(() => {
    if (selectedSensor) {
      const hist = generate_24h_history(
        selectedSensor.device_id,
        selectedSensor.current_water_level_cm,
        selectedSensor.warning_threshold_cm
      );
      setSelectedHistory(hist);
    }
  }, [selectedSensor]);

  // WebSocket Simulation / Connection
  useEffect(() => {
    let ws = null;
    try {
      ws = new WebSocket('ws://localhost:8000/ws/sensors');
      ws.onopen = () => setWsStatus('connected');
      ws.onerror = () => setWsStatus('reconnecting');
      ws.onclose = () => setWsStatus('reconnecting');
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        if (data.type === 'TELEMETRY_UPDATE') {
          setWsStatus('connected');
        }
      };
    } catch (e) {
      setWsStatus('reconnecting');
    }

    return () => {
      if (ws) ws.close();
    };
  }, []);

  // Filtered Sensors for Table & Map
  const filteredSensors = sensors.filter((d) => {
    const matchesSearch =
      searchQuery === '' ||
      d.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.device_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.drain_segment_id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesHealth =
      healthFilter === 'All' || d.health_status.toLowerCase() === healthFilter.toLowerCase();

    return matchesSearch && matchesHealth;
  });

  // KPI Computations
  const totalSensors = sensors.length;
  const onlineCount = sensors.filter((s) => s.health_status === 'online').length;
  const activeBlockagesCount = blockages.filter((b) => b.status === 'suspected' || b.status === 'confirmed').length;
  const lowBatteryCount = sensors.filter((s) => s.battery_pct <= 20).length;
  const staleCount = sensors.filter((s) => s.health_status === 'offline').length;

  // Handle Verification Action
  const handleVerify = (action) => {
    if (!verifyingBlockage) return;

    setBlockages((prev) =>
      prev.map((b) => {
        if (b.event_id === verifyingBlockage.event_id) {
          if (action === 'confirm') {
            return {
              ...b,
              status: 'confirmed',
              verified_by: officerIdInput,
              verification_notes: verificationNotes || 'Confirmed by duty officer.',
              assigned_crew_id: selectedCrew,
            };
          } else if (action === 'dismiss') {
            return {
              ...b,
              status: 'resolved',
              resolved_at: new Date().toISOString(),
              verified_by: officerIdInput,
              verification_notes: verificationNotes || 'Dismissed as false positive after inspection.',
            };
          }
        }
        return b;
      })
    );

    setVerifyingBlockage(null);
    setVerificationNotes('');
  };

  // Bulk Selection Handler
  const toggleSelectAll = () => {
    if (selectedDeviceIds.length === filteredSensors.length) {
      setSelectedDeviceIds([]);
    } else {
      setSelectedDeviceIds(filteredSensors.map((d) => d.device_id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedDeviceIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 space-y-6 overflow-y-auto h-full w-full font-sans bg-[#f8fafc]">
      
      {/* ─── 1. Header Banner & WebSocket Connection Status ─────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between shadow-2xs gap-4">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-blue-50 border border-blue-100 text-blue-600 flex-shrink-0">
            <Droplet className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Drainage Sensor Network &amp; Blockage Detection
              </h1>
              <span className="text-[10px] text-blue-700 font-extrabold px-2 py-0.5 rounded-full bg-blue-50 border border-blue-200 uppercase tracking-wide">
                Nagpur NMC IoT Fleet
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 max-w-2xl font-medium">
              Real-time water-level &amp; flow telemetry across stormwater drains, nullahs, and underpasses with automated blockage algorithms.
            </p>
          </div>
        </div>

        {/* WebSocket Indicator */}
        <div className="flex items-center space-x-2 self-start md:self-auto flex-shrink-0">
          <div
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full border text-xs font-extrabold ${
              wsStatus === 'connected'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
            }`}
          >
            {wsStatus === 'connected' ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-500" />
                <span>WebSocket Live Stream</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                <span>Reconnecting Stream...</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── 2. Fleet Overview KPI Row (5 Cards) ────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Sensors */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-700">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">TOTAL SENSORS</div>
            <div className="text-2xl font-extrabold text-slate-900 font-mono mt-0.5">{totalSensors}</div>
          </div>
        </div>

        {/* Online Count */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ONLINE &amp; HEALTHY</div>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-0.5">{onlineCount}</div>
          </div>
        </div>

        {/* Active Blockages Detected */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">BLOCKAGES DETECTED</div>
            <div className="text-2xl font-extrabold text-rose-600 font-mono mt-0.5">{activeBlockagesCount}</div>
          </div>
        </div>

        {/* Low Battery */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
            <Battery className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">LOW BATTERY (&lt;20%)</div>
            <div className="text-2xl font-extrabold text-amber-600 font-mono mt-0.5">{lowBatteryCount}</div>
          </div>
        </div>

        {/* Silent / Offline */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-2xs flex items-center space-x-3.5">
          <div className="p-2.5 rounded-xl bg-slate-100 text-slate-500">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">SILENT (&gt;1HR)</div>
            <div className="text-2xl font-extrabold text-slate-600 font-mono mt-0.5">{staleCount}</div>
          </div>
        </div>
      </div>

      {/* ─── 3. Main Workspace: Live Sensor Map & Blockage Alerts Panel ─────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        
        {/* LEFT / CENTER: Live Leaflet Sensor Map (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col h-full min-h-[520px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col h-full shadow-sm relative overflow-hidden justify-between">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3 flex-shrink-0">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Nagpur Live Drainage Map
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Real-time IoT water level markers &amp; drain segment polylines
                  </p>
                </div>
              </div>

              {/* Map Legend */}
              <div className="flex items-center space-x-3 text-[11px] text-slate-600 font-medium">
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Normal</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  <span>Warning</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Blocked</span>
                </span>
                <span className="flex items-center space-x-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                  <span>Offline</span>
                </span>
              </div>
            </div>

            {/* Leaflet Map */}
            <div className="flex-1 w-full min-h-[400px] rounded-xl overflow-hidden border border-slate-100 relative">
              <MapContainer
                center={[21.1458, 79.0882]}
                zoom={12.8}
                scrollWheelZoom={true}
                attributionControl={false}
                className="w-full h-full z-0"
              >
                <MapAutoCenter center={[21.1458, 79.0882]} />

                {/* Clean Keyless OpenStreetMap Tiles - Watermark Free */}
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  maxZoom={19}
                />

                {/* Render Drain Segment Polylines */}
                {segments.map((seg) => (
                  <Polyline
                    key={seg.segment_id}
                    positions={seg.geometry}
                    pathOptions={{
                      color: seg.silt_risk_level === 'high' ? '#3b82f6' : '#0ea5e9',
                      weight: 4,
                      dashArray: '4, 4',
                      opacity: 0.8,
                    }}
                  >
                    <Popup>
                      <div className="font-sans text-xs p-1">
                        <strong className="text-slate-900 text-sm">{seg.name}</strong>
                        <div className="text-slate-600 mt-1">Diameter: <strong>{seg.diameter_mm} mm</strong></div>
                        <div className="text-slate-600">Design Capacity: <strong>{seg.design_capacity_lps} L/s</strong></div>
                        <div className="text-slate-500 text-[11px] mt-1">Last Desilted: {seg.last_desilted_on}</div>
                      </div>
                    </Popup>
                  </Polyline>
                ))}

                {/* Render Sensor Device Markers */}
                {filteredSensors.map((dev) => {
                  const hasBlockage = blockages.some(
                    (b) => b.device_id === dev.device_id && (b.status === 'suspected' || b.status === 'confirmed')
                  );
                  const activeBlockage = blockages.find(
                    (b) => b.device_id === dev.device_id && (b.status === 'suspected' || b.status === 'confirmed')
                  );

                  return (
                    <Marker
                      key={dev.device_id}
                      position={[dev.latitude, dev.longitude]}
                      icon={createSensorMarkerIcon(dev.health_status, hasBlockage, dev.battery_pct)}
                      eventHandlers={{
                        click: () => {
                          setSelectedSensor(dev);
                          setDrawerOpen(true);
                        },
                      }}
                    >
                      <Popup>
                        <div className="font-sans p-1 text-slate-800 space-y-1">
                          <h3 className="font-bold text-sm text-slate-900">{dev.label}</h3>
                          <div className="text-xs flex items-center space-x-2 font-mono">
                            <span>Level: <strong className="text-blue-600">{dev.current_water_level_cm} cm</strong></span>
                            <span>|</span>
                            <span>Battery: <strong>{dev.battery_pct}%</strong></span>
                          </div>

                          {activeBlockage && (
                            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-medium mt-1">
                              <strong className="text-rose-700 flex items-center space-x-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                                <span>{activeBlockage.rule_triggered} ({activeBlockage.confidence_score}%)</span>
                              </strong>
                              <p className="mt-0.5 text-slate-700">{activeBlockage.explanation}</p>
                            </div>
                          )}

                          <button
                            onClick={() => {
                              setSelectedSensor(dev);
                              setDrawerOpen(true);
                            }}
                            className="w-full mt-2 py-1 px-2 bg-blue-600 text-white font-bold text-xs rounded-lg cursor-pointer hover:bg-blue-500 transition-all"
                          >
                            Open Sensor Drawer &amp; 24h Chart
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  );
                })}
              </MapContainer>
            </div>
          </div>
        </div>

        {/* RIGHT: Blockage Alerts Panel (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col h-full space-y-4 min-h-[520px]">
          <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-full justify-between">
            <div>
              {/* Section Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <div className="flex items-center space-x-2">
                  <div className="p-1.5 rounded-lg bg-rose-50 text-rose-600 border border-rose-100">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Blockage Detection Feed
                    </h2>
                    <p className="text-[11px] text-slate-500">Ranked by Confidence × Downstream Impact</p>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                  {blockages.filter((b) => b.status === 'suspected' || b.status === 'confirmed').length} ACTIVE
                </span>
              </div>

              {/* Alerts List */}
              <div className="space-y-3 overflow-y-auto max-h-[420px] pr-1">
                {blockages.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    No active blockages detected. All drain channels flowing normally.
                  </div>
                ) : (
                  blockages.map((blk) => {
                    const isConfirmed = blk.status === 'confirmed';
                    const isResolved = blk.status === 'resolved';

                    if (isResolved) return null;

                    return (
                      <div
                        key={blk.event_id}
                        className={`p-3.5 rounded-2xl border transition-all ${
                          isConfirmed
                            ? 'bg-rose-50/60 border-rose-300'
                            : 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide bg-rose-100 text-rose-800 border border-rose-200">
                            <AlertTriangle className="w-3 h-3 text-rose-600 mr-1" />
                            <span>{blk.rule_triggered}</span>
                          </span>

                          <span className="text-xs font-mono font-extrabold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            Confidence: <strong className="text-rose-600">{blk.confidence_score}%</strong>
                          </span>
                        </div>

                        <h3 className="text-xs font-extrabold text-slate-900 mt-2">
                          {blk.device_label}
                        </h3>

                        {/* Human readable explanation */}
                        <p className="text-xs text-slate-700 mt-1.5 leading-relaxed font-medium bg-white/80 p-2.5 rounded-xl border border-slate-100">
                          {blk.explanation}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-200/60">
                          <span className="flex items-center space-x-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span><strong>{blk.people_exposed_downstream.toLocaleString()}</strong> evacuees downstream</span>
                          </span>

                          {isConfirmed ? (
                            <span className="inline-flex items-center space-x-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Verified by {blk.verified_by}</span>
                            </span>
                          ) : (
                            <div className="flex items-center space-x-1.5">
                              <button
                                onClick={() => setVerifyingBlockage(blk)}
                                className="px-2.5 py-1 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold shadow-2xs cursor-pointer active:scale-95 transition-all"
                              >
                                Confirm Blockage
                              </button>
                              <button
                                onClick={() => {
                                  setVerifyingBlockage(blk);
                                }}
                                className="px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-medium cursor-pointer active:scale-95 transition-all"
                              >
                                Verify / Dismiss
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ─── 4. Sortable & Filterable Sensor Devices Table ─────────────────── */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex-shrink-0">
              <HardDrive className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                IoT Sensor Devices &amp; Telemetry Registry
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Search, filter, inspect live levels, and schedule maintenance across Nagpur wards
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search sensor ID or location..."
                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-blue-500 focus:bg-white transition-all"
              />
            </div>

            {/* Health Filter Pills */}
            <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
              {['All', 'Online', 'Degraded', 'Offline'].map((h) => (
                <button
                  key={h}
                  onClick={() => setHealthFilter(h)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    healthFilter === h
                      ? 'bg-white text-blue-600 font-bold shadow-2xs'
                      : 'text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Devices Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-3 rounded-l-xl">
                  <input
                    type="checkbox"
                    checked={selectedDeviceIds.length === filteredSensors.length && filteredSensors.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                </th>
                <th className="py-3 px-3">DEVICE LABEL &amp; ID</th>
                <th className="py-3 px-3">DRAIN SEGMENT</th>
                <th className="py-3 px-3">WATER LEVEL</th>
                <th className="py-3 px-3">HEALTH STATUS</th>
                <th className="py-3 px-3">BATTERY %</th>
                <th className="py-3 px-3">LAST HEARTBEAT</th>
                <th className="py-3 px-3 text-right rounded-r-xl">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredSensors.map((dev) => {
                const isChecked = selectedDeviceIds.includes(dev.device_id);
                const hasBlockage = blockages.some(
                  (b) => b.device_id === dev.device_id && (b.status === 'suspected' || b.status === 'confirmed')
                );

                return (
                  <tr
                    key={dev.device_id}
                    className={`hover:bg-slate-50/80 transition-colors ${
                      isChecked ? 'bg-blue-50/30' : ''
                    }`}
                  >
                    <td className="py-3.5 px-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectOne(dev.device_id)}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                    </td>
                    <td className="py-3.5 px-3 font-bold text-slate-900">
                      <div>{dev.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{dev.device_id}</div>
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                      {dev.drain_segment_id}
                    </td>
                    <td className="py-3.5 px-3 font-mono text-xs">
                      <strong className={dev.current_water_level_cm >= dev.warning_threshold_cm ? 'text-rose-600' : 'text-slate-800'}>
                        {dev.current_water_level_cm} cm
                      </strong>
                      <div className="text-[10px] text-slate-400">Thresh: {dev.warning_threshold_cm}cm</div>
                    </td>
                    <td className="py-3.5 px-3">
                      {hasBlockage ? (
                        <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 uppercase">
                          <AlertTriangle className="w-3 h-3 text-rose-500 mr-1" />
                          <span>BLOCKED</span>
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase ${
                            dev.health_status === 'online'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : dev.health_status === 'degraded'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <span>{dev.health_status}</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold">
                      <span className={dev.battery_pct <= 20 ? 'text-amber-600 font-extrabold' : 'text-slate-700'}>
                        {dev.battery_pct}%
                      </span>
                    </td>
                    <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                      {dev.last_heartbeat_at ? new Date(dev.last_heartbeat_at).toLocaleTimeString() : 'N/A'}
                    </td>
                    <td className="py-3.5 px-3 text-right">
                      <button
                        onClick={() => {
                          setSelectedSensor(dev);
                          setDrawerOpen(true);
                        }}
                        className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Inspect Drawer
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 5. SENSOR DETAIL DRAWER (SLIDES IN ON SELECTION) ───────────────── */}
      {drawerOpen && selectedSensor && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-xs transition-opacity">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between">
            <div>
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-100 text-blue-600">
                    <Droplet className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-base font-extrabold text-slate-900">{selectedSensor.label}</h2>
                    <p className="text-xs text-slate-400 font-mono">{selectedSensor.device_id}</p>
                  </div>
                </div>

                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 24-Hour Live Water Level SVG Time-Series Chart */}
              <div className="mt-4 bg-slate-900 rounded-2xl p-4 text-white space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono">
                    24-Hour Water Level Telemetry
                  </span>
                  <span className="text-xs font-mono text-cyan-400 font-bold">
                    Current: {selectedSensor.current_water_level_cm} cm
                  </span>
                </div>

                {/* SVG Line Chart */}
                <div className="w-full h-44 relative pt-2">
                  <svg className="w-full h-full overflow-visible">
                    {/* Warning & Critical Threshold Lines */}
                    <line x1="0" y1="40%" x2="100%" y2="40%" stroke="#ef4444" strokeDasharray="4,4" strokeWidth="1.5" />
                    <text x="2" y="38%" fill="#ef4444" fontSize="10" fontWeight="bold">Critical Threshold ({selectedSensor.critical_threshold_cm}cm)</text>

                    <line x1="0" y1="65%" x2="100%" y2="65%" stroke="#f59e0b" strokeDasharray="4,4" strokeWidth="1.5" />
                    <text x="2" y="63%" fill="#f59e0b" fontSize="10" fontWeight="bold">Warning Threshold ({selectedSensor.warning_threshold_cm}cm)</text>

                    {/* Plot Line */}
                    {selectedHistory.length > 1 && (
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="3"
                        points={selectedHistory
                          .map((d, i) => {
                            const x = (i / (selectedHistory.length - 1)) * 100;
                            const y = 100 - (d.water_level_cm / 120) * 100;
                            return `${x}%,${Math.max(Math.min(y, 95), 5)}%`;
                          })
                          .join(' ')}
                      />
                    )}
                  </svg>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 font-mono">
                  <span>24 Hours Ago</span>
                  <span>12 Hours Ago</span>
                  <span>Now</span>
                </div>
              </div>

              {/* Hardware Specs & Health */}
              <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">BATTERY &amp; SIGNAL</div>
                  <div className="text-slate-800 font-mono font-bold text-sm mt-1">{selectedSensor.battery_pct}%</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">{selectedSensor.signal_strength_dbm} dBm RSSI</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <div className="text-slate-400 font-bold text-[10px] uppercase">FIRMWARE &amp; DEPTH</div>
                  <div className="text-slate-800 font-mono font-bold text-sm mt-1">{selectedSensor.firmware_version}</div>
                  <div className="text-slate-500 text-[11px] mt-0.5">Depth: {selectedSensor.installed_depth_cm} cm</div>
                </div>
              </div>

              {/* Upstream / Downstream Paired Sensor Comparison */}
              {selectedSensor.upstream_sensor_id && (
                <div className="mt-4 bg-blue-50/60 border border-blue-200 rounded-xl p-3 text-xs">
                  <div className="font-bold text-blue-900 flex items-center space-x-1">
                    <Activity className="w-3.5 h-3.5 text-blue-600" />
                    <span>Paired Upstream Sensor Comparison</span>
                  </div>
                  <div className="text-slate-700 mt-1">
                    Paired ID: <strong className="font-mono">{selectedSensor.upstream_sensor_id}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setDrawerOpen(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close Drawer
              </button>

              <button
                onClick={() => {
                  alert(`Scheduled field technician maintenance for ${selectedSensor.device_id}.`);
                }}
                className="px-4 py-2 bg-blue-600 text-white font-extrabold text-xs rounded-xl hover:bg-blue-500 shadow-md cursor-pointer"
              >
                Schedule Maintenance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 6. HUMAN-IN-THE-LOOP VERIFICATION MODAL ───────────────────────── */}
      {verifyingBlockage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 pb-3 border-b border-slate-100">
              <div className="p-2 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Officer Blockage Verification
                </h3>
                <p className="text-xs text-slate-500">
                  Human-in-the-loop confirmation required for accountability
                </p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{verifyingBlockage.device_label}</div>
                <div className="text-rose-600 font-mono font-bold mt-0.5">
                  Rule: {verifyingBlockage.rule_triggered} ({verifyingBlockage.confidence_score}% Confidence)
                </div>
                <p className="text-slate-600 mt-1 leading-relaxed">{verifyingBlockage.explanation}</p>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[11px] mb-1">DUTY OFFICER ID</label>
                <input
                  type="text"
                  value={officerIdInput}
                  onChange={(e) => setOfficerIdInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[11px] mb-1">ASSIGN FIELD RESCUE CREW</label>
                <select
                  value={selectedCrew}
                  onChange={(e) => setSelectedCrew(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none"
                >
                  <option value="NMC-QUICK-RESPONSE-1">Squad Delta-1 (Underpass Rescue)</option>
                  <option value="NMC-FIRE-CREW-2">NMC Fire &amp; Water Pump Team 2</option>
                  <option value="RSS-JANKALYAN-TEAM-DELTA">RSS Jankalyan Relief Team Delta</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold text-[11px] mb-1">INSPECTION / VERIFICATION NOTES</label>
                <textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Enter officer notes on silt, debris, or dewatering dispatch..."
                  rows={2}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setVerifyingBlockage(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleVerify('dismiss')}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Dismiss Alert
                </button>
                <button
                  onClick={() => handleVerify('confirm')}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer"
                >
                  Confirm &amp; Dispatch
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
