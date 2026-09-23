import io

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.services.gis.gis_service import GISService
from backend.ml.risk_engine import RiskEngine

client = TestClient(app)

def test_health_endpoint():
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "HEALTHY"
    assert "TERRAGUARD" in data["system"]

def test_dashboard_endpoint():
    resp = client.get("/api/dashboard")
    assert resp.status_code == 200
    data = resp.json()
    assert "metrics" in data
    assert data["metrics"]["monitored_zones"] == 1284

    gis = GISService.get_instance()
    zone = next(
        feature for feature in gis.get_zones_geojson()["features"]
        if (feature.get("id") == "TG-018" or feature.get("properties", {}).get("id") == "TG-018")
    )
    expected = RiskEngine.evaluate_zone_risk(zone.get("properties", {}), weather_data={}, is_demo=False)
    top_item = data["priority_queue"][0]
    assert top_item["zoneId"] == "TG-018"
    assert top_item["risk"] == round(expected["risk_score"], 1)
    assert top_item["tier"] == expected["priority"]["priority_tier"]


def test_zones_endpoint():
    resp = client.get("/api/zones")
    assert resp.status_code == 200
    data = resp.json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) > 0

def test_roads_endpoint():
    resp = client.get("/api/roads")
    assert resp.status_code == 200
    roads = resp.json()
    assert isinstance(roads, list)
    assert any(r["id"] == "RD-NH10" for r in roads)

def test_test_sms_endpoint():
    resp = client.post("/api/notifications/test-sms", json={
        "phoneNumber": "+919999999999",
        "message": "TERRAGUARD test alert"
    })
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["provider"] == "LOCAL_SIMULATOR"
    assert data["status"] == "DELIVERED"
    assert data["demo"] is True

def test_test_critical_alert_endpoint():
    resp = client.post("/api/alerts/test-critical")
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["alert"]["severity"] == "CRITICAL"


def test_incident_upload_endpoint_accepts_media():
    png_bytes = (
        b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc```\x00\x00\x00\x02\x00\x01\xe5\x27\xd8\xcf\x00\x00\x00\x00IEND\xaeB`\x82"
    )
    resp = client.post(
        "/api/incidents/upload",
        data={
            "type": "CRACK",
            "severity": "HIGH",
            "latitude": "27.3314",
            "longitude": "88.6138",
            "district": "East Sikkim",
            "state": "Sikkim",
            "description": "Visible crack near roadside retaining wall",
            "road_blocked": "true",
            "reporter_name": "Field Officer",
        },
        files={"files": ("crack.png", io.BytesIO(png_bytes), "image/png")},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert data["success"] is True
    assert data["incident"]["photo_url"]
    assert data["incident"]["media_urls"]
