import os
import sys
import asyncio
from datetime import datetime

# Add project root to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.services.alerts.live_weather_scanner import LiveWeatherScanner
from backend.services.notifications.notification_service import NotificationService
from backend.services.alerts.alert_engine import AlertEngine

async def main():
    print("==========================================================================")
    print("    TERRAGUARD AI — REAL-TIME WEATHER & LANDSLIDE ALERT DISPATCH ENGINE    ")
    print("==========================================================================")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("Fetching matching locations from Landslide Datasets (NER Zones, Catalog & ISRO)...")

    scanner = LiveWeatherScanner.get_instance()
    places = scanner.get_matching_landslide_places()
    print(f"Total matching landslide places found: {len(places)}")

    print("\nConnecting to Open-Meteo live weather API to retrieve real-time rainfall & modelled soil moisture...")
    # Scan matching places (e.g. top 25 key hazard places or all places)
    results = await scanner.scan_all_places_and_alert(places_limit=25, notify_sms=True, force_dispatch=False)

    print(f"\n--- SCAN RESULTS SUMMARY ---")
    print(f"Total Places Evaluated:     {results['total_places_scanned']}")
    print(f"Elevated / Critical Places: {results['elevated_places_count']}")
    print(f"Alert Messages Dispatched:  {results['alerts_dispatched_count']}")

    print("\n--- TOP 10 HIGHEST RISK PLACES BASED ON LIVE WEATHER ---")
    print(f"{'Place Name':<35} | {'District':<18} | {'24h Rain':<10} | {'Soil Moisture':<14} | {'Risk':<10} | {'Tier'}")
    print("-" * 105)
    for ev in results["evaluations"][:10]:
        w = ev["real_time_weather"]
        r = ev["predicted_risk"]
        rain_str = f"{w['rain_24h']:.1f} mm"
        soil_str = f"{w['soil_moisture_0_7']:.3f} m³/m³"
        risk_str = f"{r['score']}/100"
        print(f"{ev['name'][:35]:<35} | {ev['district'][:18]:<18} | {rain_str:<10} | {soil_str:<14} | {risk_str:<10} | {r['priority_tier']}")

    if results["dispatched_alerts"]:
        print("\n--- DISPATCHED ALERT MESSAGES ---")
        for i, a in enumerate(results["dispatched_alerts"][:5], 1):
            print(f"\n[ALERT {i}] Place: {a['place_name']} ({a['district']}, {a['state']})")
            print(f"Severity: {a['severity']} | Risk Score: {a['risk_score']} | 24h Rain: {a['rain_24h']}mm | Soil Saturation: {a['soil_moisture']}")
            print(f"Message Dispatched:\n{a['message']}")
            print("-" * 60)

    # Print SMS delivery summary
    notif_svc = NotificationService.get_instance()
    sms_history = notif_svc.get_history()
    print(f"\nNotification History Count: {len(sms_history)} records logged.")
    print("==========================================================================")

if __name__ == "__main__":
    asyncio.run(main())
