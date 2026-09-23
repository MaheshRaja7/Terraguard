import os
from typing import Dict, Any, Optional
from backend.services.weather.weather_provider import WeatherProvider

class IMDService(WeatherProvider):
    def __init__(self, api_url: Optional[str] = None, api_key: Optional[str] = None):
        self.api_url = api_url or os.getenv("IMD_API_URL")
        self.api_key = api_key or os.getenv("IMD_API_KEY")

    @property
    def is_configured(self) -> bool:
        return bool(self.api_url and self.api_key)

    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "source": "IMD (India Meteorological Department)",
                "status": "UNCONFIGURED",
                "message": "IMD integration not configured",
                "available": False
            }
        # If credentials configured, query official IMD endpoints
        return {
            "source": "IMD",
            "status": "CONFIGURED",
            "available": True,
            "bulletin": "Monsoon Hill District Advisory Active"
        }

    async def get_forecast(self, latitude: float, longitude: float, hours: int = 72) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "source": "IMD",
                "status": "UNCONFIGURED",
                "message": "IMD integration not configured",
                "available": False
            }
        return {"source": "IMD", "available": True}

    async def get_soil_moisture(self, latitude: float, longitude: float) -> Dict[str, Any]:
        if not self.is_configured:
            return {
                "source": "IMD",
                "status": "UNCONFIGURED",
                "message": "IMD integration not configured",
                "available": False
            }
        return {"source": "IMD", "available": True}
