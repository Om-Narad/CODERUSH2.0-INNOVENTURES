"""
Nagpur Flood Safe — Backend API
===============================
FastAPI backend service for Nagpur Flood Safe Disaster Management System.
Monitors Nagpur Municipal Corporation (NMC) sectors, Nag River & Gorewada Nullah flood risk,
and provides ResNet-18 flood detection inference.
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
    """Loads flood_resnet18.pth at startup safely without crashing application startup."""
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

        # Resolve path: model lives in root directory or BACKEND directory
        base_dir = os.path.dirname(__file__)
        candidate_paths = [
            os.path.abspath(os.path.join(base_dir, '..', 'flood_resnet18.pth')),
            os.path.abspath(os.path.join(base_dir, 'flood_resnet18.pth')),
            os.path.abspath('flood_resnet18.pth')
        ]

        model_path = None
        for p in candidate_paths:
            if os.path.exists(p):
                model_path = p
                break

        if not model_path:
            _model_load_error = "Model file flood_resnet18.pth not found locally (will use rule-based image telemetry)."
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
        print(f"[INFO] Nagpur flood detection model loaded from {model_path} on device: {_flood_device.upper()}")

    except Exception as e:
        _model_load_error = f"Model load deferred: {str(e)}"
        print(f"[WARN] PyTorch model initialization skipped: {e}")


app = FastAPI(
    title="Nagpur Flood Safe API",
    description="Backend API for Nagpur Flood Safe — Real-time Nag River & Gorewada Nullah flood monitoring and emergency rescoring",
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

# ─── Nagpur In-Memory State Repository ───────────────────────────────────────
REGION_STATES: Dict[str, Dict] = {}

def get_current_iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()

def seed_region_state(region_id: str = "nagpur"):
    """Initializes in-memory Python structures for Nagpur flood response."""
    r_data = MULTI_REGION_DATA.get("nagpur", MULTI_REGION_DATA["nagpur"])

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

    REGION_STATES["nagpur"] = {
        "roads": roads,
        "zones": zones,
        "alerts": alerts,
        "stats": stats
    }
    return REGION_STATES["nagpur"]

def get_region_data(region_id: str = "nagpur"):
    if "nagpur" not in REGION_STATES:
        seed_region_state("nagpur")
    return REGION_STATES["nagpur"]


@app.on_event("startup")
def startup_event():
    """Startup handler: ensures in-memory data seeding and safe model initialization."""
    try:
        seed_region_state("nagpur")
    except Exception as e:
        print(f"[ERROR] Failed to seed state: {e}")

    try:
        _load_flood_model()
    except Exception as e:
        print(f"[WARN] Model load failed gracefully: {e}")


@app.get("/")
def root():
    """Root endpoint welcoming user and providing API metadata."""
    return {
        "service": "Nagpur Flood Safe API",
        "status": "online",
        "region": "Nagpur (Maharashtra, India)",
        "center_coordinates": [21.1458, 79.0882],
        "version": "2.0.0",
        "model_loaded": _flood_model is not None,
        "model_device": _flood_device,
        "endpoints": {
            "health": "/api/health",
            "regions": "/api/regions",
            "state": "/api/state",
            "predict": "POST /api/predict (image upload → flood detection)",
            "toggle_road": "POST /api/roads/{road_id}/toggle",
            "simulate": "POST /api/simulate",
            "assign_squad": "POST /api/zones/{zone_id}/assign"
        }
    }

@app.get("/api/health")
def health_check():
    """Health check endpoint required by Render and deployment tools."""
    return {
        "status": "ok",
        "app": "Nagpur Flood Safe",
        "city": "Nagpur",
        "model_loaded": _flood_model is not None,
        "model_device": _flood_device,
        "model_notice": _model_load_error,
        "regions_available": ["nagpur"]
    }

@app.get("/api/regions", response_model=List[RegionInfo])
def get_regions():
    """Returns metadata for Nagpur Flood Command Center."""
    return [RegionInfo(**r) for r in REGIONS_METADATA]

@app.get("/api/gdacs-live")
def get_gdacs_live():
    """Fetches live flood alerts feed."""
    alerts = fetch_gdacs_live_flood_alerts()
    return {
        "count": len(alerts),
        "source": "GDACS Disaster Telemetry Feed",
        "alerts": alerts
    }

@app.get("/api/state")
def get_state(region: Optional[str] = Query("nagpur", description="Region ID: nagpur")):
    """Single state payload endpoint populating Dashboard and Map View for Nagpur."""
    r_state = get_region_data("nagpur")
    r_meta = REGIONS_METADATA[0]
    
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
    region: Optional[str] = Query("nagpur", description="Target region for alert logging")
):
    """
    Flood Detection Inference endpoint.
    Accepts a multipart/form-data image upload and returns flood detection confidence.
    """
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image (JPEG, PNG, etc.)")

    try:
        raw = await file.read()
        
        # If PyTorch model is loaded, run PyTorch inference
        if _flood_model is not None:
            import torch
            import torch.nn.functional as F
            from PIL import Image
            import torchvision.transforms as transforms

            img = Image.open(io.BytesIO(raw)).convert("RGB")
            preprocess = transforms.Compose([
                transforms.Resize(256),
                transforms.CenterCrop(224),
                transforms.ToTensor(),
                transforms.Normalize(
                    mean=[0.485, 0.456, 0.406],
                    std=[0.229, 0.224, 0.225]
                ),
            ])

            tensor = preprocess(img).unsqueeze(0)
            device = torch.device(_flood_device)
            tensor = tensor.to(device)

            with torch.no_grad():
                logits = _flood_model(tensor)
                probs = F.softmax(logits, dim=1)[0]

            no_flood_prob = float(probs[0].cpu())
            flood_prob    = float(probs[1].cpu())
        else:
            # Fallback heuristic using PIL image analysis if model file is not present
            from PIL import Image
            img = Image.open(io.BytesIO(raw)).convert("RGB")
            # Analyze blue/muddy water pixel dominance
            pixels = list(img.getdata())
            water_pixels = sum(1 for r, g, b in pixels if (b > r and b > g) or (r > 100 and g > 90 and b < 80))
            ratio = water_pixels / max(1, len(pixels))
            flood_prob = min(0.98, max(0.25, ratio * 2.5))
            no_flood_prob = 1.0 - flood_prob

        is_flood   = flood_prob >= 0.5
        label      = "Flood" if is_flood else "No Flood"
        confidence = flood_prob if is_flood else no_flood_prob

        # If flood is detected, log alert into Nagpur state
        if is_flood:
            r_state = get_region_data("nagpur")
            new_alert = Alert(
                id=f"alert-ml-{uuid.uuid4().hex[:8]}",
                timestamp=get_current_iso_timestamp(),
                message=f"AI SATELLITE ALERT — Detected active inundation risk in Nagpur sector ({round(flood_prob*100, 1)}% confidence)."
            )
            r_state["alerts"].insert(0, new_alert)

        return PredictionResponse(
            label=label,
            confidence=round(confidence, 4),
            flood_probability=round(flood_prob, 4),
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference processing error: {str(e)}")

@app.post("/api/roads/{road_id}/toggle")
def toggle_road(road_id: str, region: Optional[str] = Query("nagpur")):
    """Flips road status between 'open' and 'blocked' and recalculates connected zones."""
    r_state = get_region_data("nagpur")
    roads = r_state["roads"]
    zones = r_state["zones"]
    alerts = r_state["alerts"]

    road = next((r for r in roads if r.id == road_id), None)
    if not road:
        raise HTTPException(status_code=404, detail=f"Road {road_id} not found in Nagpur region")

    new_status = "blocked" if road.status == "open" else "open"
    road.status = new_status

    affected_count = 0
    for zone in zones:
        if road_id in zone.id or road_id in [r.id for r in roads if zone.id in r.connects_zone_ids]:
            zone.priority_score = calculate_priority(zone, roads)
            zone.rationale = generate_rationale(zone, roads)
            affected_count += 1

    alert_msg = f"Nagpur Arterial {road.name} {new_status}, {affected_count} zone(s) re-prioritized"
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
def simulate_road_block(region: Optional[str] = Query("nagpur")):
    """Demo trigger: toggles Manish Nagar / Narendra Nagar underpass road status."""
    r_state = get_region_data("nagpur")
    roads = r_state["roads"]

    target_road = next((r for r in roads if r.id in ["road-1", "road-2"]), roads[0])
    return toggle_road(target_road.id, region="nagpur")

@app.post("/api/zones/{zone_id}/assign")
def assign_squad(zone_id: str, request: AssignSquadRequest = None, region: Optional[str] = Query("nagpur")):
    """Assigns responder squad to a Nagpur zone and updates deployment metrics."""
    r_state = get_region_data("nagpur")
    zones = r_state["zones"]
    stats = r_state["stats"]
    alerts = r_state["alerts"]

    zone = next((z for z in zones if z.id == zone_id), None)
    if not zone:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found in Nagpur")

    squad_name = (request.squad_name if request and request.squad_name else None)
    if not squad_name:
        squad_name = f"Nagpur Quick Response Squad-{zone.people_exposed // 500}"

    zone.status = "assigned"
    zone.assigned_squad = squad_name

    units_needed = 3
    actual_deploy = min(units_needed, stats.responders_available)
    stats.responders_deployed += actual_deploy
    stats.responders_available = max(0, stats.responders_available - actual_deploy)

    new_alert = Alert(
        id=f"alert-{uuid.uuid4().hex[:8]}",
        timestamp=get_current_iso_timestamp(),
        message=f"{squad_name} deployed to {zone.name}, Nagpur"
    )
    alerts.insert(0, new_alert)

    return {
        "zones": zones,
        "stats": stats,
        "alerts": alerts
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
