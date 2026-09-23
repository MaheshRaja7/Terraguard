from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class SMSProvider(ABC):
    """Abstract Base Class for SMS Gateways."""

    @abstractmethod
    async def send_sms(
        self,
        phone_number: str,
        message: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Dispatches an SMS message and returns dispatch result with delivery status."""
        pass
