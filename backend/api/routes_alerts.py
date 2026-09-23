from fastapi import APIRouter, HTTPException, Body, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.services.alerts.alert_engine import AlertEngine
from backend.services.alerts.live_weather_scanner import LiveWeatherScanner
from backend.services.notifications.notification_service import NotificationService

router = APIRouter(tags=["Alert Engine"])

class AcknowledgeRequest(BaseModel):
    officer_name: Optional[str] = "Duty Commander"

class LiveWeatherScanRequest(BaseModel):
    limit: Optional[int] = None
    notify_sms: bool = True
    force_dispatch: bool = False
    elevated_threshold: float = 45.0

@router.get("/alerts")
async def get_alerts(status: Optional[str] = None) -> List[Dict[str, Any]]:
    return AlertEngine.get_instance().get_alerts(status)

@router.get("/alerts/places")
async def get_matching_places() -> Dict[str, Any]:
    """Returns all geographic places matching the landslide catalog and historical inventory."""
    scanner = LiveWeatherScanner.get_instance()
    places = scanner.get_matching_landslide_places()
    return {
        "total": len(places),
        "places": places
    }

@router.post("/alerts/evaluate-live-weather")
async def evaluate_live_weather_alerts(req: Optional[LiveWeatherScanRequest] = None) -> Dict[str, Any]:
    """
    Evaluates real-time weather & modelled soil moisture for all places matching the landslide dataset.
    Uses the trained multi-dataset ML model (TG-XGB-2.0-NER-UNIFIED) to predict risk,
    and dispatches multi-tier alert messages (SMS & In-App) for any place with elevated/critical risk.
    """
    scanner = LiveWeatherScanner.get_instance()
    limit = req.limit if req else None
    notify = req.notify_sms if req else True
    force = req.force_dispatch if req else False
    threshold = req.elevated_threshold if req else 45.0

    result = await scanner.scan_all_places_and_alert(
        places_limit=limit,
        notify_sms=notify,
        force_dispatch=force,
        elevated_threshold=threshold
    )
    return {
        "success": True,
        "message": f"Scanned {result['total_places_scanned']} landslide places. Elevated risk detected in {result['elevated_places_count']} places. Dispatched {result['alerts_dispatched_count']} early warnings.",
        "data": result
    }

@router.get("/alerts/live-weather-status")
async def get_live_weather_status() -> Dict[str, Any]:
    """Returns status and results of the most recent real-time weather evaluation scan."""
    scanner = LiveWeatherScanner.get_instance()
    res = scanner.get_last_scan_results()
    if not res:
        return {"has_scanned": False, "message": "No live weather scan executed yet in current session."}
    return {"has_scanned": True, "data": res}

@router.post("/alerts/test-critical")
async def trigger_test_critical_alert() -> Dict[str, Any]:
    """
    Test Critical Alert Trigger:
    1. Simulates critical elevation in Zone TG-018 (Risk 87 / CRITICAL)
    2. Issues early warning advisory
    3. Triggers local SMS delivery lifecycle
    4. Updates EOC timeline & priority queue
    """
    engine = AlertEngine.get_instance()
    simulated_assessment = {
        "zone_id": "TG-018",
        "zone_name": "Gangtok - Singtam Corridor (NH-10)",
        "district": "East Sikkim",
        "state": "Sikkim",
        "risk_score": 87.0,
        "risk_level": "CRITICAL",
        "priority": {"priority_tier": "P1", "priority_label": "P1 CRITICAL"},
        "layers": {
            "trigger": {"rain_24h": 120.0, "soil_moisture_0_7": 0.48}
        }
    }
    
    alert = engine.process_zone_assessment(simulated_assessment, notify_sms=True)
    return {
        "success": True,
        "alert": alert,
        "message": "Critical landslide alert triggered and local SMS simulated successfully."
    }

@router.patch("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, req: AcknowledgeRequest) -> Dict[str, Any]:
    alert = AlertEngine.get_instance().acknowledge_alert(alert_id, req.officer_name)
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "alert": alert}
