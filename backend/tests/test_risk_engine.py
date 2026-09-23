import pytest
from backend.ml.risk_engine import RiskEngine
from backend.ml.predict import classify_risk_tier

def test_risk_threshold_classification():
    assert classify_risk_tier(15.0) == "LOW"
    assert classify_risk_tier(25.0) == "LOW"
    assert classify_risk_tier(26.0) == "MODERATE"
    assert classify_risk_tier(50.0) == "MODERATE"
    assert classify_risk_tier(51.0) == "HIGH"
    assert classify_risk_tier(75.0) == "HIGH"
    assert classify_risk_tier(76.0) == "CRITICAL"
    assert classify_risk_tier(95.0) == "CRITICAL"

def test_emergency_priority_calculation():
    # Critical risk + high exposure -> P1
    p1 = RiskEngine.calculate_emergency_priority(risk_score=88.0, population=30000, road_criticality=3.0)
    assert p1["priority_tier"] == "P1"
    assert "P1" in p1["priority_label"]

    # Low risk + low exposure -> P3
    p3 = RiskEngine.calculate_emergency_priority(risk_score=25.0, population=2000, road_criticality=1.0)
    assert p3["priority_tier"] == "P3"

def test_zone_assessment_evaluation():
    zone = {
        "id": "TG-TEST",
        "name": "Test Sector",
        "district": "East Sikkim",
        "state": "Sikkim",
        "slope": 40.0,
        "elevation": 1800.0,
        "historical_landslides": 25,
        "population_at_risk": 15000,
        "road_exposure": "NH-10"
    }
    weather = {
        "rain_24h": 115.0,
        "rain_6h": 40.0,
        "soil_moisture_0_7": 0.45
    }
    res = RiskEngine.evaluate_zone_risk(zone, weather)
    assert "risk_score" in res
    assert 0.0 <= res["risk_score"] <= 100.0
    assert res["risk_level"] in ["LOW", "MODERATE", "HIGH", "CRITICAL"]
    assert "explanation" in res
    assert "factors" in res["explanation"]
    assert "trend" in res
