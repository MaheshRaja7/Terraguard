from fastapi import APIRouter, HTTPException, Body
from typing import Dict, Any, Optional
from pydantic import BaseModel, Field
from backend.services.gis.gis_service import GISService
from backend.services.weather.weather_service import WeatherService
from backend.ml.risk_engine import RiskEngine
from backend.ml.predict import predict_risk
from backend.ml.explain import explain_prediction
from backend.ml.feature_engineering import dict_to_features
from backend.app.config import settings

router = APIRouter(tags=["AI Risk Engine"])
weather_service = WeatherService()

class PredictRiskRequest(BaseModel):
    latitude: Optional[float] = 27.33
    longitude: Optional[float] = 88.61
    slope: float = Field(35.0, description="Slope in degrees")
    elevation: float = Field(1500.0, description="Elevation in meters")
    rain_1h: float = Field(5.0, description="1h rainfall in mm")
    rain_6h: float = Field(25.0, description="6h rainfall in mm")
    rain_24h: float = Field(75.0, description="24h rainfall in mm")
    rain_72h: float = Field(120.0, description="72h rainfall in mm")
    forecast_rain_24h: float = Field(40.0, description="Forecast rain in mm")
    soil_moisture_0_7: float = Field(0.38, description="Modelled soil moisture 0-7cm m3/m3")
    soil_moisture_7_28: float = Field(0.35, description="Modelled soil moisture 7-28cm")
    soil_moisture_28_100: float = Field(0.30, description="Modelled soil moisture 28-100cm")
    historical_density: int = Field(5, description="Count of historical landslides")
    population: int = Field(12000, description="Exposed population")
    road_criticality: float = Field(2.5, description="Road criticality factor (1-3)")

@router.get("/risk/{zone_id}")
async def get_zone_risk(zone_id: str) -> Dict[str, Any]:
    gis = GISService.get_instance()
    geojson = gis.get_zones_geojson()
    
    zone_props = None
    for feat in geojson.get("features", []):
        if feat.get("id") == zone_id or feat.get("properties", {}).get("id") == zone_id:
            zone_props = feat.get("properties")
            break

    if not zone_props:
        raise HTTPException(status_code=404, detail=f"Zone {zone_id} not found")

    lat = zone_props.get("latitude", 27.33)
    lon = zone_props.get("longitude", 88.61)

    # Fetch live weather & modelled soil moisture
    weather_res = await weather_service.get_zone_weather(lat, lon)
    weather_data = weather_res.get("weather", {})

    # Evaluate three-layer operational risk
    eval_result = RiskEngine.evaluate_zone_risk(
        zone_data=zone_props,
        weather_data=weather_data,
        is_demo=settings.DEMO_MODE
    )

    return eval_result

@router.post("/risk/predict")
async def custom_predict_risk(req: PredictRiskRequest) -> Dict[str, Any]:
    """
    Computes AI Risk for arbitrary locations (including areas without historical records).
    Never fabricates historical landslides. Transparently reports confidence & completeness.
    """
    data = req.model_dump()
    has_history = req.historical_density > 0
    
    pred = predict_risk(data)
    feat_df = dict_to_features(data)
    expl = explain_prediction(feat_df, is_demo=False)
    
    priority = RiskEngine.calculate_emergency_priority(
        pred["risk_score"], 
        req.population, 
        req.road_criticality
    )

    return {
        "location": {"latitude": req.latitude, "longitude": req.longitude},
        "risk_score": pred["risk_score"],
        "risk_level": pred["risk_level"],
        "confidence": pred["confidence"],
        "data_completeness": pred["data_completeness"],
        "historical_coverage": "COMPREHENSIVE" if has_history else "HISTORICAL INVENTORY COVERAGE: LIMITED",
        "emergency_priority": priority,
        "explanation": expl,
        "sources": {
            "terrain": "User / DEM parameters",
            "weather": "Modelled / Forecast trigger inputs",
            "historical": "ISRO / NRSC Landslide Inventory" if has_history else "None recorded (Pure physics & geomorphic inference)"
        }
    }
