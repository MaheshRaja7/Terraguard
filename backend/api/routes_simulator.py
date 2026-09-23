from fastapi import APIRouter
from typing import Dict, Any
from pydantic import BaseModel, Field
from backend.ml.predict import predict_risk
from backend.ml.explain import explain_prediction
from backend.ml.risk_engine import RiskEngine
from backend.ml.feature_engineering import dict_to_features

router = APIRouter(tags=["Risk Simulator"])

class SimulationRequest(BaseModel):
    rain_1h: float = Field(20.0, description="Simulated 1h rainfall (mm)")
    rain_6h: float = Field(65.0, description="Simulated 6h rainfall (mm)")
    rain_24h: float = Field(140.0, description="Simulated 24h rainfall (mm)")
    rain_72h: float = Field(210.0, description="Simulated 72h rainfall (mm)")
    forecast_rain_24h: float = Field(50.0, description="Simulated forecast rain (mm)")
    soil_moisture_0_7: float = Field(0.48, description="Simulated modelled soil moisture (0.15 - 0.55)")
    slope: float = Field(38.0, description="Simulated terrain slope (degrees)")
    elevation: float = Field(1650.0, description="Simulated elevation (m)")
    historical_density: int = Field(12, description="Simulated historical landslide count")
    population: int = Field(22000, description="Simulated exposed population")
    road_criticality: float = Field(3.0, description="Simulated highway lifeline grade")

@router.post("/simulator/risk")
async def simulate_risk_scenario(req: SimulationRequest) -> Dict[str, Any]:
    """
    Computes purely ephemeral what-if scenario.
    GUARANTEE: Does NOT write or alter production datasets or live alerts.
    """
    data = req.model_dump()
    pred = predict_risk(data)
    feat_df = dict_to_features(data)
    expl = explain_prediction(feat_df, is_demo=True)
    
    priority = RiskEngine.calculate_emergency_priority(
        pred["risk_score"], 
        req.population, 
        req.road_criticality
    )

    return {
        "mode": "SIMULATION MODE",
        "is_ephemeral": True,
        "simulated_inputs": data,
        "risk_score": pred["risk_score"],
        "risk_level": pred["risk_level"],
        "risk_probability": pred["risk_probability"],
        "emergency_priority": priority,
        "explanation": expl,
        "scientific_note": "Values calculated dynamically via XGBoost. Real production data remains completely untouched."
    }
