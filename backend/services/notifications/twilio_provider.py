import os
from datetime import datetime
from typing import Any, Dict, Optional

from twilio.rest import Client

from backend.services.notifications.local_sms_provider import LocalSMSProvider
from backend.services.notifications.sms_provider import SMSProvider


class TwilioProvider(SMSProvider):
    def __init__(self):
        self.account_sid = os.getenv("TWILIO_ACCOUNT_SID")
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN")
        self.from_number = os.getenv("TWILIO_PHONE_NUMBER")
        self._fallback_provider = LocalSMSProvider()

    @property
    def is_configured(self) -> bool:
        return bool(self.account_sid and self.auth_token and self.from_number)

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        if not self.is_configured:
            print("[TwilioProvider] Twilio credentials missing. Automatically falling back to LocalSMSProvider.")
            fallback_res = await self._fallback_provider.send_sms(phone_number, message, metadata)
            fallback_res["note"] = "Fallback from unconfigured Twilio to Local Simulator"
            return fallback_res

        try:
            client = Client(self.account_sid, self.auth_token)
            resp = client.messages.create(
                body=message,
                from_=self.from_number,
                to=phone_number,
            )

            return {
                "messageId": resp.sid,
                "type": "SMS",
                "provider": "TWILIO",
                "recipient": phone_number,
                "message": message,
                "status": "SENT",
                "displayStatus": "SMS SENT — TWILIO GATEWAY",
                "demo": False,
                "createdAt": datetime.now().isoformat(),
                "deliveredAt": datetime.now().isoformat(),
                "twilio_status": getattr(resp, "status", "queued"),
            }
        except Exception as e:
            print(f"[TwilioProvider] Request exception: {e}")
            fb = await self._fallback_provider.send_sms(phone_number, message, metadata)
            fb["note"] = f"Twilio error: {e}, routed through local simulator"
            return fb
