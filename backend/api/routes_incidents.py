import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel, Field
from backend.services.gis.gis_service import GISService
from backend.services.alerts.alert_engine import AlertEngine

router = APIRouter(tags=["Field Incidents"])

UPLOAD_DIR = Path(__file__).resolve().parents[2] / "backend" / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# In-memory store initialized with realistic initial NER field incidents
_INCIDENTS_STORE: List[Dict[str, Any]] = [
    {
        "id": "INC-01",
        "type": "ROAD_BLOCKAGE",
        "category": "Debris Flow & Rockfall",
        "severity": "CRITICAL",
        "district": "East Sikkim",
        "state": "Sikkim",
        "location": {"latitude": 27.2845, "longitude": 88.5412},
        "description": "Massive mud and boulder slide blocking both lanes on NH-10 at 29th Mile. Teesta river swelling nearby.",
        "road_blocked": True,
        "road_name": "NH-10",
        "reporter_name": "Field Officer T. Dorjee (BRO / SDMA)",
        "status": "IN_PROGRESS",
        "photo_url": "/demo-images/slide-nh10.jpg",
        "reported_at": "2026-09-09T14:20:00"
    },
    {
        "id": "INC-02",
        "type": "CRACK",
        "category": "Tension Cracks on Hill Cut",
        "severity": "HIGH",
        "district": "Kohima",
        "state": "Nagaland",
        "location": {"latitude": 25.6620, "longitude": 94.0950},
        "description": "Visible 15cm lateral tension cracks extending 40 meters above residential terrace in Zubza.",
        "road_blocked": False,
        "road_name": "Local Arterial",
        "reporter_name": "Patrol Officer V. Angami",
        "status": "ASSIGNED",
        "photo_url": None,
        "reported_at": "2026-09-09T13:30:00"
    },
    {
        "id": "INC-03",
        "type": "ROCKFALL",
        "category": "Unstable Overhang",
        "severity": "MODERATE",
        "district": "East Khasi Hills",
        "state": "Meghalaya",
        "location": {"latitude": 25.3120, "longitude": 91.7250},
        "description": "Scattered shale rockfall near Sohra gorge curve. Traffic moving slowly on single lane.",
        "road_blocked": False,
        "road_name": "SH-5",
        "reporter_name": "Civil Defense Warden P. Marbaniang",
        "status": "VERIFIED",
        "photo_url": None,
        "reported_at": "2026-09-09T12:15:00"
    }
]

class IncidentCreateRequest(BaseModel):
    type: str = Field("LANDSLIDE", description="LANDSLIDE, CRACK, ROCKFALL, ROAD_BLOCKAGE, etc.")
    severity: str = Field("HIGH", description="LOW, MODERATE, HIGH, CRITICAL")
    latitude: float
    longitude: float
    district: Optional[str] = "East Sikkim"
    state: Optional[str] = "Sikkim"
    description: str
    road_blocked: bool = False
    road_name: Optional[str] = None
    reporter_name: Optional[str] = "Field Officer"
    media_urls: Optional[List[str]] = Field(default_factory=list)


def _save_uploaded_media(file: UploadFile) -> str:
    if not file or not file.filename:
        raise HTTPException(status_code=400, detail="No file provided")

    content_type = (file.content_type or "").lower()
    if not (content_type.startswith("image/") or content_type.startswith("video/")):
        raise HTTPException(status_code=400, detail="Only image or video uploads are allowed")

    file_ext = Path(file.filename).suffix or ".bin"
    safe_name = f"{uuid.uuid4().hex}{file_ext}"
    file_path = UPLOAD_DIR / safe_name

    content = file.file.read()
    if len(content) > 25 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Uploaded file is larger than 25MB")

    file_path.write_bytes(content)
    return f"/uploads/{safe_name}"

@router.get("/incidents")
async def list_incidents() -> List[Dict[str, Any]]:
    return _INCIDENTS_STORE

@router.post("/incidents")
async def create_incident(incident: IncidentCreateRequest) -> Dict[str, Any]:
    inc_id = f"INC-{uuid.uuid4().hex[:6].upper()}"
    now = datetime.now()
    media_urls = list(incident.media_urls or [])

    doc = {
        "id": inc_id,
        "type": incident.type,
        "category": incident.type.replace("_", " ").title(),
        "severity": incident.severity,
        "district": incident.district,
        "state": incident.state,
        "location": {"latitude": incident.latitude, "longitude": incident.longitude},
        "description": incident.description,
        "road_blocked": incident.road_blocked,
        "road_name": incident.road_name,
        "reporter_name": incident.reporter_name,
        "status": "NEW",
        "photo_url": media_urls[0] if media_urls else None,
        "media_urls": media_urls,
        "reported_at": now.isoformat()
    }

    _INCIDENTS_STORE.insert(0, doc)

    # If it causes road blockage, update road status automatically in GIS service
    if incident.road_blocked and incident.road_name:
        gis = GISService.get_instance()
        for r in gis.get_roads():
            if incident.road_name.lower() in r["name"].lower():
                gis.update_road_status(r["id"], "BLOCKED", f"Reported by {incident.reporter_name}: {incident.description}")
                break

    # Record EOC timeline event
    AlertEngine.get_instance()._record_timeline(
        f"Field incident reported ({incident.type}): {incident.description[:45]}...",
        "FIELD",
        "INCIDENT_REPORTED",
        inc_id
    )

    return {"success": True, "incident": doc}


@router.post("/incidents/upload")
async def create_incident_with_media(
    type: str = Form(...),
    severity: str = Form("HIGH"),
    latitude: float = Form(...),
    longitude: float = Form(...),
    district: Optional[str] = Form("East Sikkim"),
    state: Optional[str] = Form("Sikkim"),
    description: str = Form(...),
    road_blocked: bool = Form(False),
    road_name: Optional[str] = Form(None),
    reporter_name: Optional[str] = Form("Field Officer"),
    files: List[UploadFile] = File(default_factory=list),
) -> Dict[str, Any]:
    media_urls = [_save_uploaded_media(file) for file in files]
    incident = IncidentCreateRequest(
        type=type,
        severity=severity,
        latitude=latitude,
        longitude=longitude,
        district=district,
        state=state,
        description=description,
        road_blocked=road_blocked,
        road_name=road_name,
        reporter_name=reporter_name,
        media_urls=media_urls,
    )
    return await create_incident(incident)

@router.get("/incidents/{incident_id}")
async def get_incident(incident_id: str) -> Dict[str, Any]:
    for inc in _INCIDENTS_STORE:
        if inc["id"] == incident_id:
            return inc
    raise HTTPException(status_code=404, detail="Incident not found")
