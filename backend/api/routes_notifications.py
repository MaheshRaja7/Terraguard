from fastapi import APIRouter, Query
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field
from backend.services.notifications.notification_service import NotificationService
from backend.services.alerts.alert_templates import generate_multi_tier_alert_messages

router = APIRouter(tags=["Notifications & SMS Center"])

class TestSMSRequest(BaseModel):
    phoneNumber: str = Field("+919999999999", description="Destination phone number")
    message: str = Field("TERRAGUARD test alert", description="Message content")
    audienceTier: Optional[str] = Field("GENERAL", description="DISTRICT_ADMIN, DISASTER_AUTHORITIES, or COMMUNITY")

class MultiTierBroadcastRequest(BaseModel):
    zone_id: Optional[str] = Field("TG-018", description="Zone ID")
    zone_name: Optional[str] = Field("Gangtok - Singtam Corridor (NH-10)")
    district: Optional[str] = Field("East Sikkim")
    state: Optional[str] = Field("Sikkim")
    risk_score: Optional[float] = Field(87.0)
    severity: Optional[str] = Field("CRITICAL")
    rain_24h: Optional[float] = Field(120.0)
    soil_moisture: Optional[float] = Field(0.48)
    road_name: Optional[str] = Field("NH-10 Lifeline Highway")
    custom_messages: Optional[Dict[str, str]] = Field(default=None, description="Optional overrides per tier")

class AutoDispatchConfigRequest(BaseModel):
    enabled: bool = Field(True, description="Enable automated early warning dispatch")
    threshold_score: int = Field(75, description="Trigger threshold score (e.g. 75 for High/Critical)")

class AppBroadcastRequest(BaseModel):
    title: str = Field("CRITICAL LANDSLIDE WARNING")
    summary: str = Field("Intense precipitation triggering slope failure.")
    actionRequired: str = Field("Evacuate to designated relief camps.")
    district: str = Field("East Sikkim")
    zoneId: str = Field("TG-018")
    severity: str = Field("CRITICAL")
    riskScore: int = Field(87)

@router.get("/notifications/templates")
async def get_alert_templates(
    zone_id: str = Query("TG-018"),
    district: str = Query("East Sikkim"),
    state: str = Query("Sikkim"),
    risk_score: float = Query(87.0),
    severity: str = Query("CRITICAL"),
    rain_24h: float = Query(120.0),
    soil_moisture: float = Query(0.48),
    road_name: str = Query("NH-10 Lifeline Highway")
) -> Dict[str, Any]:
    """Returns standardized Common Alerting Protocol (CAP) messages for all 3 disaster tiers."""
    return generate_multi_tier_alert_messages(
        zone_id=zone_id,
        district=district,
        state=state,
        risk_score=risk_score,
        severity=severity,
        rain_24h=rain_24h,
        soil_moisture=soil_moisture,
        road_name=road_name
    )

@router.post("/notifications/broadcast-multi-tier")
async def broadcast_multi_tier(req: MultiTierBroadcastRequest) -> Dict[str, Any]:
    """
    Automated Multi-Tier Early Warning Dispatch:
    Transmits automated SMS and App broadcasts simultaneously to:
    1. District Administration (DM / SDM / DEOC)
    2. Disaster Management Authorities (NDMA / SDMA / NDRF / BRO)
    3. Local Communities & Citizens (Village Panchayats / Wardens)
    """
    svc = NotificationService.get_instance()
    res = await svc.broadcast_multi_tier(
        zone_info=req.model_dump(),
        custom_messages=req.custom_messages
    )
    return res

@router.get("/notifications/auto-dispatch")
async def get_auto_dispatch_status() -> Dict[str, Any]:
    return NotificationService.get_instance().get_auto_dispatch_status()

@router.post("/notifications/auto-dispatch")
async def update_auto_dispatch_config(req: AutoDispatchConfigRequest) -> Dict[str, Any]:
    return NotificationService.get_instance().set_auto_dispatch_status(
        enabled=req.enabled,
        threshold_score=req.threshold_score
    )

@router.get("/notifications/app-broadcasts")
async def get_app_broadcasts(limit: int = 10) -> List[Dict[str, Any]]:
    return NotificationService.get_instance().get_app_broadcasts(limit)

@router.post("/notifications/app-broadcasts")
async def create_app_broadcast(req: AppBroadcastRequest) -> Dict[str, Any]:
    import uuid
    from datetime import datetime
    doc = {
        "broadcastId": f"APP-WARN-{uuid.uuid4().hex[:6].upper()}",
        "severity": req.severity,
        "riskScore": req.riskScore,
        "zoneId": req.zoneId,
        "district": req.district,
        "title": req.title,
        "summary": req.summary,
        "actionRequired": req.actionRequired,
        "channels": ["IN_APP_BANNER", "PUSH_NOTIFICATION", "AUDIO_SIREN"],
        "active": True,
        "createdAt": datetime.now().isoformat()
    }
    NotificationService.get_instance().add_app_broadcast(doc)
    return {"success": True, "broadcast": doc}

@router.post("/notifications/test-sms")
async def send_test_sms(req: TestSMSRequest) -> Dict[str, Any]:
    svc = NotificationService.get_instance()
    res = await svc.send_notification(
        phone_number=req.phoneNumber,
        message=req.message,
        metadata={
            "zoneId": "TG-018",
            "riskScore": 87,
            "severity": "CRITICAL",
            "audienceTier": req.audienceTier,
            "channel": "SMS"
        }
    )
    return {
        "success": True,
        "provider": res.get("provider", "LOCAL_SIMULATOR"),
        "messageId": res.get("messageId"),
        "status": res.get("status", "DELIVERED"),
        "displayStatus": res.get("displayStatus", "SMS DELIVERED — LOCAL DEMO"),
        "demo": res.get("demo", True),
        "recipient": res.get("recipient"),
        "audienceTier": res.get("audienceTier", req.audienceTier),
        "timestamp": res.get("deliveredAt") or res.get("createdAt")
    }

@router.get("/notifications")
@router.get("/notifications/sms")
async def get_sms_logs() -> Dict[str, Any]:
    svc = NotificationService.get_instance()
    status = svc.get_provider_status()
    history = svc.get_sms_history(limit=50)
    
    # If history is empty, seed with authentic initial simulation messages across all 3 tiers
    if not history:
        history = [
            {
                "messageId": "SMS-TG-00001",
                "type": "SMS",
                "provider": "LOCAL_SIMULATOR",
                "recipient": "+919876543210",
                "recipientTitle": "District Magistrate & DEOC Controller (East Sikkim)",
                "audienceTier": "DISTRICT_ADMIN",
                "message": "[TERRAGUARD-CAP / DISTRICT ADMIN] URGENT CRITICAL LANDSLIDE RISK in Zone TG-018 (East Sikkim). Risk: 87/100. Rain: 120mm. DIRECTIVE: Convene DEOC Incident Command, order preventive hillside evacuations, pre-position earth movers along NH-10.",
                "zoneId": "TG-018",
                "riskScore": 87,
                "severity": "CRITICAL",
                "status": "DELIVERED",
                "displayStatus": "SMS DELIVERED — LOCAL DEMO",
                "demo": True,
                "createdAt": "2026-09-09T14:11:00",
                "deliveredAt": "2026-09-09T14:11:02"
            },
            {
                "messageId": "SMS-TG-00002",
                "type": "SMS",
                "provider": "LOCAL_SIMULATOR",
                "recipient": "+919436123456",
                "recipientTitle": "NDRF 2nd Battalion HQ",
                "audienceTier": "DISASTER_AUTHORITIES",
                "message": "[TERRAGUARD-CAP / TACTICAL DM] SECTOR TG-018 (East Sikkim). 24h Rain: 120mm. Soil moisture threshold exceeded. TACTICAL ACTION: Place SAR teams on 15-min rollout standby. BRO QRT deploy bulldozers along NH-10 chokepoints.",
                "zoneId": "TG-018",
                "riskScore": 87,
                "severity": "CRITICAL",
                "status": "DELIVERED",
                "displayStatus": "SMS DELIVERED — LOCAL DEMO",
                "demo": True,
                "createdAt": "2026-09-09T14:11:01",
                "deliveredAt": "2026-09-09T14:11:03"
            },
            {
                "messageId": "SMS-TG-00003",
                "type": "SMS",
                "provider": "LOCAL_SIMULATOR",
                "recipient": "+919811223344",
                "recipientTitle": "Tathangchen Village Disaster Committee",
                "audienceTier": "COMMUNITY",
                "message": "[TERRAGUARD PUBLIC WARNING / आपदा चेतावनी] URGENT LANDSLIDE ALERT for East Sikkim (TG-018). Risk: CRITICAL. Shift to designated relief shelters immediately. Avoid NH-10. Helplines: 1077 / 112. भारी बारिश के कारण सुरक्षित स्थानों पर शरण लें।",
                "zoneId": "TG-018",
                "riskScore": 87,
                "severity": "CRITICAL",
                "status": "DELIVERED",
                "displayStatus": "SMS DELIVERED — LOCAL DEMO",
                "demo": True,
                "createdAt": "2026-09-09T14:11:02",
                "deliveredAt": "2026-09-09T14:11:04"
            }
        ]

    return {
        "status": status,
        "history": history
    }
