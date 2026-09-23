import numpy as np
import pandas as pd
from typing import Dict, Any, List

FEATURE_COLUMNS = [
    "slope",
    "elevation",
    "historical_density",
    "dist_to_road_m",
    "geology_weathering",
    "rain_1h",
    "rain_6h",
    "rain_24h",
    "rain_72h",
    "forecast_rain_24h",
    "soil_moisture_0_7",
    "soil_moisture_7_28",
    "soil_moisture_28_100",
    "humidity",
    "temperature",
    "population",
    "road_criticality",
    "rain_acceleration",
    "soil_saturation_index",
    "slope_trigger_interaction",
    "susceptibility_index"
]

FEATURE_DISPLAY_NAMES = {
    "slope": "Terrain Slope (°)",
    "elevation": "Elevation (m)",
    "historical_density": "Historical Landslide Density",
    "dist_to_road_m": "Proximity to Road Corridor (m)",
    "geology_weathering": "Geological Weathering Grade",
    "rain_1h": "1-Hour Rainfall (mm)",
    "rain_6h": "6-Hour Cumulative Rainfall (mm)",
    "rain_24h": "24-Hour Cumulative Rainfall (mm)",
    "rain_72h": "72-Hour Cumulative Rainfall (mm)",
    "forecast_rain_24h": "24-Hour Forecast Rainfall (mm)",
    "soil_moisture_0_7": "Modelled Soil Moisture (0-7cm)",
    "soil_moisture_7_28": "Modelled Soil Moisture (7-28cm)",
    "soil_moisture_28_100": "Modelled Soil Moisture (28-100cm)",
    "humidity": "Relative Humidity (%)",
    "temperature": "Air Temperature (°C)",
    "population": "Population Exposure",
    "road_criticality": "Highway Lifeline Priority",
    "rain_acceleration": "Rainfall Acceleration Ratio",
    "soil_saturation_index": "Soil Saturation Index",
    "slope_trigger_interaction": "Slope x Trigger Dynamic Interaction",
    "susceptibility_index": "Geomorphic Susceptibility Index"
}

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Computes non-linear physical interactions between terrain susceptibility and weather triggers."""
    df = df.copy()
    
    defaults = {
        "slope": 30.0,
        "elevation": 1200.0,
        "historical_density": 5,
        "dist_to_road_m": 150.0,
        "geology_weathering": 3.0,
        "rain_1h": 0.0,
        "rain_6h": 0.0,
        "rain_24h": 0.0,
        "rain_72h": 0.0,
        "forecast_rain_24h": 0.0,
        "soil_moisture_0_7": 0.28,
        "soil_moisture_7_28": 0.26,
        "soil_moisture_28_100": 0.24,
        "humidity": 70.0,
        "temperature": 22.0,
        "population": 10000,
        "road_criticality": 2.0,
    }
    for col, default_val in defaults.items():
        if col not in df.columns:
            df[col] = default_val
        else:
            df[col] = df[col].fillna(default_val)

    # Dynamic features
    df["rain_acceleration"] = (df["rain_6h"] / (df["rain_24h"] + 1.0)).round(3)
    df["soil_saturation_index"] = (df["soil_moisture_0_7"] / 0.55).clip(0.0, 1.0).round(3)
    df["slope_trigger_interaction"] = ((df["slope"] * (df["rain_24h"] + 1.0)) / 100.0).round(3)
    df["susceptibility_index"] = ((df["slope"] / 45.0) * (df["historical_density"] + 1)).round(3)

    return df[FEATURE_COLUMNS]

def dict_to_features(data: Dict[str, Any]) -> pd.DataFrame:
    """Converts a single zone or live prediction request dictionary to engineered feature DataFrame."""
    df = pd.DataFrame([data])
    return engineer_features(df)
