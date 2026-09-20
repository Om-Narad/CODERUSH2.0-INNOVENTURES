from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime

class SensorDevice(BaseModel):
    device_id: str
    label: str
    sensor_type: str  # water_level | flow_rate | rainfall | ultrasonic_distance
    latitude: float
    longitude: float
    installed_depth_cm: float = 150.0
    drain_segment_id: str
    upstream_sensor_id: Optional[str] = None
    battery_pct: float = 95.0
    signal_strength_dbm: float = -68.0
    firmware_version: str = "v2.4.1-nagpur"
    last_heartbeat_at: str
    health_status: str = "online"  # online | degraded | offline | maintenance
    warning_threshold_cm: float = 50.0
    critical_threshold_cm: float = 80.0
    expected_drain_rate_cm_per_min: float = 2.5
    current_water_level_cm: float = 12.0
    current_flow_rate_lps: float = 45.0
    current_rainfall_mm_hr: float = 0.0

class DrainSegment(BaseModel):
    segment_id: str
    name: str
    watercourse_id: str
    geometry: List[List[float]]  # Coordinates list [[lat, lng], ...]
    diameter_mm: float = 1200.0
    design_capacity_lps: float = 850.0
    last_desilted_on: str = "2026-05-15"
    silt_risk_level: str = "medium"  # high | medium | low

class SensorReadingIngest(BaseModel):
    device_id: str
    water_level_cm: float
    flow_rate_lps: Optional[float] = 0.0
    rainfall_mm_hr: Optional[float] = 0.0
    recorded_at: str
    battery_pct: Optional[float] = None
    raw_payload: Optional[Dict[str, Any]] = None

class BatchIngestRequest(BaseModel):
    readings: List[SensorReadingIngest]

class BlockageEvent(BaseModel):
    event_id: str
    device_id: str
    device_label: str
    drain_segment_id: str
    drain_segment_name: str
    rule_triggered: str  # RISING_NO_OUTFLOW | STAGNANT_HIGH | FLOW_MISMATCH | RAPID_SURGE
    confidence_score: int  # 0 - 100
    explanation: str
    detected_at: str
    resolved_at: Optional[str] = None
    status: str = "suspected"  # suspected | confirmed | clearing | resolved
    assigned_crew_id: Optional[str] = None
    verified_by: Optional[str] = None
    verification_notes: Optional[str] = None
    people_exposed_downstream: int = 1500

class BlockageVerificationRequest(BaseModel):
    action: str  # "confirm" | "dismiss" | "assign_crew"
    officer_id: str
    assigned_crew_id: Optional[str] = None
    notes: Optional[str] = None

class MaintenanceLog(BaseModel):
    id: Optional[int] = None
    device_id: str
    action: str
    performed_by: str
    performed_at: str
    notes: str

class FleetHealthSummary(BaseModel):
    total_sensors: int
    online_count: int
    degraded_count: int
    offline_count: int
    maintenance_count: int
    active_blockages_count: int
    low_battery_devices: List[SensorDevice]
    stale_devices: List[SensorDevice]  # No heartbeat in >1 hour
