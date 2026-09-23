import os
from typing import Dict, Any, Optional
from datetime import datetime
from backend.services.weather.open_meteo_service import OpenMeteoService
from backend.services.weather.imd_service import IMDService

class WeatherService:
    def __init__(self):
        self.open_meteo = OpenMeteoService(cache_ttl_seconds=600)
        self.imd = IMDService()

    async def get_zone_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Unified weather fetcher with provider transparency and data freshness assessment."""
        om_data = await self.open_meteo.get_current_weather(latitude, longitude)
        imd_status = await self.imd.get_current_weather(latitude, longitude)

        # Evaluate freshness tag
        age = om_data.get("data_age_seconds", 0)
        if age < 180 and not om_data.get("is_stale", False):
            freshness = "LIVE"
        elif age < 900:
            freshness = f"UPDATED {age // 60} MIN AGO"
        else:
            freshness = "STALE"

        return {
            "weather": om_data,
            "soil_moisture": {
                "label": "Modelled Soil Moisture",
                "source": "Open-Meteo",
                "is_modelled": True,
                "note": "Atmospheric hydrological simulation, not a physical hardware sensor.",
                "depths": [
                    {"depth": "0–7 cm (Surface)", "moisture": om_data.get("soil_moisture_0_7"), "unit": "m³/m³", "status": "SATURATING" if om_data.get("soil_moisture_0_7", 0) > 0.38 else "NORMAL"},
                    {"depth": "7–28 cm (Root zone)", "moisture": om_data.get("soil_moisture_7_28"), "unit": "m³/m³", "status": "ELEVATED" if om_data.get("soil_moisture_7_28", 0) > 0.35 else "NORMAL"},
                    {"depth": "28–100 cm (Subsoil)", "moisture": om_data.get("soil_moisture_28_100"), "unit": "m³/m³", "status": "STABLE"}
                ],
                "six_hours_ago": om_data.get("soil_moisture_6h_ago"),
                "twenty_four_hours_ago": om_data.get("soil_moisture_24h_ago"),
                "trend": om_data.get("soil_trend"),
                "status": om_data.get("soil_status")
            },
            "imd_provider": imd_status,
            "data_freshness": freshness,
            "source_transparency": {
                "weather_source": "Open-Meteo API",
                "soil_source": "Open-Meteo Modelled Data",
                "official_warnings": imd_status.get("message") if not imd_status.get("available") else "IMD Bulletin Active"
            }
        }
