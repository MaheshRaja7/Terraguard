import os
import httpx
from datetime import datetime
from typing import Dict, Any, Optional
from backend.services.notifications.sms_provider import SMSProvider
from backend.services.notifications.local_sms_provider import LocalSMSProvider

MSG91_API_URL = "https://control.msg91.com/api/v5/flow/"

class MSG91Provider(SMSProvider):
    def __init__(self):
        self.auth_key = os.getenv("MSG91_AUTH_KEY")
        self.template_id = os.getenv("MSG91_TEMPLATE_ID")
        self.sender_id = os.getenv("MSG91_SENDER_ID")
        self._fallback_provider = LocalSMSProvider()

    @property
    def is_configured(self) -> bool:
        return bool(self.auth_key and self.template_id)

    async def send_sms(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        if not self.is_configured:
            print("[MSG91Provider] MSG91 credentials missing. Automatically falling back to LocalSMSProvider.")
            fallback_res = await self._fallback_provider.send_sms(phone_number, message, metadata)
            fallback_res["note"] = "Fallback from unconfigured MSG91 to Local Simulator"
            return fallback_res

        headers = {
            "authkey": self.auth_key,
            "content-type": "application/json"
        }
        payload = {
            "template_id": self.template_id,
            "sender": self.sender_id or "TERRAG",
            "short_url": "0",
            "recipients": [
                {
                    "mobiles": phone_number,
                    "VAR1": message
                }
            ]
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.post(MSG91_API_URL, json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "messageId": data.get("request_id", f"MSG91-{int(datetime.now().timestamp())}"),
                        "type": "SMS",
                        "provider": "MSG91",
                        "recipient": phone_number,
                        "message": message,
                        "status": "SENT",
                        "displayStatus": "SMS SENT — MSG91 GATEWAY",
                        "demo": False,
                        "createdAt": datetime.now().isoformat(),
                        "deliveredAt": datetime.now().isoformat()
                    }
                else:
                    print(f"[MSG91Provider] Gateway returned error {resp.status_code}: {resp.text}")
                    # Fallback gracefully rather than crashing
                    fb = await self._fallback_provider.send_sms(phone_number, message, metadata)
                    fb["note"] = f"MSG91 failed ({resp.status_code}), routed through local simulator"
                    return fb
        except Exception as e:
            print(f"[MSG91Provider] Request exception: {e}")
            fb = await self._fallback_provider.send_sms(phone_number, message, metadata)
            fb["note"] = f"MSG91 error: {e}, routed through local simulator"
            return fb
