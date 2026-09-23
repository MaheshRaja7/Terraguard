import pytest
from backend.services.alerts.alert_engine import AlertEngine

def test_alert_generation_and_deduplication():
    engine = AlertEngine()
    
    zone_eval_critical = {
        "zone_id": "TG-T1",
        "zone_name": "Test Corridor",
        "district": "East Sikkim",
        "state": "Sikkim",
        "risk_score": 85.0,
        "risk_level": "CRITICAL",
        "priority": {"priority_tier": "P1"},
        "layers": {"trigger": {"rain_24h": 100.0}}
    }
    
    # 1. First critical assessment triggers alert
    alert1 = engine.process_zone_assessment(zone_eval_critical, notify_sms=False)
    assert alert1 is not None
    assert alert1["severity"] == "CRITICAL"
    assert alert1["status"] == "ACTIVE"

    # 2. Repeated assessment with same severity suppresses duplicate alert
    alert2 = engine.process_zone_assessment(zone_eval_critical, notify_sms=False)
    assert alert2 is None

    # 3. Test acknowledgement workflow
    ack = engine.acknowledge_alert(alert1["id"], "Inspector Kumar")
    assert ack is not None
    assert ack["status"] == "ACKNOWLEDGED"
    assert ack["acknowledgedBy"] == "Inspector Kumar"
