from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class WeatherProvider(ABC):
    """Abstract Base Class for meteorological and environmental data providers."""

    @abstractmethod
    async def get_current_weather(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch current weather observations."""
        pass

    @abstractmethod
    async def get_forecast(self, latitude: float, longitude: float, hours: int = 72) -> Dict[str, Any]:
        """Fetch hourly weather forecast."""
        pass

    @abstractmethod
    async def get_soil_moisture(self, latitude: float, longitude: float) -> Dict[str, Any]:
        """Fetch multi-depth modelled soil moisture."""
        pass
