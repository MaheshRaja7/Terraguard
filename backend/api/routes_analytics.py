from fastapi import APIRouter
from typing import Dict, Any, List

router = APIRouter(tags=["Analytics & Intelligence"])

@router.get("/analytics/risk-trends")
async def get_risk_trends() -> Dict[str, Any]:
    # Aggregated trends across key NER states
    hourly_trends = [
        {"time": "00:00", "Sikkim": 38, "Meghalaya": 44, "Nagaland": 51, "Arunachal": 32},
        {"time": "04:00", "Sikkim": 42, "Meghalaya": 46, "Nagaland": 54, "Arunachal": 35},
        {"time": "08:00", "Sikkim": 58, "Meghalaya": 52, "Nagaland": 62, "Arunachal": 41},
        {"time": "12:00", "Sikkim": 71, "Meghalaya": 61, "Nagaland": 68, "Arunachal": 48},
        {"time": "16:00", "Sikkim": 87, "Meghalaya": 68, "Nagaland": 74, "Arunachal": 52},
        {"time": "20:00", "Sikkim": 85, "Meghalaya": 65, "Nagaland": 72, "Arunachal": 50},
    ]

    district_risk = [
        {"district": "East Sikkim", "state": "Sikkim", "average_risk": 84.5, "critical_zones": 14, "vulnerable_pop": 24500},
        {"district": "North Sikkim", "state": "Sikkim", "average_risk": 81.2, "critical_zones": 11, "vulnerable_pop": 8200},
        {"district": "Kohima", "state": "Nagaland", "average_risk": 72.8, "critical_zones": 8, "vulnerable_pop": 41000},
        {"district": "Kalimpong", "state": "West Bengal", "average_risk": 78.4, "critical_zones": 9, "vulnerable_pop": 32000},
        {"district": "Dima Hasao", "state": "Assam", "average_risk": 68.0, "critical_zones": 5, "vulnerable_pop": 29000},
        {"district": "East Khasi Hills", "state": "Meghalaya", "average_risk": 64.2, "critical_zones": 4, "vulnerable_pop": 14300},
        {"district": "Noney", "state": "Manipur", "average_risk": 71.0, "critical_zones": 6, "vulnerable_pop": 11500},
        {"district": "West Kameng", "state": "Arunachal", "average_risk": 62.5, "critical_zones": 3, "vulnerable_pop": 18000},
    ]

    rainfall_risk_scatter = [
        {"rain_24h": 15, "soil_moisture": 0.22, "risk": 24},
        {"rain_24h": 35, "soil_moisture": 0.28, "risk": 38},
        {"rain_24h": 60, "soil_moisture": 0.34, "risk": 55},
        {"rain_24h": 85, "soil_moisture": 0.39, "risk": 68},
        {"rain_24h": 110, "soil_moisture": 0.44, "risk": 82},
        {"rain_24h": 145, "soil_moisture": 0.49, "risk": 91},
        {"rain_24h": 180, "soil_moisture": 0.52, "risk": 96},
    ]

    incident_categories = [
        {"name": "Landslide / Mudflow", "count": 42},
        {"name": "Road Blockage", "count": 28},
        {"name": "Tension Cracks", "count": 19},
        {"name": "Rockfall", "count": 15},
        {"name": "Drainage Failure", "count": 11},
        {"name": "Infrastructure Damage", "count": 7},
    ]

    return {
        "hourly_trends": hourly_trends,
        "district_risk": district_risk,
        "rainfall_risk_correlation": rainfall_risk_scatter,
        "incident_categories": incident_categories,
        "response_metrics": {
            "mean_time_to_detect_min": 4.2,
            "mean_time_to_warn_min": 1.8,
            "mean_time_to_dispatch_min": 12.5,
            "alerts_issued_24h": 18,
            "sms_notifications_delivered": 142
        }
    }
