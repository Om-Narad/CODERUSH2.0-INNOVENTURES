"""
SentinelPlan Backend API
========================
FastAPI backend service for SentinelPlan Disaster Response Dashboard.
Note: For this hackathon demo, state is held in-memory.
A production deployment would persist state in PostgreSQL with PostGIS extensions
for spatial querying and polygon-line intersections.
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid

from models import Zone, Road, Alert, Stats, AssignSquadRequest
from scoring import calculate_priority, generate_rationale
from data import INITIAL_ZONES_DATA, INITIAL_ROADS_DATA, INITIAL_STATS_DATA, INITIAL_ALERTS_DATA

app = FastAPI(
    title="SentinelPlan Disaster Response API",
    description="Backend API for SentinelPlan real-time flood monitoring & evacuation rescoring",
    version="1.0.0"
)

# Enable CORS for all origins (Required for frontend hackathon integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global In-Memory State
ROADS: list[Road] = []
ZONES: list[Zone] = []
ALERTS: list[Alert] = []
STATS: Stats = Stats()

def get_current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def seed_in_memory_state():
    """Initializes in-memory Python structures with seeded Assam flood data."""
    global ROADS, ZONES, ALERTS, STATS

    ROADS = [Road(**r) for r in INITIAL_ROADS_DATA]
    STATS = Stats(**INITIAL_STATS_DATA)
    ALERTS = [Alert(**a) for a in INITIAL_ALERTS_DATA]

    ZONES = []
    for zd in INITIAL_ZONES_DATA:
        temp_zone = Zone(
            id=zd["id"],
            name=zd["name"],
            geometry=zd["geometry"],
            people_exposed=zd["people_exposed"],
            priority_score=0,
            status=zd["status"],
            assigned_squad=zd["assigned_squad"],
            assigned_shelter=zd["assigned_shelter"],
            rationale=""
        )
        temp_zone.priority_score = calculate_priority(temp_zone, ROADS)
        temp_zone.rationale = generate_rationale(temp_zone, ROADS)
        ZONES.append(temp_zone)

@app.on_event("startup")
def startup_event():
    seed_in_memory_state()

@app.get("/")
def root():
    """Root endpoint welcoming user and providing API links."""
    return {
        "service": "SentinelPlan Disaster Response API",
        "status": "online",
        "scenario": "Guwahati Assam Flood Response",
        "frontend_app": "http://localhost:5173/",
        "api_docs": "http://localhost:8000/docs",
        "endpoints": {
            "health": "/api/health",
            "state": "/api/state",
            "toggle_road": "POST /api/roads/{road_id}/toggle",
            "simulate": "POST /api/simulate",
            "assign_squad": "POST /api/zones/{zone_id}/assign"
        }
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {"status": "ok"}

@app.get("/api/state")
def get_state():
    """Single state payload endpoint populating Dashboard and Map View."""
    return {
        "zones": ZONES,
        "roads": ROADS,
        "alerts": ALERTS,
        "stats": STATS
    }

@app.post("/api/roads/{road_id}/toggle")
def toggle_road(road_id: str):
    """Flips road status between 'open' and 'blocked' and recalculates connected zones."""
    road = next((r for r in ROADS if r.id == road_id), None)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found")

    new_status = "blocked" if road.status == "open" else "open"
    road.status = new_status

    affected_count = 0
    for zone in ZONES:
        if road_id in zone.id or road_id in [r.id for r in ROADS if zone.id in r.connects_zone_ids]:
            zone.priority_score = calculate_priority(zone, ROADS)
            zone.rationale = generate_rationale(zone, ROADS)
            affected_count += 1

    alert_msg = f"Road {road.name} {new_status}, {affected_count} zone(s) re-prioritized"
    new_alert = Alert(
        id=f"alert-{uuid.uuid4().hex[:8]}",
        timestamp=get_current_iso_timestamp(),
        message=alert_msg
    )
    ALERTS.insert(0, new_alert)

    return {
        "zones": ZONES,
        "roads": ROADS,
        "alerts": ALERTS
    }

@app.post("/api/simulate")
def simulate_road_block():
    """Guaranteed one-click demo trigger: toggles key arterial road to Guwahati North Lowlands."""
    target_road_id = "road-2"
    road = next((r for r in ROADS if r.id == target_road_id), ROADS[0])
    return toggle_road(road.id)

@app.post("/api/zones/{zone_id}/assign")
def assign_squad(zone_id: str, request: AssignSquadRequest = None):
    """Assigns responder squad to a zone and updates deployment metrics."""
    zone = next((z for z in ZONES if z.id == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")

    squad_name = (request.squad_name if request and request.squad_name else None)
    if not squad_name:
        squad_name = f"Squad Delta-{zone.people_exposed // 500}"

    zone.status = "assigned"
    zone.assigned_squad = squad_name

    units_needed = 3
    actual_deploy = min(units_needed, STATS.responders_available)
    STATS.responders_deployed += actual_deploy
    STATS.responders_available = max(0, STATS.responders_available - actual_deploy)

    new_alert = Alert(
        id=f"alert-{uuid.uuid4().hex[:8]}",
        timestamp=get_current_iso_timestamp(),
        message=f"{squad_name} deployed to {zone.name}"
    )
    ALERTS.insert(0, new_alert)

    return {
        "zones": ZONES,
        "stats": STATS,
        "alerts": ALERTS
    }
