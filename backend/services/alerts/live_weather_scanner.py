import os
import json
import asyncio
import numpy as np
import pandas as pd
from datetime import datetime
from typing import List, Dict, Any, Optional

from backend.services.weather.open_meteo_service import OpenMeteoService
from backend.services.alerts.alert_engine import AlertEngine
from backend.services.notifications.notification_service import NotificationService
from backend.ml.predict import predict_risk, classify_risk_tier
from backend.ml.risk_engine import RiskEngine

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

SOIL_WEATHERING_MAP = {
    "silty clay": 4.0,
    "clay": 4.0,
    "laterite": 3.5,
    "sandy loam": 3.0,
    "loam": 3.0,
    "sandy": 2.5,
    "gravelly": 4.0,
    "barren/rocky": 2.0,
    "weathered phyllite": 4.5,
    "weathered schist": 4.5
}

class LiveWeatherScanner:
    _instance: Optional["LiveWeatherScanner"] = None
    _last_scan_results: Optional[Dict[str, Any]] = None

    @classmethod
    def get_instance(cls) -> "LiveWeatherScanner":
        if cls._instance is None:
            cls._instance = LiveWeatherScanner()
        return cls._instance

    def __init__(self):
        self.weather_service = OpenMeteoService(cache_ttl_seconds=600)
        self.alert_engine = AlertEngine.get_instance()
        self.notification_service = NotificationService.get_instance()

    def get_matching_landslide_places(self) -> List[Dict[str, Any]]:
        """
        Extracts all unique monitoring locations matching the landslide datasets:
        1. 10 Authoritative NER Hazard Monitoring Corridors (ner_zones.geojson)
        2. All 50 Districts across 8 NER states from the landslide observation catalog
        3. Core historical landslide hotspot centers (historical_landslides_ner.json)
        """
        places: List[Dict[str, Any]] = []
        seen_keys = set()

        # 1. Authoritative NER Zones
        geojson_path = os.path.join(DATA_DIR, "geojson", "ner_zones.geojson")
        if os.path.exists(geojson_path):
            try:
                with open(geojson_path, "r", encoding="utf-8") as f:
                    gj = json.load(f)
                    for feat in gj.get("features", []):
                        props = feat.get("properties", {})
                        pid = props.get("id", f"ZONE-{len(places)+1}")
                        name = props.get("name", "NER Zone")
                        dist = props.get("district", "District")
                        st = props.get("state", "NER")
                        lat = float(props.get("latitude", 27.33))
                        lon = float(props.get("longitude", 88.61))
                        
                        key = f"{round(lat, 2)}_{round(lon, 2)}"
                        seen_keys.add(key)
                        
                        places.append({
                            "id": pid,
                            "name": name,
                            "district": dist,
                            "state": st,
                            "latitude": lat,
                            "longitude": lon,
                            "slope": float(props.get("slope", 35.0)),
                            "elevation": float(props.get("elevation", 1500.0)),
                            "historical_density": int(props.get("historical_landslides", 30)),
                            "dist_to_road_m": 45.0,
                            "geology_weathering": 4.5,
                            "population": int(props.get("population_at_risk", 18000)),
                            "road_criticality": 3.0,
                            "source": "AUTHORITATIVE_NER_ZONES",
                            "road_name": props.get("road_exposure", "Lifeline Highway Corridor")
                        })
            except Exception as e:
                print(f"[LiveWeatherScanner] Error loading ner_zones: {e}")

        # 2. District Locations from Landslide Catalog
        raw_csv = os.path.join(DATA_DIR, "raw", "landslide_dataset_raw.csv")
        if not os.path.exists(raw_csv):
            raw_csv = os.path.join(DATA_DIR, "processed", "full_clean_dataset.csv")

        if os.path.exists(raw_csv):
            try:
                df = pd.read_csv(raw_csv)
                grouped = df.groupby(["state", "district"])
                for (state, district), grp in grouped:
                    lat = float(grp["latitude"].median())
                    lon = float(grp["longitude"].median())
                    key = f"{round(lat, 2)}_{round(lon, 2)}"
                    if key in seen_keys:
                        continue
                    seen_keys.add(key)

                    slope = float(grp["slope_deg"].median()) if "slope_deg" in grp else 25.0
                    elev = float(grp["elevation_m"].median()) if "elevation_m" in grp else 1200.0
                    dist_road = float(grp["distance_to_road_m"].median()) if "distance_to_road_m" in grp else 120.0
                    hist_count = int(grp["historical_landslide_count_5km"].max()) if "historical_landslide_count_5km" in grp else 3
                    
                    # Determine soil weathering
                    mode_soil = str(grp["soil_type"].mode()[0]).lower() if "soil_type" in grp and not grp["soil_type"].empty else "sandy loam"
                    weathering = SOIL_WEATHERING_MAP.get(mode_soil, 3.2)

                    places.append({
                        "id": f"DIST-{len(places)+1:03d}",
                        "name": f"{district} Vulnerability Sector",
                        "district": district,
                        "state": state,
                        "latitude": round(lat, 4),
                        "longitude": round(lon, 4),
                        "slope": round(slope, 1),
                        "elevation": round(elev, 1),
                        "historical_density": hist_count,
                        "dist_to_road_m": round(dist_road, 1),
                        "geology_weathering": weathering,
                        "population": 25000 if dist_road < 100 else 12000,
                        "road_criticality": 3.0 if dist_road < 80 else (2.0 if dist_road < 300 else 1.0),
                        "source": "LANDSLIDE_CATALOG_DISTRICTS",
                        "road_name": f"{state} Arterial Route"
                    })
            except Exception as e:
                print(f"[LiveWeatherScanner] Error aggregating districts: {e}")

        # 3. Core historical landslide hotspots
        hist_json = os.path.join(DATA_DIR, "isro", "historical_landslides_ner.json")
        if os.path.exists(hist_json):
            try:
                with open(hist_json, "r", encoding="utf-8") as f:
                    slides = json.load(f)
                    for s in slides[:25]: # Pick top representative slide points
                        lat = float(s.get("latitude", 0))
                        lon = float(s.get("longitude", 0))
                        key = f"{round(lat, 2)}_{round(lon, 2)}"
                        if key in seen_keys or lat == 0 or lon == 0:
                            continue
                        seen_keys.add(key)
                        
                        dist = s.get("state") or "NER"
                        places.append({
                            "id": f"HIST-{s.get('event_id', len(places)+1)}",
                            "name": s.get("title") or s.get("location_description") or "Historical Slide Point",
                            "district": dist,
                            "state": s.get("state") or "NER",
                            "latitude": round(lat, 4),
                            "longitude": round(lon, 4),
                            "slope": 36.0,
                            "elevation": 1450.0,
                            "historical_density": 8,
                            "dist_to_road_m": 35.0,
                            "geology_weathering": 4.5,
                            "population": 16000,
                            "road_criticality": 3.0,
                            "source": "ISRO_HISTORICAL_SLIDES",
                            "road_name": "State Highway / Lifeline Link"
                        })
            except Exception as e:
                print(f"[LiveWeatherScanner] Error loading historical slides: {e}")

        return places

    async def scan_all_places_and_alert(
        self,
        places_limit: Optional[int] = None,
        notify_sms: bool = True,
        force_dispatch: bool = False,
        elevated_threshold: float = 45.0
    ) -> Dict[str, Any]:
        """
        Executes end-to-end evaluation:
        1. Queries real-time weather & modelled soil moisture from Open-Meteo for all places
        2. Merges terrain geomorphology with live weather
        3. Predicts operational landslide risk using TG-XGB-2.0-NER-UNIFIED model
        4. Triggers multi-tier alert messages for matching places with elevated/critical risk
        """
        all_places = self.get_matching_landslide_places()
        if places_limit and places_limit > 0:
            target_places = all_places[:places_limit]
        else:
            target_places = all_places

        print(f"[LiveWeatherScanner] Commencing live scan across {len(target_places)} landslide places...")
        sem = asyncio.Semaphore(6)

        async def fetch_place_weather(p: Dict[str, Any]) -> Dict[str, Any]:
            async with sem:
                try:
                    w = await self.weather_service._fetch_data(p["latitude"], p["longitude"])
                    return {"place": p, "weather": w, "error": None}
                except Exception as e:
                    return {"place": p, "weather": {}, "error": str(e)}

        weather_tasks = [fetch_place_weather(p) for p in target_places]
        weather_results = await asyncio.gather(*weather_tasks)

        evaluations: List[Dict[str, Any]] = []
        dispatched_alerts: List[Dict[str, Any]] = []
        now = datetime.now()

        for res in weather_results:
            p = res["place"]
            w = res["weather"]
            
            # Extract real-time weather triggers
            rain_1h = float(w.get("rain_1h", 0.0))
            rain_6h = float(w.get("rain_6h", 0.0))
            rain_24h = float(w.get("rain_24h", 0.0))
            rain_72h = float(w.get("rain_72h", 0.0))
            forecast_rain_24h = float(w.get("forecast_rain_24h", 0.0))
            soil_moisture_0_7 = float(w.get("soil_moisture_0_7", 0.28))
            soil_moisture_7_28 = float(w.get("soil_moisture_7_28", 0.26))
            soil_moisture_28_100 = float(w.get("soil_moisture_28_100", 0.24))
            humidity = float(w.get("humidity", 75.0))
            temperature = float(w.get("temperature", 22.0))

            merged_features = {
                "slope": p["slope"],
                "elevation": p["elevation"],
                "historical_density": p["historical_density"],
                "dist_to_road_m": p["dist_to_road_m"],
                "geology_weathering": p["geology_weathering"],
                "rain_1h": rain_1h,
                "rain_6h": rain_6h,
                "rain_24h": rain_24h,
                "rain_72h": rain_72h,
                "forecast_rain_24h": forecast_rain_24h,
                "soil_moisture_0_7": soil_moisture_0_7,
                "soil_moisture_7_28": soil_moisture_7_28,
                "soil_moisture_28_100": soil_moisture_28_100,
                "humidity": humidity,
                "temperature": temperature,
                "population": p["population"],
                "road_criticality": p["road_criticality"]
            }

            # Predict risk using TG-XGB-2.0 model
            pred = predict_risk(merged_features)
            risk_score = pred["risk_score"]
            risk_level = pred["risk_level"]

            # Emergency Priority Calculation
            priority = RiskEngine.calculate_emergency_priority(
                risk_score=risk_score,
                population=p["population"],
                road_criticality=p["road_criticality"],
                critical_infra_count=2
            )

            is_elevated = (
                risk_score >= elevated_threshold or 
                risk_level in ["HIGH", "CRITICAL"] or 
                rain_24h >= 40.0 or 
                soil_moisture_0_7 >= 0.40
            )

            eval_item = {
                "place_id": p["id"],
                "name": p["name"],
                "district": p["district"],
                "state": p["state"],
                "latitude": p["latitude"],
                "longitude": p["longitude"],
                "real_time_weather": {
                    "temperature": temperature,
                    "humidity": humidity,
                    "rain_1h": rain_1h,
                    "rain_6h": rain_6h,
                    "rain_24h": rain_24h,
                    "rain_72h": rain_72h,
                    "forecast_rain_24h": forecast_rain_24h,
                    "soil_moisture_0_7": soil_moisture_0_7,
                    "soil_status": w.get("soil_status", "NORMAL"),
                    "data_freshness": "LIVE OPEN-METEO"
                },
                "predicted_risk": {
                    "score": risk_score,
                    "level": risk_level,
                    "confidence": pred["confidence"],
                    "priority_tier": priority["priority_tier"],
                    "priority_label": priority["priority_label"]
                },
                "is_elevated": is_elevated,
                "source": p["source"]
            }
            evaluations.append(eval_item)

            # Alert Message Generation & Dispatch
            if is_elevated or force_dispatch:
                alert_severity = "CRITICAL" if risk_score >= 70.0 or rain_24h >= 80.0 else "HIGH"
                
                # Format multi-tier alert messages
                msg_body = (
                    f"TERRAGUARD AI EARLY WARNING: {alert_severity} LANDSLIDE RISK\n"
                    f"Place: {p['name']} ({p['district']}, {p['state']})\n"
                    f"Predicted Risk Score: {risk_score}/100 [{priority['priority_label']}]\n"
                    f"Real-Time Weather Triggers: 24h Rain: {rain_24h}mm, Soil Saturation: {soil_moisture_0_7} m³/m³\n"
                    f"Corridor: {p.get('road_name', 'Lifeline Highway')}\n"
                    f"Advisory: Evacuate vulnerable slopes. Alert DEOC / QRT. Restrict traffic on slope corridors."
                )

                # 1. Register in AlertEngine
                sim_eval = {
                    "zone_id": p["id"],
                    "zone_name": p["name"],
                    "district": p["district"],
                    "state": p["state"],
                    "risk_score": risk_score,
                    "risk_level": alert_severity,
                    "priority": priority,
                    "layers": {
                        "trigger": {"rain_24h": rain_24h, "soil_moisture_0_7": soil_moisture_0_7}
                    }
                }
                alert_doc = self.alert_engine.process_zone_assessment(sim_eval, notify_sms=False)

                # 2. Dispatch SMS and Multi-Tier Notification
                if notify_sms:
                    # Send SMS to duty officer & disaster control room
                    recipients = ["+919876543210", "+919436000001"]
                    for rec in recipients:
                        try:
                            await self.notification_service.send_notification(
                                phone_number=rec,
                                message=msg_body,
                                metadata={
                                    "zoneId": p["id"],
                                    "placeName": p["name"],
                                    "district": p["district"],
                                    "riskScore": risk_score,
                                    "severity": alert_severity,
                                    "audienceTier": "DISTRICT_ADMIN",
                                    "channel": "SMS"
                                }
                            )
                        except Exception as ne:
                            print(f"[LiveWeatherScanner] SMS send error for {rec}: {ne}")

                    # Multi-tier broadcast
                    try:
                        await self.notification_service.broadcast_multi_tier(
                            zone_info={
                                "zone_id": p["id"],
                                "zone_name": p["name"],
                                "district": p["district"],
                                "state": p["state"],
                                "risk_score": risk_score,
                                "severity": alert_severity,
                                "rain_24h": rain_24h,
                                "soil_moisture": soil_moisture_0_7,
                                "road_name": p.get("road_name", "Highway Sector")
                            }
                        )
                    except Exception as be:
                        print(f"[LiveWeatherScanner] Broadcast error for {p['id']}: {be}")

                dispatched_alerts.append({
                    "alert_id": alert_doc["id"] if alert_doc else f"ALT-LIVE-{p['id']}",
                    "place_id": p["id"],
                    "place_name": p["name"],
                    "district": p["district"],
                    "state": p["state"],
                    "risk_score": risk_score,
                    "severity": alert_severity,
                    "priority": priority["priority_label"],
                    "rain_24h": rain_24h,
                    "soil_moisture": soil_moisture_0_7,
                    "message": msg_body,
                    "timestamp": now.isoformat(),
                    "status": "SENT"
                })

        # Sort evaluations by risk score descending
        evaluations.sort(key=lambda x: x["predicted_risk"]["score"], reverse=True)

        scan_summary = {
            "timestamp": now.isoformat(),
            "total_places_scanned": len(evaluations),
            "elevated_places_count": len([e for e in evaluations if e["is_elevated"]]),
            "alerts_dispatched_count": len(dispatched_alerts),
            "evaluations": evaluations,
            "dispatched_alerts": dispatched_alerts,
            "model_version": "TG-XGB-2.0-NER-UNIFIED",
            "weather_provider": "Open-Meteo API (Live Real-Time Weather & Modelled Soil Moisture)"
        }

        self._last_scan_results = scan_summary
        return scan_summary

    def get_last_scan_results(self) -> Optional[Dict[str, Any]]:
        return self._last_scan_results
