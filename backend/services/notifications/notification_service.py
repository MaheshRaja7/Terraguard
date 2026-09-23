import os
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.services.notifications.sms_provider import SMSProvider
from backend.services.notifications.local_sms_provider import LocalSMSProvider
from backend.services.notifications.msg91_provider import MSG91Provider
from backend.services.notifications.twilio_provider import TwilioProvider
from backend.services.alerts.alert_templates import generate_multi_tier_alert_messages

class NotificationService:
    _instance: Optional["NotificationService"] = None

    @classmethod
    def get_instance(cls) -> "NotificationService":
        if cls._instance is None:
            cls._instance = NotificationService()
        return cls._instance

    def __init__(self):
        provider_type = os.getenv("SMS_PROVIDER", "local").lower()
        if provider_type == "twilio":
            self.provider: SMSProvider = TwilioProvider()
            self.provider_name = "TWILIO"
        elif provider_type == "msg91":
            self.provider: SMSProvider = MSG91Provider()
            self.provider_name = "MSG91"
        else:
            self.provider = LocalSMSProvider()
            self.provider_name = "LOCAL_SIMULATOR"

        # In-memory storage cache synchronized with Database layer
        self._history: List[Dict[str, Any]] = []

        # Real-time app-based early warning broadcast feed
        self._app_broadcasts: List[Dict[str, Any]] = [
            {
                "broadcastId": "APP-WARN-01",
                "severity": "CRITICAL",
                "riskScore": 87,
                "zoneId": "TG-018",
                "zoneName": "Gangtok - Singtam Corridor (NH-10)",
                "district": "East Sikkim",
                "title": "EMERGENCY LANDSLIDE EVACUATION ADVISORY",
                "summary": "Heavy 120mm rainfall trigger on NH-10 corridor. Severe slope debris flow predicted at 29th Mile.",
                "actionRequired": "Evacuate hillside habitations immediately. Follow DEOC instructions. Emergency Helpline: 1077.",
                "channels": ["IN_APP_BANNER", "PUSH_NOTIFICATION", "AUDIO_SIREN"],
                "audience": ["District Administration", "BRO QRT", "Local Communities"],
                "active": True,
                "createdAt": "2026-09-09T14:12:00"
            }
        ]

        # Automated early warning dispatch engine configuration
        self._auto_dispatch_config: Dict[str, Any] = {
            "enabled": True,
            "threshold_score": 75,
            "min_severity": "HIGH",
            "channels": ["SMS", "APP_BROADCAST"],
            "auto_dispatched_count": 2,
            "last_auto_dispatch": "2026-09-09T14:11:00"
        }

    async def send_notification(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Dispatches an SMS notification through active provider and stores result."""
        result = await self.provider.send_sms(phone_number, message, metadata)
        
        # Merge rich metadata fields if present
        if metadata:
            if "audienceTier" in metadata:
                result["audienceTier"] = metadata["audienceTier"]
            if "recipientTitle" in metadata:
                result["recipientTitle"] = metadata["recipientTitle"]
            if "channel" in metadata:
                result["channel"] = metadata["channel"]

        self._history.insert(0, result)
        # Cap memory buffer
        if len(self._history) > 200:
            self._history.pop()
        return result

    async def broadcast_multi_tier(
        self,
        zone_info: Optional[Dict[str, Any]] = None,
        custom_messages: Optional[Dict[str, str]] = None,
        channels: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Executes automated multi-tier broadcast to:
        1. District Administration (DM / SDM / DEOC)
        2. Disaster Management Authorities (NDMA / SDMA / NDRF / BRO)
        3. Local Communities & Citizens (Village Panchayats / Wardens)
        Across both SMS and In-App notification channels.
        """
        z = zone_info or {}
        templates_data = generate_multi_tier_alert_messages(
            zone_id=z.get("zone_id", "TG-018"),
            zone_name=z.get("zone_name", "Gangtok - Singtam Corridor (NH-10)"),
            district=z.get("district", "East Sikkim"),
            state=z.get("state", "Sikkim"),
            risk_score=float(z.get("risk_score", 87.0)),
            severity=z.get("severity", "CRITICAL"),
            rain_24h=float(z.get("rain_24h", 120.0)),
            soil_moisture=float(z.get("soil_moisture", 0.48)),
            road_name=z.get("road_name", "NH-10 Lifeline Highway")
        )

        sent_sms_list = []
        now = datetime.now()

        # 1. Send SMS to all 3 stakeholder directories
        tiers = templates_data["tiers"]
        for tier_key, tier_data in tiers.items():
            msg_to_send = (custom_messages or {}).get(tier_key) or tier_data["message"]
            for recipient in tier_data["recipients"]:
                meta = {
                    "zoneId": templates_data["zone_info"]["zone_id"],
                    "riskScore": templates_data["zone_info"]["risk_score"],
                    "severity": templates_data["zone_info"]["severity"],
                    "audienceTier": tier_key,
                    "recipientTitle": recipient.get("name", "Officer"),
                    "channel": "SMS"
                }
                sms_res = await self.send_notification(
                    phone_number=recipient["phone"],
                    message=msg_to_send,
                    metadata=meta
                )
                sent_sms_list.append({
                    "tier": tier_key,
                    "recipientName": recipient["name"],
                    "phone": recipient["phone"],
                    "messageId": sms_res.get("messageId"),
                    "status": sms_res.get("status", "DELIVERED"),
                    "channel": "SMS"
                })

        # 2. Publish real-time In-App Early Warning Broadcast
        app_broadcast = {
            "broadcastId": f"APP-WARN-{uuid.uuid4().hex[:6].upper()}",
            "severity": templates_data["zone_info"]["severity"],
            "riskScore": templates_data["zone_info"]["risk_score"],
            "zoneId": templates_data["zone_info"]["zone_id"],
            "zoneName": templates_data["zone_info"]["zone_name"],
            "district": templates_data["zone_info"]["district"],
            "title": f"AUTOMATED {templates_data['zone_info']['severity']} LANDSLIDE EARLY WARNING",
            "summary": f"Real-time sensor threshold breached in {templates_data['zone_info']['district']}. Multi-tier automated alerts transmitted.",
            "actionRequired": f"Avoid {templates_data['zone_info']['road_name']}. Local communities evacuated to designated relief shelters.",
            "channels": ["IN_APP_BANNER", "PUSH_NOTIFICATION", "AUDIO_SIREN"],
            "audience": ["District Administration", "NDRF / SDMA", "Local Communities"],
            "active": True,
            "createdAt": now.isoformat()
        }
        self.add_app_broadcast(app_broadcast)

        # Update auto-dispatch statistics
        self._auto_dispatch_config["auto_dispatched_count"] += len(sent_sms_list)
        self._auto_dispatch_config["last_auto_dispatch"] = now.isoformat()

        return {
            "success": True,
            "broadcastId": app_broadcast["broadcastId"],
            "totalRecipients": len(sent_sms_list),
            "tiersBroadcasted": list(tiers.keys()),
            "smsResults": sent_sms_list,
            "appBroadcast": app_broadcast,
            "timestamp": now.isoformat()
        }

    def get_app_broadcasts(self, limit: int = 10) -> List[Dict[str, Any]]:
        return self._app_broadcasts[:limit]

    def add_app_broadcast(self, broadcast_dict: Dict[str, Any]):
        self._app_broadcasts.insert(0, broadcast_dict)
        if len(self._app_broadcasts) > 50:
            self._app_broadcasts.pop()

    def get_auto_dispatch_status(self) -> Dict[str, Any]:
        return {
            "config": self._auto_dispatch_config,
            "active_provider": self.get_provider_status(),
            "active_app_broadcasts": len([b for b in self._app_broadcasts if b.get("active", True)])
        }

    def set_auto_dispatch_status(self, enabled: bool, threshold_score: int = 75) -> Dict[str, Any]:
        self._auto_dispatch_config["enabled"] = enabled
        self._auto_dispatch_config["threshold_score"] = threshold_score
        return self._auto_dispatch_config

    def get_sms_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history[:limit]

    def get_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self._history[:limit]

    def get_provider_status(self) -> Dict[str, Any]:
        is_local = isinstance(self.provider, LocalSMSProvider) or not getattr(self.provider, "is_configured", False)
        return {
            "provider": self.provider_name,
            "mode": "LOCAL DEMO" if is_local else "LIVE GATEWAY",
            "is_local_simulation": is_local,
            "total_sent": len(self._history),
            "status": "OPERATIONAL"
        }
