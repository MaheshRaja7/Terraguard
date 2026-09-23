import os
import asyncio
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
from backend.services.notifications.sms_provider import SMSProvider

class LocalSMSProvider(SMSProvider):
    """
    High-fidelity Local SMS Simulator:
    - Generates unique ID: SMS-TG-XXXXX
    - Transitions through QUEUED -> PROCESSING -> SENT -> DELIVERED
    - Configurable simulated latency (SMS_SIMULATION_DELAY_MS)
    - Zero cost, runs 100% locally without external gateway dependencies
    - Clear UI indicator: 'SMS DELIVERED — LOCAL DEMO'
    """
    _counter = 0

    def __init__(self, delay_ms: int = 400):
        self.delay_ms = int(os.getenv("SMS_SIMULATION_DELAY_MS", str(delay_ms)))

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        LocalSMSProvider._counter += 1
        msg_id = f"SMS-TG-{LocalSMSProvider._counter:05d}"
        now = datetime.now()

        meta = metadata or {}
        doc = {
            "messageId": msg_id,
            "type": "SMS",
            "provider": "LOCAL_SIMULATOR",
            "recipient": phone_number,
            "message": message,
            "zoneId": meta.get("zoneId", "TG-GENERAL"),
            "riskScore": meta.get("riskScore", 0),
            "severity": meta.get("severity", "CRITICAL"),
            "status": "QUEUED",
            "demo": True,
            "displayStatus": "SMS DELIVERED — LOCAL DEMO",
            "createdAt": now.isoformat(),
            "queuedAt": now.isoformat(),
            "sentAt": None,
            "deliveredAt": None
        }

        # Simulate asynchronous processing delay
        delay_sec = max(0.1, self.delay_ms / 1000.0)
        await asyncio.sleep(delay_sec * 0.4)
        doc["status"] = "PROCESSING"
        
        await asyncio.sleep(delay_sec * 0.3)
        doc["status"] = "SENT"
        doc["sentAt"] = datetime.now().isoformat()

        await asyncio.sleep(delay_sec * 0.3)
        doc["status"] = "DELIVERED"
        doc["deliveredAt"] = datetime.now().isoformat()

        return doc
