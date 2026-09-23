import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple
from backend.ml.model_manager import ModelManager
from backend.ml.feature_engineering import dict_to_features, FEATURE_COLUMNS

RISK_TIERS = ["LOW", "MODERATE", "HIGH", "CRITICAL"]

def classify_risk_tier(score: float) -> str:
    if score < 26.0:
        return "LOW"
    elif score < 51.0:
        return "MODERATE"
    elif score < 76.0:
        return "HIGH"
    return "CRITICAL"

def predict_risk(features: Dict[str, Any]) -> Dict[str, Any]:
    """
    Executes ML inference using trained XGBoost models.
    Returns:
    - 'risk_score': 0-100 continuous score
    - 'risk_level': 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL'
    - 'risk_probability': probability of elevated/critical risk (0.0 to 1.0)
    - 'class_probabilities': dict of probabilities for each tier
    - 'confidence': confidence score (0-100%)
    - 'data_completeness': data completeness percentage (0-100%)
    - 'features_used': engineered feature vector
    """
    mgr = ModelManager.get_instance()
    X_feat = dict_to_features(features)

    # Calculate data completeness
    required_keys = ["slope", "rain_24h", "soil_moisture_0_7", "elevation", "historical_density"]
    present = sum(1 for k in required_keys if k in features and features[k] is not None)
    data_completeness = round((present / len(required_keys)) * 100, 1)

    if not mgr.is_available or mgr.regressor is None:
        # Graceful scientific formula fallback
        return _fallback_prediction(features, data_completeness)

    try:
        raw_score = float(mgr.regressor.predict(X_feat)[0])
        risk_score = round(float(np.clip(raw_score, 0.0, 100.0)), 1)
        risk_level = classify_risk_tier(risk_score)

        probs = [0.25, 0.25, 0.25, 0.25]
        if mgr.classifier is not None:
            raw_probs = mgr.classifier.predict_proba(X_feat)[0]
            probs = [round(float(p), 3) for p in raw_probs]

        class_probs = {
            "LOW": probs[0],
            "MODERATE": probs[1],
            "HIGH": probs[2],
            "CRITICAL": probs[3]
        }

        # Elevated risk probability (High + Critical)
        risk_probability = round(float(class_probs["HIGH"] + class_probs["CRITICAL"]), 2)

        # Confidence is derived from model margin + data completeness
        max_prob = max(probs)
        confidence = round(float(np.clip((max_prob * 60.0) + (data_completeness * 0.4), 40.0, 96.0)), 1)

        return {
            "risk_score": risk_score,
            "risk_level": risk_level,
            "risk_probability": risk_probability,
            "class_probabilities": class_probs,
            "confidence": confidence,
            "data_completeness": data_completeness,
            "model_version": mgr.version,
            "features": X_feat.to_dict(orient="records")[0]
        }
    except Exception as e:
        print(f"[predict_risk] Prediction error: {e}, using scientific fallback")
        return _fallback_prediction(features, data_completeness)

def _fallback_prediction(features: Dict[str, Any], completeness: float) -> Dict[str, Any]:
    slope = float(features.get("slope", 30.0))
    rain_24h = float(features.get("rain_24h", 20.0))
    rain_6h = float(features.get("rain_6h", 5.0))
    soil_m = float(features.get("soil_moisture_0_7", 0.28))
    hist = float(features.get("historical_density", 5))

    susc = min(100.0, (slope / 45.0) * 45.0 + (hist / 10.0) * 25.0 + 15.0)
    trig = min(100.0, (rain_24h / 200.0) * 45.0 + (rain_6h / 80.0) * 20.0 + (soil_m / 0.55) * 35.0)
    risk_score = round(0.50 * susc + 0.50 * trig, 1)
    risk_score = min(100.0, max(0.0, risk_score))
    risk_level = classify_risk_tier(risk_score)

    return {
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_probability": round(risk_score / 100.0, 2),
        "class_probabilities": {
            "LOW": 0.1, "MODERATE": 0.2, "HIGH": 0.3, "CRITICAL": 0.4
        },
        "confidence": round(completeness * 0.8, 1),
        "data_completeness": completeness,
        "model_version": "SCIENTIFIC-FALLBACK-HEURISTIC",
        "features": features
    }
