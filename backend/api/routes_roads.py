from fastapi import APIRouter, HTTPException
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.services.gis.gis_service import GISService
from backend.services.alerts.alert_engine import AlertEngine

router = APIRouter(tags=["Road Monitoring"])

class RoadStatusUpdate(BaseModel):
    status: str # OPEN, PARTIAL, BLOCKED, CRITICAL
    blockage_location: Optional[str] = None
    alternative_route: Optional[str] = None

@router.get("/roads")
async def get_monitored_roads() -> List[Dict[str, Any]]:
    return GISService.get_instance().get_roads()

@router.patch("/roads/{road_id}")
async def update_road(road_id: str, req: RoadStatusUpdate) -> Dict[str, Any]:
    gis = GISService.get_instance()
    road = gis.update_road_status(road_id, req.status, req.blockage_location)
    if not road:
        raise HTTPException(status_code=404, detail="Road corridor not found")
    
    if req.alternative_route:
        road["alternative_route"] = req.alternative_route

    AlertEngine.get_instance()._record_timeline(
        f"Corridor status changed: {road['name']} is now {req.status}",
        road_id,
        "ROAD_STATUS_CHANGED"
    )

    return {"success": True, "road": road}
