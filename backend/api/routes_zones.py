from fastapi import APIRouter, HTTPException, Query
from typing import Dict, Any, List, Optional
from backend.services.gis.gis_service import GISService
from backend.services.weather.weather_service import WeatherService
from backend.ml.risk_engine import RiskEngine
from backend.app.config import settings

router = APIRouter(tags=["Zones & GIS"])


async def _attach_live_risk(feature: Dict[str, Any]) -> Dict[str, Any]:
    properties = feature.get("properties", {})
    lat = properties.get("latitude")
    lon = properties.get("longitude")

    if lat is not None and lon is not None:
        weather_res = await WeatherService().get_zone_weather(float(lat), float(lon))
        weather_data = weather_res.get("weather", {})
        assessment = RiskEngine.evaluate_zone_risk(
            zone_data=properties,
            weather_data=weather_data,
            is_demo=settings.DEMO_MODE,
        )
        properties["risk_score"] = round(assessment["risk_score"], 1)
        properties["risk_level"] = assessment["risk_level"]
        properties["live_weather"] = weather_data
        feature["properties"] = properties

    return feature


@router.get("/zones")
async def get_all_zones(state: Optional[str] = None, district: Optional[str] = None) -> Dict[str, Any]:
    gis = GISService.get_instance()
    geojson = gis.get_zones_geojson()
    features = geojson.get("features", [])

    if state or district:
        filtered_features = []
        for feat in features:
            props = feat.get("properties", {})
            if state and state.lower() not in props.get("state", "").lower():
                continue
            if district and district.lower() not in props.get("district", "").lower():
                continue
            filtered_features.append(feat)
        features = filtered_features

    enriched = [await _attach_live_risk(feature) for feature in features]
    return {"type": "FeatureCollection", "features": enriched}


@router.get("/zones/{zone_id}")
async def get_zone_by_id(zone_id: str) -> Dict[str, Any]:
    gis = GISService.get_instance()
    geojson = gis.get_zones_geojson()
    for feat in geojson.get("features", []):
        if feat.get("id") == zone_id or feat.get("properties", {}).get("id") == zone_id:
            return await _attach_live_risk(feat)
    raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")


@router.get("/landslides/historical")
async def get_historical_landslides(limit: int = Query(100, ge=1, le=500)) -> List[Dict[str, Any]]:
    gis = GISService.get_instance()
    slides = gis.get_historical_landslides()
    return slides[:limit]
