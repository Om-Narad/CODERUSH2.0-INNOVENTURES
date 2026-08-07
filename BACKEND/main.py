"""
SentinelPlan Backend API
========================
FastAPI backend service for SentinelPlan Disaster Response Dashboard.
Note: For this hackathon demo, state is held in-memory.
A production deployment would persist state in PostgreSQL with PostGIS extensions
for spatial querying and polygon-line intersections.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid
import io
import os

from models import Zone, Road, Alert, Stats, AssignSquadRequest, PredictionResponse
from scoring import calculate_priority, generate_rationale
from data import INITIAL_ZONES_DATA, INITIAL_ROADS_DATA, INITIAL_STATS_DATA, INITIAL_ALERTS_DATA

# ─── ML Model (flood_resnet18.pth) ─────────────────────────────────────────────
# Lazy-imported so the server still starts if torch is unavailable
_flood_model = None
_model_load_error = None

def _load_flood_model():
    """Loads flood_resnet18.pth once at startup. Model file lives in project root."""
    global _flood_model, _model_load_error
    try:
        import torch
        import torchvision.models as tv_models
        import torchvision.transforms as transforms

        # Resolve path: model lives two levels up from BACKEND/
        model_path = os.path.join(os.path.dirname(__file__), '..', 'flood_resnet18.pth')
        model_path = os.path.abspath(model_path)

        if not os.path.exists(model_path):
            _model_load_error = f"Model file not found at {model_path}"
            print(f"[WARN] {_model_load_error}")
            return

        # Build the same ResNet-18 architecture used during training
        model = tv_models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, 2)  # binary: No Flood / Flood

        state_dict = torch.load(model_path, map_location=torch.device('cpu'))
        # Support both raw state_dict and {'model': state_dict} checkpoint formats
        if isinstance(state_dict, dict) and 'model' in state_dict:
            state_dict = state_dict['model']
        elif isinstance(state_dict, dict) and 'state_dict' in state_dict:
            state_dict = state_dict['state_dict']

        model.load_state_dict(state_dict)
        model.eval()
        _flood_model = model
        print(f"[INFO] Flood detection model loaded from {model_path}")

    except Exception as e:
        _model_load_error = str(e)
        print(f"[ERROR] Failed to load flood model: {e}")


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
    _load_flood_model()

@app.get("/")
def root():
    """Root endpoint welcoming user and providing API links."""
    return {
        "service": "SentinelPlan Disaster Response API",
        "status": "online",
        "scenario": "Guwahati Assam Flood Response",
        "frontend_app": "http://localhost:5173/",
        "api_docs": "http://localhost:8000/docs",
        "model_loaded": _flood_model is not None,
        "endpoints": {
            "health": "/api/health",
            "predict": "POST /api/predict  (image upload → flood detection)",
            "state": "/api/state",
            "toggle_road": "POST /api/roads/{road_id}/toggle",
            "simulate": "POST /api/simulate",
            "assign_squad": "POST /api/zones/{zone_id}/assign"
        }
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "model_loaded": _flood_model is not None,
        "model_error": _model_load_error,
    }


@app.post("/api/predict", response_model=PredictionResponse)
async def predict_flood(file: UploadFile = File(...)):
    """
    Flood Detection Inference endpoint.
    Accepts a multipart/form-data image upload and returns:
      { "label": "Flood" | "No Flood", "confidence": 0.0-1.0, "flood_probability": 0.0-1.0 }
    """
    if _flood_model is None:
        detail = _model_load_error or "Model not loaded. Check server logs."
        raise HTTPException(status_code=503, detail=detail)

    # Validate content type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    try:
        import torch
        import torch.nn.functional as F
        from PIL import Image
        import torchvision.transforms as transforms

        # Read raw bytes and open with PIL
        raw = await file.read()
        img = Image.open(io.BytesIO(raw)).convert("RGB")

        # Standard ImageNet preprocessing (same as ResNet-18 training)
        preprocess = transforms.Compose([
            transforms.Resize(256),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(
                mean=[0.485, 0.456, 0.406],
                std=[0.229, 0.224, 0.225]
            ),
        ])

        tensor = preprocess(img).unsqueeze(0)  # shape: [1, 3, 224, 224]

        with torch.no_grad():
            logits = _flood_model(tensor)           # shape: [1, 2]
            probs = F.softmax(logits, dim=1)[0]     # shape: [2]

        # Class indices: 0 = No Flood, 1 = Flood
        no_flood_prob = float(probs[0])
        flood_prob    = float(probs[1])

        is_flood   = flood_prob >= 0.5
        label      = "Flood" if is_flood else "No Flood"
        confidence = flood_prob if is_flood else no_flood_prob

        return PredictionResponse(
            label=label,
            confidence=round(confidence, 4),
            flood_probability=round(flood_prob, 4),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

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
