"""
Nagpur Drainage Network — Seed Data Generator
=============================================
Provides realistic Nagpur drainage segments, IoT sensor devices, 24-hour time-series readings,
and initial blockage events for Manish Nagar, Narendra Nagar, Nag River, and Gorewada Nullahs.
"""

from datetime import datetime, timezone, timedelta
import random
import uuid
from typing import Dict, List, Tuple
from drainage_models import SensorDevice, DrainSegment, BlockageEvent, MaintenanceLog

NOW_ISO = datetime.now(timezone.utc).isoformat()

def get_iso_hours_ago(hours: float) -> str:
    dt = datetime.now(timezone.utc) - timedelta(hours=hours)
    return dt.isoformat()

# ─── 1. DRAIN SEGMENTS DATASET ────────────────────────────────────────────────
DRAIN_SEGMENTS_SEED: List[DrainSegment] = [
  DrainSegment(
    segment_id="DS-MANISH-UNDERPASS",
    name="Manish Nagar Railway Underpass Box Culvert",
    watercourse_id="nag-river-tributary-1",
    geometry=[[21.0980, 79.0680], [21.1050, 79.0750], [21.1100, 79.0820]],
    diameter_mm=2400.0,
    design_capacity_lps=1450.0,
    last_desilted_on="2026-04-10",
    silt_risk_level="high",
  ),
  DrainSegment(
    segment_id="DS-NARENDRA-BELT",
    name="Narendra Nagar Flyover & Besa Basin Arterial Nullah",
    watercourse_id="nag-river-tributary-2",
    geometry=[[21.1120, 79.0780], [21.1200, 79.0880], [21.1250, 79.0950]],
    diameter_mm=1800.0,
    design_capacity_lps=1100.0,
    last_desilted_on="2026-05-02",
    silt_risk_level="high",
  ),
  DrainSegment(
    segment_id="DS-SOMALWADA-RADIAL",
    name="Somalwada & Pratap Nagar School Radial Drain",
    watercourse_id="nag-river-tributary-3",
    geometry=[[21.1150, 79.0550], [21.1280, 79.0680], [21.1380, 79.0750]],
    diameter_mm=1200.0,
    design_capacity_lps=750.0,
    last_desilted_on="2026-05-20",
    silt_risk_level="medium",
  ),
  DrainSegment(
    segment_id="DS-NAGRIV-MAIN",
    name="Nag River Main Central Stormwater Channel",
    watercourse_id="nag-river-main",
    geometry=[[21.1350, 79.0480], [21.1460, 79.0780], [21.1620, 79.1250]],
    diameter_mm=3200.0,
    design_capacity_lps=2800.0,
    last_desilted_on="2026-03-15",
    silt_risk_level="medium",
  ),
  DrainSegment(
    segment_id="DS-GOREWADA-SPILL",
    name="Gorewada Nullah Zingabai Takli Spillway",
    watercourse_id="gorewada-spillway",
    geometry=[[21.1720, 79.0520], [21.1820, 79.0680], [21.1900, 79.0820]],
    diameter_mm=2000.0,
    design_capacity_lps=1350.0,
    last_desilted_on="2026-04-28",
    silt_risk_level="high",
  ),
]

# ─── 2. SENSOR DEVICES DATASET ────────────────────────────────────────────────
SENSOR_DEVICES_SEED: List[SensorDevice] = [
  # Manish Nagar Underpass Pair
  SensorDevice(
    device_id="SN-MANISH-UPSTREAM",
    label="Manish Nagar Underpass (Upstream North)",
    sensor_type="ultrasonic_distance",
    latitude=21.1050,
    longitude=79.0750,
    installed_depth_cm=200.0,
    drain_segment_id="DS-MANISH-UNDERPASS",
    upstream_sensor_id=None,
    battery_pct=94.0,
    signal_strength_dbm=-65.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.05),
    health_status="online",
    warning_threshold_cm=55.0,
    critical_threshold_cm=85.0,
    expected_drain_rate_cm_per_min=2.5,
    current_water_level_cm=78.5,
    current_flow_rate_lps=380.0,
  ),
  SensorDevice(
    device_id="SN-MANISH-DOWNSTREAM",
    label="Manish Nagar Underpass (Downstream Outlet)",
    sensor_type="water_level",
    latitude=21.0980,
    longitude=79.0680,
    installed_depth_cm=200.0,
    drain_segment_id="DS-MANISH-UNDERPASS",
    upstream_sensor_id="SN-MANISH-UPSTREAM",
    battery_pct=88.0,
    signal_strength_dbm=-72.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.02),
    health_status="degraded",
    warning_threshold_cm=55.0,
    critical_threshold_cm=85.0,
    expected_drain_rate_cm_per_min=2.5,
    current_water_level_cm=24.0,  # FLOW MISMATCH (Upstream 78.5cm vs Downstream 24cm)
    current_flow_rate_lps=110.0,
  ),

  # Narendra Nagar Pair
  SensorDevice(
    device_id="SN-NARENDRA-01",
    label="Narendra Nagar Flyover Under-drain A",
    sensor_type="ultrasonic_distance",
    latitude=21.1120,
    longitude=79.0780,
    installed_depth_cm=180.0,
    drain_segment_id="DS-NARENDRA-BELT",
    upstream_sensor_id=None,
    battery_pct=15.0,  # LOW BATTERY
    signal_strength_dbm=-82.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.1),
    health_status="online",
    warning_threshold_cm=50.0,
    critical_threshold_cm=80.0,
    expected_drain_rate_cm_per_min=2.2,
    current_water_level_cm=68.0,  # STAGNANT HIGH
    current_flow_rate_lps=240.0,
  ),
  SensorDevice(
    device_id="SN-NARENDRA-02",
    label="Narendra Nagar Besa Outlet Sensor B",
    sensor_type="flow_rate",
    latitude=21.1200,
    longitude=79.0880,
    installed_depth_cm=180.0,
    drain_segment_id="DS-NARENDRA-BELT",
    upstream_sensor_id="SN-NARENDRA-01",
    battery_pct=92.0,
    signal_strength_dbm=-68.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.04),
    health_status="online",
    warning_threshold_cm=50.0,
    critical_threshold_cm=80.0,
    expected_drain_rate_cm_per_min=2.2,
    current_water_level_cm=62.0,
    current_flow_rate_lps=290.0,
  ),

  # Somalwada Pair
  SensorDevice(
    device_id="SN-SOMAL-01",
    label="Somalwada School Radial Drain Inflow",
    sensor_type="water_level",
    latitude=21.1150,
    longitude=79.0550,
    installed_depth_cm=150.0,
    drain_segment_id="DS-SOMALWADA-RADIAL",
    upstream_sensor_id=None,
    battery_pct=76.0,
    signal_strength_dbm=-70.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.08),
    health_status="online",
    warning_threshold_cm=45.0,
    critical_threshold_cm=75.0,
    expected_drain_rate_cm_per_min=2.0,
    current_water_level_cm=58.0,  # RISING NO OUTFLOW
    current_flow_rate_lps=140.0,
  ),

  # Nag River Main Sensors
  SensorDevice(
    device_id="SN-NAGRIV-01",
    label="Nag River Sitabuldi Gauge Station",
    sensor_type="ultrasonic_distance",
    latitude=21.1470,
    longitude=79.0830,
    installed_depth_cm=300.0,
    drain_segment_id="DS-NAGRIV-MAIN",
    upstream_sensor_id=None,
    battery_pct=99.0,
    signal_strength_dbm=-60.0,
    firmware_version="v2.5.0-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.01),
    health_status="online",
    warning_threshold_cm=120.0,
    critical_threshold_cm=200.0,
    expected_drain_rate_cm_per_min=4.0,
    current_water_level_cm=115.0,
    current_flow_rate_lps=1600.0,
  ),
  SensorDevice(
    device_id="SN-NAGRIV-02",
    label="Nag River Mahal Central Culvert",
    sensor_type="water_level",
    latitude=21.1460,
    longitude=79.1020,
    installed_depth_cm=300.0,
    drain_segment_id="DS-NAGRIV-MAIN",
    upstream_sensor_id="SN-NAGRIV-01",
    battery_pct=91.0,
    signal_strength_dbm=-64.0,
    firmware_version="v2.5.0-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.03),
    health_status="online",
    warning_threshold_cm=120.0,
    critical_threshold_cm=200.0,
    expected_drain_rate_cm_per_min=4.0,
    current_water_level_cm=98.0,
    current_flow_rate_lps=1450.0,
  ),

  # Gorewada Nullah Pair
  SensorDevice(
    device_id="SN-GOREWADA-01",
    label="Gorewada Nullah Mankapur Canal Entry",
    sensor_type="ultrasonic_distance",
    latitude=21.1850,
    longitude=79.0720,
    installed_depth_cm=220.0,
    drain_segment_id="DS-GOREWADA-SPILL",
    upstream_sensor_id=None,
    battery_pct=82.0,
    signal_strength_dbm=-75.0,
    firmware_version="v2.4.1-nagpur",
    last_heartbeat_at=get_iso_hours_ago(0.06),
    health_status="online",
    warning_threshold_cm=60.0,
    critical_threshold_cm=95.0,
    expected_drain_rate_cm_per_min=3.0,
    current_water_level_cm=92.0,  # RAPID SURGE
    current_flow_rate_lps=980.0,
  ),

  # Offline / Stale Sensor for missing data testing
  SensorDevice(
    device_id="SN-OFFLINE-01",
    label="Ambazari Spillway Outer Auxiliary Sensor",
    sensor_type="water_level",
    latitude=21.1280,
    longitude=79.0420,
    installed_depth_cm=160.0,
    drain_segment_id="DS-SOMALWADA-RADIAL",
    upstream_sensor_id=None,
    battery_pct=8.0,  # CRITICAL LOW BATTERY & STALE
    signal_strength_dbm=-95.0,
    firmware_version="v2.1.0-nagpur",
    last_heartbeat_at=get_iso_hours_ago(2.4),  # >1 hr silent
    health_status="offline",
    warning_threshold_cm=45.0,
    critical_threshold_cm=75.0,
    expected_drain_rate_cm_per_min=2.0,
    current_water_level_cm=0.0,
    current_flow_rate_lps=0.0,
  ),
]

# ─── 3. INITIAL BLOCKAGE EVENTS ───────────────────────────────────────────────
INITIAL_BLOCKAGES_SEED: List[BlockageEvent] = [
  BlockageEvent(
    event_id="blk-manish-01",
    device_id="SN-MANISH-DOWNSTREAM",
    device_label="Manish Nagar Underpass (Downstream Outlet)",
    drain_segment_id="DS-MANISH-UNDERPASS",
    drain_segment_name="Manish Nagar Railway Underpass Box Culvert",
    rule_triggered="FLOW_MISMATCH",
    confidence_score=94,
    explanation="Upstream sensor 'Manish Nagar Underpass (Upstream North)' rose to 78.5 cm while downstream sensor 'Manish Nagar Underpass (Downstream Outlet)' remained flat at 24.0 cm — blockage isolated between railway culvert.",
    detected_at=get_iso_hours_ago(0.4),
    status="suspected",
    people_exposed_downstream=3400,
  ),
  BlockageEvent(
    event_id="blk-gorewada-01",
    device_id="SN-GOREWADA-01",
    device_label="Gorewada Nullah Mankapur Canal Entry",
    drain_segment_id="DS-GOREWADA-SPILL",
    drain_segment_name="Gorewada Nullah Zingabai Takli Spillway",
    rule_triggered="RAPID_SURGE",
    confidence_score=91,
    explanation="Water level surging at 4.2 cm/min exceeding design clearance capacity (3.0 cm/min) — critical underpass submersion threat at Gorewada Nullah Mankapur Canal Entry.",
    detected_at=get_iso_hours_ago(0.25),
    status="suspected",
    people_exposed_downstream=3100,
  ),
  BlockageEvent(
    event_id="blk-narendra-01",
    device_id="SN-NARENDRA-01",
    device_label="Narendra Nagar Flyover Under-drain A",
    drain_segment_id="DS-NARENDRA-BELT",
    drain_segment_name="Narendra Nagar Flyover & Besa Basin Arterial Nullah",
    rule_triggered="STAGNANT_HIGH",
    confidence_score=86,
    explanation="Level held at 68.0 cm (above warning threshold 50 cm) for over 45 min without falling — likely heavy silt blockage downstream.",
    detected_at=get_iso_hours_ago(0.8),
    status="confirmed",
    assigned_crew_id="NMC-CREW-DELTA-4",
    verified_by="OFFICER-SHARMA-NMC",
    verification_notes="Confirmed visual silt blockage near Besa flyover pillar 12. Dewatering pump dispatched.",
    people_exposed_downstream=2900,
  ),
  BlockageEvent(
    event_id="blk-somal-01",
    device_id="SN-SOMAL-01",
    device_label="Somalwada School Radial Drain Inflow",
    drain_segment_id="DS-SOMALWADA-RADIAL",
    drain_segment_name="Somalwada & Pratap Nagar School Radial Drain",
    rule_triggered="RISING_NO_OUTFLOW",
    confidence_score=82,
    explanation="Water level held at 58.0 cm (rose +12.0 cm over last 15 min) despite zero rainfall (0.0 mm/hr) — outflow obstructed by downstream plastic & silt debris.",
    detected_at=get_iso_hours_ago(1.2),
    status="suspected",
    people_exposed_downstream=2100,
  ),
]

# Helper to generate 24-hour time-series data for a sensor
def generate_24h_history(device_id: str, current_level: float, warning_thresh: float) -> List[Dict]:
    readings = []
    now = datetime.now(timezone.utc)
    base_level = max(current_level * 0.3, 10.0)

    for i in range(24, -1, -1):
        t = now - timedelta(hours=i)
        # Create a realistic rainfall surge peak around 3-5 hours ago
        if 2 <= i <= 6:
            factor = 1.0 - abs(i - 4) * 0.2
            lvl = base_level + (current_level - base_level) * factor + random.uniform(-2, 2)
            rain = round(random.uniform(15.0, 45.0) * factor, 1)
            flow = round(lvl * 4.5, 1)
        else:
            lvl = base_level + random.uniform(-3, 3)
            rain = 0.0
            flow = round(lvl * 3.5, 1)

        readings.append({
            "device_id": device_id,
            "water_level_cm": round(max(lvl, 5.0), 1),
            "flow_rate_lps": max(flow, 10.0),
            "rainfall_mm_hr": rain,
            "recorded_at": t.isoformat(),
            "raw_payload": {"battery": 92.0, "rssi": -68}
        })
    return readings
