from fastapi import APIRouter
from typing import Dict, Any
from backend.services.alerts.alert_engine import AlertEngine
from backend.services.gis.gis_service import GISService
from backend.services.notifications.notification_service import NotificationService
from backend.ml.risk_engine import RiskEngine

router = APIRouter(tags=["Judge Demo & Scenarios"])

# Active demo state tracking
_DEMO_STATE = {
    "emergency_scenario_active": False,
    "target_zone": "TG-018",
    "last_run": None
}

@router.get("/demo/status")
async def get_demo_status() -> Dict[str, Any]:
    return _DEMO_STATE

@router.post("/demo/run-scenario")
async def run_emergency_scenario() -> Dict[str, Any]:
    """
    ONE-CLICK HACKATHON DEMO:
    Escalates Zone TG-018 (Gangtok Corridor NH-10) from Moderate (42) to Critical (87),
    triggers critical alert, dispatches local SMS simulation, sets Priority to P1,
    flags NH-10 blockage, and updates EOC Command Center timeline.
    """
    _DEMO_STATE["emergency_scenario_active"] = True

    gis = GISService.get_instance()
    alert_engine = AlertEngine.get_instance()
    notif_service = NotificationService.get_instance()

    # 1. Update Road NH-10 to BLOCKED
    gis.update_road_status(
        "RD-NH10", 
        "BLOCKED", 
        "Critical debris slide triggered at 29th Mile under 120mm extreme precipitation"
    )

    # 2. Simulate escalated zone assessment (Risk 87 / CRITICAL)
    escalated_assessment = {
        "zone_id": "TG-018",
        "zone_name": "Gangtok - Singtam Corridor (NH-10)",
        "district": "East Sikkim",
        "state": "Sikkim",
        "risk_score": 87.0,
        "risk_level": "CRITICAL",
        "priority": {"priority_tier": "P1", "priority_label": "P1 CRITICAL"},
        "layers": {
            "trigger": {
                "rain_24h": 120.0,
                "rain_6h": 55.0,
                "soil_moisture_0_7": 0.48
            }
        }
    }

    # 3. Trigger Alert & Automated Local SMS
    alert = alert_engine.process_zone_assessment(escalated_assessment, notify_sms=True)

    # 4. Record Key Timeline Progression
    alert_engine._record_timeline("EMERGENCY SCENARIO: Flash flood & landslide warning issued for East District", "TG-018", "SCENARIO_RUN")
    alert_engine._record_timeline("AI Risk accelerated to 87/100 (CRITICAL) on NH-10 corridor", "TG-018", "RISK_ACCELERATION")
    alert_engine._record_timeline("Automated SMS dispatched to District Emergency Operations Centre", "TG-018", "SMS_DISPATCH")

    return {
        "success": True,
        "scenario": "CRITICAL LANDSLIDE ON NH-10 GANGTOK CORRIDOR",
        "zone_id": "TG-018",
        "initial_risk": 42.0,
        "simulated_risk": 87.0,
        "risk_level": "CRITICAL",
        "priority": "P1 CRITICAL",
        "rainfall_mm": 120.0,
        "soil_moisture": 0.48,
        "road_status": "BLOCKED (NH-10)",
        "sms_status": "DELIVERED — LOCAL DEMO",
        "alert_id": alert["id"] if alert else "ALT-ACTIVE",
        "message": "Emergency Scenario triggered successfully. EOC displays updated in real-time."
    }

@router.post("/demo/reset")
async def reset_demo_scenario() -> Dict[str, Any]:
    _DEMO_STATE["emergency_scenario_active"] = False
    gis = GISService.get_instance()
    gis.update_road_status("RD-NH10", "PARTIAL", "Controlled single-lane clearance in progress")
    return {"success": True, "message": "Demo state reset to standard baseline monitoring."}
