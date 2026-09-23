from fastapi import APIRouter, Query
from typing import Dict, Any
from backend.services.weather.weather_service import WeatherService

router = APIRouter(tags=["Weather & Soil Moisture"])
weather_service = WeatherService()

@router.get("/weather")
async def get_weather(
    lat: float = Query(27.3314, description="Latitude (default East Sikkim)"),
    lon: float = Query(88.6138, description="Longitude")
) -> Dict[str, Any]:
    return await weather_service.get_zone_weather(lat, lon)

@router.get("/weather/forecast")
async def get_weather_forecast(
    lat: float = Query(27.3314),
    lon: float = Query(88.6138)
) -> Dict[str, Any]:
    return await weather_service.open_meteo.get_forecast(lat, lon)

@router.get("/weather/soil-moisture")
async def get_soil_moisture(
    lat: float = Query(27.3314),
    lon: float = Query(88.6138)
) -> Dict[str, Any]:
    return await weather_service.open_meteo.get_soil_moisture(lat, lon)
