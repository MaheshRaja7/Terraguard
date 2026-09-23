import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
from backend.services.notifications.notification_service import NotificationService

class AlertEngine:
    _instance: Optional["AlertEngine"] = None

    @classmethod
    def get_instance(cls) -> "AlertEngine":
        if cls._instance is None:
            cls._instance = AlertEngine()
        return cls._instance

    def __init__(self):
        self.notification_service = NotificationService.get_instance()
        self._alerts: Dict[str, Dict[str, Any]] = {}
        self._active_zone_severity: Dict[str, str] = {}
        self._timeline_events: List[Dict[str, Any]] = []

    def process_zone_assessment(self, zone_eval: Dict[str, Any], notify_sms: bool = True) -> Optional[Dict[str, Any]]:
        """
        Evaluates zone risk against alert thresholds.
        Implements duplicate prevention, escalation detection, and automated SMS dispatch.
        """
        zone_id = zone_eval.get("zone_id", "TG-000")
        risk_score = zone_eval.get("risk_score", 0.0)
        risk_level = zone_eval.get("risk_level", "LOW")
        previous_severity = self._active_zone_severity.get(zone_id)

        # Only HIGH (51-75) and CRITICAL (76-100) trigger early warnings
        if risk_level not in ["HIGH", "CRITICAL"]:
            if previous_severity in ["HIGH", "CRITICAL"]:
                # Zone de-escalated
                self._record_timeline(f"Zone {zone_id} de-escalated from {previous_severity} to {risk_level}", zone_id, "DE_ESCALATION")
                self._active_zone_severity[zone_id] = risk_level
            return None

        # Check for duplicate: if severity hasn't changed, suppress duplicate alert
        if previous_severity == risk_level:
            return None

        is_escalation = (previous_severity == "HIGH" and risk_level == "CRITICAL")
        self._active_zone_severity[zone_id] = risk_level

        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now()

        # Build official message template
        district = zone_eval.get("district", "NER District")
        rainfall = zone_eval.get("layers", {}).get("trigger", {}).get("rain_24h", 0.0)
        
        msg_text = (
            f"TERRAGUARD AI ALERT: {risk_level} LANDSLIDE RISK\n"
            f"Zone: {zone_id} ({district})\n"
            f"Risk Score: {risk_score}/100\n"
            f"Rainfall: {rainfall}mm (24h)\n"
            f"Action: Avoid exposed road corridors. Alert local response teams. Follow SDMA/NDMA advisories."
        )

        alert_doc = {
            "id": alert_id,
            "zoneId": zone_id,
            "zoneName": zone_eval.get("zone_name"),
            "district": district,
            "state": zone_eval.get("state"),
            "riskScore": risk_score,
            "severity": risk_level,
            "isEscalation": is_escalation,
            "alertType": "LANDSLIDE_RISK",
            "message": msg_text,
            "recipients": ["+919876543210", "+919436000001"], # Duty Officer & SDMA Liaison
            "channels": ["SMS", "WEB"],
            "createdAt": now.isoformat(),
            "sentAt": now.isoformat(),
            "status": "ACTIVE", # ACTIVE, ACKNOWLEDGED, ASSIGNED, IN_PROGRESS, RESOLVED, CLOSED
            "acknowledgedAt": None,
            "acknowledgedBy": None,
            "assignedOfficer": None,
            "priority": zone_eval.get("priority", {}).get("priority_tier", "P1")
        }

        self._alerts[alert_id] = alert_doc

        # Dispatch Local / Gateway SMS and Automated Multi-Tier Broadcast if configured
        if notify_sms:
            import asyncio
            try:
                loop = asyncio.get_event_loop()
                if loop.is_running():
                    # Check auto dispatch threshold
                    auto_cfg = getattr(self.notification_service, "_auto_dispatch_config", {})
                    if auto_cfg.get("enabled", True) and risk_score >= auto_cfg.get("threshold_score", 75):
                        asyncio.create_task(self.notification_service.broadcast_multi_tier({
                            "zone_id": zone_id,
                            "zone_name": zone_eval.get("zone_name", "Corridor Sector"),
                            "district": district,
                            "state": zone_eval.get("state", "Sikkim"),
                            "risk_score": risk_score,
                            "severity": risk_level,
                            "rain_24h": rainfall,
                            "soil_moisture": zone_eval.get("layers", {}).get("trigger", {}).get("soil_moisture_0_7", 0.48),
                            "road_name": "NH-10 Lifeline Highway"
                        }))
                    else:
                        for recipient in alert_doc["recipients"]:
                            asyncio.create_task(self.notification_service.send_notification(
                                recipient, msg_text, metadata={"zoneId": zone_id, "riskScore": risk_score, "severity": risk_level, "audienceTier": "DISTRICT_ADMIN"}
                            ))
            except Exception as e:
                print(f"[AlertEngine] Async dispatch error: {e}")

        # Timeline event
        ev_title = f"Critical alert issued for {zone_id}" if risk_level == "CRITICAL" else f"High risk alert issued for {zone_id}"
        self._record_timeline(ev_title, zone_id, "ALERT_ISSUED", alert_id)

        return alert_doc

    def _record_timeline(self, title: str, zone_id: str, event_type: str, ref_id: Optional[str] = None):
        self._timeline_events.insert(0, {
            "id": f"EV-{uuid.uuid4().hex[:6]}",
            "title": title,
            "zoneId": zone_id,
            "type": event_type,
            "refId": ref_id,
            "timestamp": datetime.now().strftime("%H:%M"),
            "isoTimestamp": datetime.now().isoformat()
        })
        if len(self._timeline_events) > 100:
            self._timeline_events.pop()

    def get_alerts(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        all_alerts = list(self._alerts.values())
        if status:
            return [a for a in all_alerts if a["status"] == status]
        return sorted(all_alerts, key=lambda x: x["createdAt"], reverse=True)

    def acknowledge_alert(self, alert_id: str, officer_name: str = "Duty Commander") -> Optional[Dict[str, Any]]:
        if alert_id in self._alerts:
            self._alerts[alert_id]["status"] = "ACKNOWLEDGED"
            self._alerts[alert_id]["acknowledgedAt"] = datetime.now().isoformat()
            self._alerts[alert_id]["acknowledgedBy"] = officer_name
            self._record_timeline(f"Alert {alert_id} acknowledged by {officer_name}", self._alerts[alert_id]["zoneId"], "ALERT_ACKNOWLEDGED", alert_id)
            return self._alerts[alert_id]
        return None

    def get_timeline(self, limit: int = 20) -> List[Dict[str, Any]]:
        if not self._timeline_events:
            # Seed default realistic timeline events
            now = datetime.now()
            return [
                {"id": "EV-01", "title": "Field officer assigned to Gangtok NH-10 corridor", "zoneId": "TG-018", "type": "OFFICER_ASSIGNED", "timestamp": "14:14", "isoTimestamp": now.isoformat()},
                {"id": "EV-02", "title": "Critical warning advisory issued to East District DDMA", "zoneId": "TG-018", "type": "ALERT_ISSUED", "timestamp": "14:11", "isoTimestamp": now.isoformat()},
                {"id": "EV-03", "title": "AI Risk elevated: 71 -> 87 (CRITICAL)", "zoneId": "TG-018", "type": "RISK_ELEVATED", "timestamp": "14:10", "isoTimestamp": now.isoformat()},
                {"id": "EV-04", "title": "Modelled soil moisture saturation exceeded 0.42 m³/m³", "zoneId": "TG-018", "type": "SOIL_THRESHOLD", "timestamp": "14:08", "isoTimestamp": now.isoformat()},
                {"id": "EV-05", "title": "Rainfall threshold exceeded (6h: 45mm)", "zoneId": "TG-018", "type": "RAIN_THRESHOLD", "timestamp": "14:05", "isoTimestamp": now.isoformat()},
            ]
        return self._timeline_events[:limit]
