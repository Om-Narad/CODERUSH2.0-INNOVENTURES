"""
SentinelPlan Backend API
========================
FastAPI backend service for SentinelPlan Disaster Response Dashboard.
Supports Global Multi-Region Flood Monitoring (Assam, Bangladesh, Spain, Brazil, USA, Global Overview)
and PyTorch ResNet-18 flood inference.
"""

from fastapi import FastAPI, HTTPException, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone
import uuid
import io
import os
from typing import Optional, Dict, List

from models import Zone, Road, Alert, Stats, AssignSquadRequest, PredictionResponse, RegionInfo
from scoring import calculate_priority, generate_rationale
from regions import REGIONS_METADATA, MULTI_REGION_DATA, fetch_gdacs_live_flood_alerts

# ─── ML Model (flood_resnet18.pth) & PyTorch Initialization ────────────────────
_flood_model = None
_flood_device = "cpu"
_model_load_error = None

def _load_flood_model():
    """Loads flood_resnet18.pth at startup onto CUDA GPU (if available) or CPU."""
    global _flood_model, _flood_device, _model_load_error
    try:
        import torch
        import torchvision.models as tv_models

        # Detect GPU availability
        if torch.cuda.is_available():
            _flood_device = "cuda"
            device = torch.device("cuda")
        else:
            _flood_device = "cpu"
            device = torch.device("cpu")

        # Resolve path: model lives two levels up from BACKEND/ (or in root directory)
        model_path = os.path.join(os.path.dirname(__file__), '..', 'flood_resnet18.pth')
        model_path = os.path.abspath(model_path)

        if not os.path.exists(model_path):
            # Fallback check in current directory
            alt_path = os.path.join(os.path.dirname(__file__), 'flood_resnet18.pth')
            if os.path.exists(alt_path):
                model_path = alt_path
            else:
                _model_load_error = f"Model file not found at {model_path}"
                print(f"[WARN] {_model_load_error}")
                return

        # Build ResNet-18 architecture with binary classifier
        model = tv_models.resnet18(weights=None)
        model.fc = torch.nn.Linear(model.fc.in_features, 2)

        state_dict = torch.load(model_path, map_location=device)
        if isinstance(state_dict, dict) and 'model' in state_dict:
            state_dict = state_dict['model']
        elif isinstance(state_dict, dict) and 'state_dict' in state_dict:
            state_dict = state_dict['state_dict']

        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        _flood_model = model
        print(f"[INFO] Flood detection model loaded from {model_path} on device: {_flood_device.upper()}")

    except Exception as e:
        _model_load_error = str(e)
        print(f"[ERROR] Failed to load flood model: {e}")


app = FastAPI(
    title="SentinelPlan Disaster Response API",
    description="Backend API for SentinelPlan real-time multi-region flood monitoring & evacuation rescoring",
    version="2.0.0"
)

# Enable CORS for all origins (Required for frontend hackathon integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Multi-Region In-Memory State Repository ────────────────────────────────
REGION_STATES: Dict[str, Dict] = {}

def get_current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def seed_region_state(region_id: str):
    """Initializes in-memory Python structures for a specific region."""
    r_data = MULTI_REGION_DATA.get(region_id, MULTI_REGION_DATA["assam"])

    roads = [Road(**r) for r in r_data["roads"]]
    stats = Stats(**r_data["stats"])
    alerts = [Alert(**a) for a in r_data["alerts"]]

    zones = []
    for zd in r_data["zones"]:
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
        temp_zone.priority_score = calculate_priority(temp_zone, roads)
        temp_zone.rationale = generate_rationale(temp_zone, roads)
        zones.append(temp_zone)

    REGION_STATES[region_id] = {
        "roads": roads,
        "zones": zones,
        "alerts": alerts,
        "stats": stats
    }

def seed_all_regions():
    for r_meta in REGIONS_METADATA:
        seed_region_state(r_meta["id"])

def get_region_data(region_id: str = "assam"):
    clean_id = region_id.lower().strip() if region_id else "assam"
    if clean_id not in REGION_STATES:
        seed_region_state(clean_id if clean_id in MULTI_REGION_DATA else "assam")
        clean_id = "assam" if clean_id not in REGION_STATES else clean_id
    return REGION_STATES[clean_id]


@app.on_event("startup")
def startup_event():
    seed_all_regions()
    _load_flood_model()


@app.get("/")
def root():
    """Root endpoint welcoming user and providing API links."""
    return {
        "service": "SentinelPlan Disaster Response API",
        "status": "online",
        "version": "2.0.0 (Global Multi-Region)",
        "frontend_app": "http://localhost:5173/",
        "api_docs": "http://localhost:8000/docs",
        "model_loaded": _flood_model is not None,
        "model_device": _flood_device,
        "endpoints": {
            "health": "/api/health",
            "regions": "/api/regions",
            "state": "/api/state?region={region_id}",
            "predict": "POST /api/predict  (image upload → flood detection)",
            "toggle_road": "POST /api/roads/{road_id}/toggle?region={region_id}",
            "simulate": "POST /api/simulate?region={region_id}",
            "assign_squad": "POST /api/zones/{zone_id}/assign?region={region_id}"
        }
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint to verify backend status."""
    return {
        "status": "ok",
        "model_loaded": _flood_model is not None,
        "model_device": _flood_device,
        "model_error": _model_load_error,
        "regions_available": [r["id"] for r in REGIONS_METADATA]
    }

@app.get("/api/regions", response_model=List[RegionInfo])
def get_regions():
    """Returns metadata for all available monitoring regions worldwide."""
    return [RegionInfo(**r) for r in REGIONS_METADATA]

@app.get("/api/gdacs-live")
def get_gdacs_live():
    """Fetches real-time GDACS global flood alerts feed."""
    alerts = fetch_gdacs_live_flood_alerts()
    return {
        "count": len(alerts),
        "source": "GDACS Global Disaster Alert & Coordination System",
        "alerts": alerts
    }

@app.get("/api/state")
def get_state(region: str = Query("assam", description="Region ID: assam, bangladesh, spain, brazil, usa, global")):
    """Single state payload endpoint populating Dashboard and Map View for a selected region."""
    r_state = get_region_data(region)
    r_meta = next((r for r in REGIONS_METADATA if r["id"] == region.lower()), REGIONS_METADATA[0])
    
    return {
        "region": r_meta,
        "zones": r_state["zones"],
        "roads": r_state["roads"],
        "alerts": r_state["alerts"],
        "stats": r_state["stats"]
    }

@app.post("/api/predict", response_model=PredictionResponse)
async def predict_flood(
    file: UploadFile = File(...),
    region: Optional[str] = Query("assam", description="Target region for alert logging")
):
    """
    Flood Detection Inference endpoint using ResNet-18 PyTorch model.
    Accepts a multipart/form-data image upload and returns:
      { "label": "Flood" | "No Flood", "confidence": 0.0-1.0, "flood_probability": 0.0-1.0 }
    Automatically logs a high-priority alert if a flood is detected.
    """
    if _flood_model is None:
        detail = _model_load_error or "Model not loaded. Check server logs."
        raise HTTPException(status_code=503, detail=detail)

    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    try:
        import torch
        import torch.nn.functional as F
        from PIL import Image
        import torchvision.transforms as transforms

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
        
        # Transfer tensor to active device (CUDA GPU or CPU)
        device = torch.device(_flood_device)
        tensor = tensor.to(device)

        with torch.no_grad():
            logits = _flood_model(tensor)
            probs = F.softmax(logits, dim=1)[0]

        no_flood_prob = float(probs[0].cpu())
        flood_prob    = float(probs[1].cpu())

        is_flood   = flood_prob >= 0.5
        label      = "Flood" if is_flood else "No Flood"
        confidence = flood_prob if is_flood else no_flood_prob

        # If flood is detected with high confidence, automatically append system alert
        if is_flood:
            r_state = get_region_data(region)
            new_alert = Alert(
                id=f"alert-ml-{uuid.uuid4().hex[:8]}",
                timestamp=get_current_iso_timestamp(),
                message=f"AI SATELLITE ALERT — ResNet-18 detected active flood inundation ({round(flood_prob*100, 1)}% confidence)."
            )
            r_state["alerts"].insert(0, new_alert)

        return PredictionResponse(
            label=label,
            confidence=round(confidence, 4),
            flood_probability=round(flood_prob, 4),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference error: {str(e)}")

@app.post("/api/roads/{road_id}/toggle")
def toggle_road(road_id: str, region: str = Query("assam")):
    """Flips road status between 'open' and 'blocked' and recalculates connected zones."""
    r_state = get_region_data(region)
    roads = r_state["roads"]
    zones = r_state["zones"]
    alerts = r_state["alerts"]

    road = next((r for r in roads if r.id == road_id), None)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found in region {region}")

    new_status = "blocked" if road.status == "open" else "open"
    road.status = new_status

    affected_count = 0
    for zone in zones:
        if road_id in zone.id or road_id in [r.id for r in roads if zone.id in r.connects_zone_ids]:
            zone.priority_score = calculate_priority(zone, roads)
            zone.rationale = generate_rationale(zone, roads)
            affected_count += 1

    alert_msg = f"Road {road.name} {new_status}, {affected_count} zone(s) re-prioritized"
    new_alert = Alert(
        id=f"alert-{uuid.uuid4().hex[:8]}",
        timestamp=get_current_iso_timestamp(),
        message=alert_msg
    )
    alerts.insert(0, new_alert)

    return {
        "zones": zones,
        "roads": roads,
        "alerts": alerts
    }

@app.post("/api/simulate")
def simulate_road_block(region: str = Query("assam")):
    """Guaranteed one-click demo trigger: toggles key arterial road for selected region."""
    r_state = get_region_data(region)
    roads = r_state["roads"]

    target_road = next((r for r in roads if r.id in ["road-2", "road-b2", "road-s1", "road-br1", "road-u1"]), roads[0])
    return toggle_road(target_road.id, region=region)

@app.post("/api/zones/{zone_id}/assign")
def assign_squad(zone_id: str, request: AssignSquadRequest = None, region: str = Query("assam")):
    """Assigns responder squad to a zone and updates deployment metrics."""
    r_state = get_region_data(region)
    zones = r_state["zones"]
    stats = r_state["stats"]
    alerts = r_state["alerts"]

    zone = next((z for z in zones if z.id == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found in region {region}")

    squad_name = (request.squad_name if request and request.squad_name else None)
    if not squad_name:
        squad_name = f"Squad Delta-{zone.people_exposed // 500}"

    zone.status = "assigned"
    zone.assigned_squad = squad_name

    units_needed = 3
    actual_deploy = min(units_needed, stats.responders_available)
    stats.responders_deployed += actual_deploy
    stats.responders_available = max(0, stats.responders_available - actual_deploy)

    new_alert = Alert(
        id=f"alert-{uuid.uuid4().hex[:8]}",
        timestamp=get_current_iso_timestamp(),
        message=f"{squad_name} deployed to {zone.name}"
    )
    alerts.insert(0, new_alert)

    return {
        "zones": zones,
        "stats": stats,
        "alerts": alerts
    }
