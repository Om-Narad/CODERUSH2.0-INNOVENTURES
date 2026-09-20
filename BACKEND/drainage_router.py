"""
Nagpur Drainage Sensor Network — FastAPI Router & WebSocket
==========================================================
Provides bulk IoT ingestion, time-series history, human-in-the-loop verification,
fleet health analytics, and WebSocket broadcast streaming for Nagpur.
"""

from fastapi import APIRouter, HTTPException, Query, BackgroundTask, WebSocket, WebSocketDisconnect
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone, timedelta
import asyncio
import json

from drainage_models import (
    SensorDevice,
    DrainSegment,
    SensorReadingIngest,
    BatchIngestRequest,
    BlockageEvent,
    BlockageVerificationRequest,
    MaintenanceLog,
    FleetHealthSummary,
)
from drainage_seed import (
    DRAIN_SEGMENTS_SEED,
    SENSOR_DEVICES_SEED,
    INITIAL_BLOCKAGES_SEED,
    generate_24h_history,
)
from drainage_detection import evaluate_blockage_rules

router = APIRouter(prefix="/api", tags=["Drainage Sensor Network"])

# ─── IN-MEMORY STATE STORE ───────────────────────────────────────────────────
DEVICES_STORE: Dict[str, SensorDevice] = {d.device_id: d for d in SENSOR_DEVICES_SEED}
SEGMENTS_STORE: Dict[str, DrainSegment] = {s.segment_id: s for s in DRAIN_SEGMENTS_SEED}
BLOCKAGES_STORE: Dict[str, BlockageEvent] = {b.event_id: b for b in INITIAL_BLOCKAGES_SEED}
READINGS_HISTORY: Dict[str, List[Dict]] = {
    d.device_id: generate_24h_history(d.device_id, d.current_water_level_cm, d.warning_threshold_cm)
    for d in SENSOR_DEVICES_SEED
}
MAINTENANCE_LOGS: List[MaintenanceLog] = [
    MaintenanceLog(
        id=1,
        device_id="SN-NARENDRA-01",
        action="Battery Replacement Scheduled",
        performed_by="NMC-TECH-04",
        performed_at=datetime.now(timezone.utc).isoformat(),
        notes="Battery dropped to 15%. Scheduled field technician dispatch."
    )
]

# WebSocket Connection Manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.append(connection)
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()


# ─── 1. BULK IOT INGESTION ENDPOINT ───────────────────────────────────────────
@router.post("/sensors/ingest")
async def ingest_sensor_readings(batch: BatchIngestRequest, background_tasks: BackgroundTask = None):
    """
    Bulk ingestion endpoint for batched IoT water-level & flow sensors.
    Validates payloads, rejects impossible values, updates device state, and triggers blockage rules.
    """
    ingested_count = 0
    rejected_count = 0
    new_alerts = []

    now_iso = datetime.now(timezone.utc).isoformat()

    for item in batch.readings:
        # Rejection Rule: Impossible physical values
        if item.water_level_cm < 0.0 or item.water_level_cm > 2500.0:
            rejected_count += 1
            continue

        device = DEVICES_STORE.get(item.device_id)
        if not device:
            rejected_count += 1
            continue

        # Update Device Current State
        device.current_water_level_cm = item.water_level_cm
        if item.flow_rate_lps is not None:
            device.current_flow_rate_lps = item.flow_rate_lps
        if item.rainfall_mm_hr is not None:
            device.current_rainfall_mm_hr = item.rainfall_mm_hr
        if item.battery_pct is not None:
            device.battery_pct = item.battery_pct
        device.last_heartbeat_at = item.recorded_at or now_iso
        device.health_status = "online" if device.battery_pct > 20 else "degraded"

        # Append to time-series history
        reading_dict = {
            "device_id": item.device_id,
            "water_level_cm": item.water_level_cm,
            "flow_rate_lps": item.flow_rate_lps,
            "rainfall_mm_hr": item.rainfall_mm_hr,
            "recorded_at": item.recorded_at or now_iso,
            "raw_payload": item.raw_payload or {"ingested": True},
        }
        if item.device_id not in READINGS_HISTORY:
            READINGS_HISTORY[item.device_id] = []
        READINGS_HISTORY[item.device_id].append(reading_dict)

        # Keep history capped at last 500 readings per device
        if len(READINGS_HISTORY[item.device_id]) > 500:
            READINGS_HISTORY[item.device_id] = READINGS_HISTORY[item.device_id][-500:]

        # Run Blockage Detection Logic
        segment = SEGMENTS_STORE.get(device.drain_segment_id)
        upstream_device = DEVICES_STORE.get(device.upstream_sensor_id) if device.upstream_sensor_id else None

        detected_event = evaluate_blockage_rules(
            device,
            READINGS_HISTORY[item.device_id],
            segment=segment,
            upstream_device=upstream_device
        )

        if detected_event:
            # Check if active event already exists for this device to prevent duplicate alerts
            existing = [b for b in BLOCKAGES_STORE.values() if b.device_id == device.device_id and b.status in ["suspected", "confirmed"]]
            if not existing:
                BLOCKAGES_STORE[detected_event.event_id] = detected_event
                new_alerts.append(detected_event)

        ingested_count += 1

    # Broadcast via WebSocket if new readings or alerts arrived
    if ingested_count > 0:
        asyncio.create_task(manager.broadcast({
            "type": "TELEMETRY_UPDATE",
            "ingested_count": ingested_count,
            "timestamp": now_iso,
            "new_blockages": [b.dict() for b in new_alerts],
        }))

    return {
        "status": "success",
        "ingested": ingested_count,
        "rejected": rejected_count,
        "new_blockages_detected": len(new_alerts),
    }


# ─── 2. GET ALL SENSORS (WITH FILTERS & BOUNDING BOX) ─────────────────────────
@router.get("/sensors", response_model=List[SensorDevice])
def get_all_sensors(
    segment_id: Optional[str] = None,
    health_status: Optional[str] = None,
    min_lat: Optional[float] = Query(None),
    max_lat: Optional[float] = Query(None),
    min_lng: Optional[float] = Query(None),
    max_lng: Optional[float] = Query(None),
):
    """
    Returns list of all IoT sensors, with live status, battery, and current reading.
    Supports filtering by segment, health status, and map bounding box.
    """
    devices = list(DEVICES_STORE.values())

    if segment_id:
        devices = [d for d in devices if d.drain_segment_id == segment_id]
    if health_status:
        devices = [d for d in devices if d.health_status == health_status]

    if None not in (min_lat, max_lat, min_lng, max_lng):
        devices = [
            d for d in devices
            if min_lat <= d.latitude <= max_lat and min_lng <= d.longitude <= max_lng
        ]

    return devices


# ─── 3. GET DRAIN SEGMENTS ────────────────────────────────────────────────────
@router.get("/drain-segments", response_model=List[DrainSegment])
def get_drain_segments():
    """Returns all Nagpur stormwater drain segments and geometries."""
    return list(SEGMENTS_STORE.values())


# ─── 4. SENSOR TIME-SERIES HISTORY (24 HOURS) ────────────────────────────────
@router.get("/sensors/{device_id}/history")
def get_sensor_history(device_id: str, hours: int = Query(24, ge=1, le=168)):
    """
    Returns time-series readings for charting water levels, flow rate, and rainfall over specified hours.
    """
    device = DEVICES_STORE.get(device_id)
    if not device:
        raise HTTPException(status_code=404, detail="Sensor device not found")

    history = READINGS_HISTORY.get(device_id, [])

    # Filter by requested hours
    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    filtered = []
    for r in history:
        try:
            t = datetime.fromisoformat(r["recorded_at"].replace("Z", "+00:00"))
            if t >= cutoff:
                filtered.append(r)
        except Exception:
            filtered.append(r)

    return {
        "device": device,
        "warning_threshold_cm": device.warning_threshold_cm,
        "critical_threshold_cm": device.critical_threshold_cm,
        "history": filtered,
    }


# ─── 5. GET RANKED ACTIVE BLOCKAGES ───────────────────────────────────────────
@router.get("/blockages", response_model=List[BlockageEvent])
def get_active_blockages():
    """
    Returns active blockage events, ranked by confidence_score * downstream_people_exposed.
    """
    active = [b for b in BLOCKAGES_STORE.values() if b.status in ["suspected", "confirmed", "clearing"]]
    
    # Rank by impact score = confidence * exposed population
    ranked = sorted(
        active,
        key=lambda b: (b.confidence_score * b.people_exposed_downstream),
        reverse=True
    )
    return ranked


# ─── 6. HUMAN-IN-THE-LOOP BLOCKAGE VERIFICATION ──────────────────────────────
@router.post("/blockages/{event_id}/verify")
async def verify_blockage_event(event_id: str, req: BlockageVerificationRequest):
    """
    Human verification endpoint for duty officers to confirm or dismiss suspected blockages.
    Requires named officer ID for accountability.
    """
    event = BLOCKAGES_STORE.get(event_id)
    if not event:
        raise HTTPException(status_code=404, detail="Blockage event not found")

    if req.action == "confirm":
        event.status = "confirmed"
        event.verified_by = req.officer_id
        event.verification_notes = req.notes or "Confirmed by duty officer."
        if req.assigned_crew_id:
            event.assigned_crew_id = req.assigned_crew_id

    elif req.action == "dismiss":
        event.status = "resolved"
        event.resolved_at = datetime.now(timezone.utc).isoformat()
        event.verified_by = req.officer_id
        event.verification_notes = req.notes or "Dismissed as false positive after inspection."

    elif req.action == "assign_crew":
        event.assigned_crew_id = req.assigned_crew_id or "NMC-DISPATCH-UNIT-1"
        event.status = "clearing"

    else:
        raise HTTPException(status_code=400, detail="Invalid verification action")

    # Broadcast verification update via WebSocket
    await manager.broadcast({
        "type": "BLOCKAGE_VERIFIED",
        "event": event.dict(),
        "officer_id": req.officer_id,
    })

    return {"status": "success", "event": event}


# ─── 7. FLEET HEALTH DIAGNOSTICS ──────────────────────────────────────────────
@router.get("/sensors/health", response_model=FleetHealthSummary)
def get_fleet_health_summary():
    """
    Returns diagnostic summary of all deployed sensors, identifying low-battery and silent (stale) devices.
    """
    devices = list(DEVICES_STORE.values())

    now = datetime.now(timezone.utc)
    low_battery = [d for d in devices if d.battery_pct <= 20.0]

    stale_devices = []
    for d in devices:
        try:
            t = datetime.fromisoformat(d.last_heartbeat_at.replace("Z", "+00:00"))
            if (now - t).total_seconds() > 3600:  # No heartbeat in >1 hour
                stale_devices.append(d)
        except Exception:
            pass

    return FleetHealthSummary(
        total_sensors=len(devices),
        online_count=len([d for d in devices if d.health_status == "online"]),
        degraded_count=len([d for d in devices if d.health_status == "degraded"]),
        offline_count=len([d for d in devices if d.health_status == "offline"]),
        maintenance_count=len([d for d in devices if d.health_status == "maintenance"]),
        active_blockages_count=len([b for b in BLOCKAGES_STORE.values() if b.status in ["suspected", "confirmed"]]),
        low_battery_devices=low_battery,
        stale_devices=stale_devices,
    )


# ─── 8. WEBSOCKET REAL-TIME STREAMING ENDPOINT ───────────────────────────────
@router.websocket("/ws/sensors")
async def websocket_sensors_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint pushing real-time telemetry updates and blockage alerts to dashboard.
    """
    await manager.connect(websocket)
    try:
        # Send initial snapshot on connect
        await websocket.send_json({
            "type": "INITIAL_SNAPSHOT",
            "active_blockages_count": len([b for b in BLOCKAGES_STORE.values() if b.status in ["suspected", "confirmed"]]),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

        while True:
            # Keep connection alive with ping/pong
            data = await websocket.receive_text()
            if data == "ping":
                await websocket.send_json({"type": "pong", "time": datetime.now(timezone.utc).isoformat()})
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception:
        manager.disconnect(websocket)
