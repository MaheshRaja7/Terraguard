import numpy as np
import pandas as pd
from typing import Dict, Any, List
from backend.ml.model_manager import ModelManager
from backend.ml.feature_engineering import FEATURE_DISPLAY_NAMES, FEATURE_COLUMNS

def explain_prediction(X_features: pd.DataFrame, is_demo: bool = False) -> Dict[str, Any]:
    """
    Computes TreeSHAP explanations for a zone prediction.
    Returns:
    - 'factors': list of contributing factors ordered by absolute impact
    - 'base_value': model expected value
    - 'attribution_type': 'SHAP Model Explanation' or 'Illustrative Demo Explanation'
    """
    mgr = ModelManager.get_instance()
    
    if not mgr.is_available or mgr.explainer is None:
        # Graceful scientific heuristic attribution
        return _fallback_attribution(X_features, is_demo=True)

    try:
        explainer = mgr.explainer
        # TreeExplainer on 2D dataframe
        shap_values = explainer.shap_values(X_features)
        
        # If 2D array, take first instance
        if isinstance(shap_values, list):
            sv = shap_values[0][0] if len(shap_values) > 0 else np.zeros(len(FEATURE_COLUMNS))
        elif len(shap_values.shape) == 2:
            sv = shap_values[0]
        else:
            sv = shap_values

        base_val = float(explainer.expected_value) if hasattr(explainer, "expected_value") else 45.0
        if isinstance(base_val, (list, np.ndarray)):
            base_val = float(base_val[0])

        factors = []
        for col, impact in zip(X_features.columns, sv):
            impact_float = float(impact)
            if abs(impact_float) >= 0.3:
                factors.append({
                    "feature": col,
                    "label": FEATURE_DISPLAY_NAMES.get(col, col),
                    "impact": round(impact_float, 2),
                    "impact_display": f"{'+' if impact_float > 0 else ''}{impact_float:.1f}",
                    "direction": "RISK_INCREASE" if impact_float > 0 else "RISK_DECREASE",
                    "value": float(X_features[col].iloc[0])
                })

        # Sort factors by absolute impact
        factors.sort(key=lambda x: abs(x["impact"]), reverse=True)

        return {
            "attribution_type": "SHAP Model Explanation" if not is_demo else "Illustrative Demo Explanation",
            "base_value": round(base_val, 2),
            "factors": factors[:8],
            "total_factors_analyzed": len(factors)
        }
    except Exception as e:
        print(f"[explain_prediction] SHAP computation error: {e}, using heuristic attribution")
        return _fallback_attribution(X_features, is_demo=True)

def _fallback_attribution(X_features: pd.DataFrame, is_demo: bool = True) -> Dict[str, Any]:
    row = X_features.iloc[0]
    factors = []
    
    rain_24h = float(row.get("rain_24h", 0.0))
    if rain_24h > 15.0:
        impact = min(28.0, 5.0 + (rain_24h / 200.0) * 23.0)
        factors.append({"feature": "rain_24h", "label": "Heavy rainfall accumulation", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": rain_24h})

    soil_m = float(row.get("soil_moisture_0_7", 0.25))
    if soil_m > 0.30:
        impact = min(22.0, ((soil_m - 0.25) / 0.30) * 22.0)
        factors.append({"feature": "soil_moisture_0_7", "label": "Modelled soil moisture saturation", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": soil_m})

    slope = float(row.get("slope", 25.0))
    if slope > 28.0:
        impact = min(20.0, ((slope - 25.0) / 30.0) * 20.0)
        factors.append({"feature": "slope", "label": "Steep escarpment slope gradient", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": slope})

    hist_density = float(row.get("historical_density", 0))
    if hist_density > 2:
        impact = min(15.0, (hist_density / 15.0) * 15.0)
        factors.append({"feature": "historical_density", "label": "Historical landslide activity frequency", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": hist_density})

    forecast_rain = float(row.get("forecast_rain_24h", 0.0))
    if forecast_rain > 15.0:
        impact = min(12.0, (forecast_rain / 100.0) * 12.0)
        factors.append({"feature": "forecast_rain_24h", "label": "Heavy 24h forecast precipitation", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": forecast_rain})

    road_crit = float(row.get("road_criticality", 1.0))
    if road_crit >= 2.0:
        impact = 5.0 if road_crit == 2.0 else 8.5
        factors.append({"feature": "road_criticality", "label": "Critical highway lifeline corridor exposure", "impact": round(impact, 1), "impact_display": f"+{impact:.1f}", "direction": "RISK_INCREASE", "value": road_crit})

    factors.sort(key=lambda x: abs(x["impact"]), reverse=True)
    return {
        "attribution_type": "Illustrative Demo Explanation" if is_demo else "SHAP Model Explanation",
        "base_value": 42.0,
        "factors": factors[:8],
        "total_factors_analyzed": len(factors)
    }
