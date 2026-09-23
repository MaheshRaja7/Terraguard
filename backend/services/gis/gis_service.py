import os
import json
from typing import Dict, Any, List, Optional

DATA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "data"))

class GISService:
    _instance: Optional["GISService"] = None

    @classmethod
    def get_instance(cls) -> "GISService":
        if cls._instance is None:
            cls._instance = GISService()
        return cls._instance

    def __init__(self):
        self.zones_geojson = self._load_zones_geojson()
        self.historical_landslides = self._load_historical_landslides()
        self.roads = self._init_critical_roads()

    def _load_zones_geojson(self) -> Dict[str, Any]:
        path = os.path.join(DATA_DIR, "geojson", "ner_zones.geojson")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        return {"type": "FeatureCollection", "features": []}

    def _load_historical_landslides(self) -> List[Dict[str, Any]]:
        path = os.path.join(DATA_DIR, "isro", "historical_landslides_ner.json")
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                data = json.load(f)
                return data[:150] # Optimized sample for fast clustering on frontend
        return []

    def _init_critical_roads(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "RD-NH10",
                "name": "NH-10 (Sevoke - Teesta - Gangtok Lifeline)",
                "state": "Sikkim / West Bengal",
                "district": "East Sikkim / Kalimpong",
                "length_km": 114,
                "status": "BLOCKED", # OPEN, PARTIAL, BLOCKED, CRITICAL
                "risk_level": "CRITICAL",
                "active_blockages": 2,
                "blockage_location": "29th Mile & Bhalu Khola Slide Points",
                "alternative_route": "NH-717A via Pedong - Reshi - Rhenock (Heavy Vehicle Restrictions)",
                "last_updated": "10 min ago"
            },
            {
                "id": "RD-NH29",
                "name": "NH-29 (Dimapur - Kohima - Mao Asian Highway 1)",
                "state": "Nagaland",
                "district": "Kohima / Chumoukedima",
                "length_km": 72,
                "status": "PARTIAL",
                "risk_level": "HIGH",
                "active_blockages": 1,
                "blockage_location": "Dzüdza Bridge / Phesama Sector",
                "alternative_route": "Niuland - Kohima bypass open for light vehicles only",
                "last_updated": "25 min ago"
            },
            {
                "id": "RD-NH37",
                "name": "NH-37 (Jiribam - Noney - Imphal Highway)",
                "state": "Manipur",
                "district": "Noney / Tamenglong",
                "length_km": 140,
                "status": "PARTIAL",
                "risk_level": "HIGH",
                "active_blockages": 1,
                "blockage_location": "Awangkhul Segment",
                "alternative_route": "Old Cachar Road (Restricted access)",
                "last_updated": "1 hour ago"
            },
            {
                "id": "RD-NH13",
                "name": "NH-13 (BCT Military Corridor - Tenga / Tawang Axis)",
                "state": "Arunachal Pradesh",
                "district": "West Kameng",
                "length_km": 180,
                "status": "OPEN",
                "risk_level": "MODERATE",
                "active_blockages": 0,
                "blockage_location": "None currently",
                "alternative_route": "Direct corridor operational",
                "last_updated": "15 min ago"
            },
            {
                "id": "RD-NH54",
                "name": "NH-54 (Silchar - Kolasib - Aizawl Arterial Link)",
                "state": "Mizoram",
                "district": "Aizawl / Kolasib",
                "length_km": 165,
                "status": "OPEN",
                "risk_level": "MODERATE",
                "active_blockages": 0,
                "blockage_location": "None currently",
                "alternative_route": "Standard route",
                "last_updated": "30 min ago"
            },
            {
                "id": "RD-SH12",
                "name": "SH-12 (Shillong - Mawsynram Hill Corridor)",
                "state": "Meghalaya",
                "district": "East Khasi Hills",
                "length_km": 68,
                "status": "OPEN",
                "risk_level": "LOW",
                "active_blockages": 0,
                "blockage_location": "None",
                "alternative_route": "Direct route",
                "last_updated": "40 min ago"
            }
        ]

    def get_zones_geojson(self) -> Dict[str, Any]:
        return self.zones_geojson

    def get_historical_landslides(self) -> List[Dict[str, Any]]:
        return self.historical_landslides

    def get_roads(self) -> List[Dict[str, Any]]:
        return self.roads

    def update_road_status(self, road_id: str, new_status: str, blockage_notes: Optional[str] = None) -> Optional[Dict[str, Any]]:
        for r in self.roads:
            if r["id"] == road_id:
                r["status"] = new_status
                if blockage_notes:
                    r["blockage_location"] = blockage_notes
                if new_status == "BLOCKED":
                    r["active_blockages"] = max(1, r.get("active_blockages", 1))
                elif new_status == "OPEN":
                    r["active_blockages"] = 0
                return r
        return None
