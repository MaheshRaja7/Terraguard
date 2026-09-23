import pytest
import asyncio
from backend.services.notifications.local_sms_provider import LocalSMSProvider

@pytest.mark.asyncio
async def test_local_sms_lifecycle():
    provider = LocalSMSProvider(delay_ms=10) # Fast execution for unit tests
    res = await provider.send_sms(
        phone_number="+919876543210",
        message="TERRAGUARD CRITICAL TEST ALERT",
        metadata={"zoneId": "TG-018", "riskScore": 87, "severity": "CRITICAL"}
    )

    assert res["status"] == "DELIVERED"
    assert res["provider"] == "LOCAL_SIMULATOR"
    assert res["demo"] is True
    assert "SMS-TG-" in res["messageId"]
    assert res["deliveredAt"] is not None
    assert "SMS DELIVERED — LOCAL DEMO" in res["displayStatus"]

@pytest.mark.asyncio
async def test_multi_tier_alert_templates():
    from backend.services.alerts.alert_templates import generate_multi_tier_alert_messages
    res = generate_multi_tier_alert_messages(
        zone_id="TG-018",
        district="East Sikkim",
        risk_score=87.0,
        severity="CRITICAL"
    )
    assert "tiers" in res
    assert "DISTRICT_ADMIN" in res["tiers"]
    assert "DISASTER_AUTHORITIES" in res["tiers"]
    assert "COMMUNITY" in res["tiers"]
    
    # Verify content suitability
    assert "DEOC" in res["tiers"]["DISTRICT_ADMIN"]["message"]
    assert "NDRF" in res["tiers"]["DISASTER_AUTHORITIES"]["message"]
    assert "आपदा चेतावनी" in res["tiers"]["COMMUNITY"]["message"]

@pytest.mark.asyncio
async def test_twilio_provider_selection(monkeypatch):
    monkeypatch.setenv("SMS_PROVIDER", "twilio")
    monkeypatch.setenv("TWILIO_ACCOUNT_SID", "AC123456")
    monkeypatch.setenv("TWILIO_AUTH_TOKEN", "test-token")
    monkeypatch.setenv("TWILIO_PHONE_NUMBER", "+15551234567")

    from backend.services.notifications.notification_service import NotificationService
    NotificationService._instance = None
    svc = NotificationService()

    assert svc.provider_name == "TWILIO"
    assert svc.provider.__class__.__name__ == "TwilioProvider"

@pytest.mark.asyncio
async def test_multi_tier_broadcast():
    from backend.services.notifications.notification_service import NotificationService
    svc = NotificationService.get_instance()
    res = await svc.broadcast_multi_tier()
    assert res["success"] is True
    assert res["totalRecipients"] >= 6
    assert len(res["smsResults"]) >= 6
    assert "broadcastId" in res
    assert res["appBroadcast"]["active"] is True
