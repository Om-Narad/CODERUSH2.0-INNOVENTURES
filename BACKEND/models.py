from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field

class Zone(BaseModel):
    id: str
    name: str
    geometry: Dict[str, Any]  # GeoJSON polygon dict
    people_exposed: int
    priority_score: int
    status: str = "pending"  # "pending" | "assigned"
    assigned_squad: Optional[str] = None
    assigned_shelter: str
    rationale: str

class Road(BaseModel):
    id: str
    name: str
    geometry: Dict[str, Any]  # GeoJSON LineString dict
    status: str = "open"  # "open" | "blocked"
    connects_zone_ids: List[str]

class Alert(BaseModel):
    id: str
    timestamp: str  # ISO format string
    message: str

class Stats(BaseModel):
    responders_deployed: int = 12
    responders_available: int = 20
    shelters_at_capacity: int = 2
    shelters_total: int = 5

class AssignSquadRequest(BaseModel):
    squad_name: Optional[str] = None

class PredictionResponse(BaseModel):
    label: str          # "Flood" or "No Flood"
    confidence: float   # 0.0 – 1.0
    flood_probability: float  # raw softmax probability for flood class
