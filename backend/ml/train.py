import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, mean_absolute_error, mean_squared_error, r2_score
import xgboost as xgb
import shap

from backend.ml.data_loader import build_training_dataset, load_all_datasets
from backend.ml.feature_engineering import engineer_features, FEATURE_COLUMNS
from backend.ml.model_manager import ModelManager

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
os.makedirs(MODELS_DIR, exist_ok=True)

MODEL_VERSION = "TG-XGB-2.0-NER-UNIFIED"

def train_models():
    print(f"[{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] Starting TerraGuard AI Model Training (Version: {MODEL_VERSION})...")
    
    # 1. Multi-dataset Ingestion (All datasets in data/)
    print("Loading all datasets from data/ (Raw Landslide Observations, ISRO/NRSC Historical Inventory, NER Zones, and GLC)...")
    df_raw = build_training_dataset() # Uses all 12,500+ records
    print(f"Total training dataset size: {len(df_raw)} records.")
    
    X = engineer_features(df_raw)
    y_reg = df_raw["target_risk_score"]
    y_clf = df_raw["risk_class"]

    X_train, X_test, y_train_reg, y_test_reg, y_train_clf, y_test_clf = train_test_split(
        X, y_reg, y_clf, test_size=0.20, random_state=42, stratify=y_clf
    )

    print(f"Training on {len(X_train)} instances, validating on {len(X_test)} instances.")

    # 2. XGBoost Regressor for fine-grained 0-100 Operational Risk Score
    print("Training XGBoost Regressor...")
    regressor = xgb.XGBRegressor(
        n_estimators=220,
        max_depth=6,
        learning_rate=0.06,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror"
    )
    regressor.fit(X_train, y_train_reg)

    y_pred_reg = regressor.predict(X_test)
    y_pred_reg = np.clip(y_pred_reg, 0.0, 100.0)

    mae = mean_absolute_error(y_test_reg, y_pred_reg)
    rmse = float(np.sqrt(mean_squared_error(y_test_reg, y_pred_reg)))
    r2 = r2_score(y_test_reg, y_pred_reg)

    # 3. XGBoost Classifier for categorical risk tier (LOW, MODERATE, HIGH, CRITICAL)
    print("Training XGBoost Classifier...")
    classifier = xgb.XGBClassifier(
        n_estimators=180,
        max_depth=6,
        learning_rate=0.07,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="multi:softprob",
        num_class=4
    )
    classifier.fit(X_train, y_train_clf)

    y_pred_clf = classifier.predict(X_test)
    acc = accuracy_score(y_test_clf, y_pred_clf)
    prec = precision_score(y_test_clf, y_pred_clf, average="weighted", zero_division=0)
    rec = recall_score(y_test_clf, y_pred_clf, average="weighted", zero_division=0)
    f1 = f1_score(y_test_clf, y_pred_clf, average="weighted", zero_division=0)

    print("\n============================================================")
    print(f"        MODEL PERFORMANCE METRICS ({MODEL_VERSION})         ")
    print("============================================================")
    print(f"Classifier Accuracy:   {acc * 100:.2f}%")
    print(f"Classifier Precision:  {prec * 100:.2f}%")
    print(f"Classifier Recall:     {rec * 100:.2f}%")
    print(f"Classifier F1-Score:   {f1 * 100:.2f}%")
    print(f"Regressor MAE:         {mae:.2f} points (scale 0-100)")
    print(f"Regressor RMSE:        {rmse:.2f} points")
    print(f"Regressor R2 Score:    {r2:.4f}")
    print("============================================================\n")

    # Feature Importance
    feat_importances = dict(zip(FEATURE_COLUMNS, [float(v) for v in regressor.feature_importances_]))
    sorted_features = sorted(feat_importances.items(), key=lambda x: x[1], reverse=True)

    # Build SHAP TreeExplainer
    print("Initializing SHAP TreeExplainer on background sample...")
    explainer = shap.TreeExplainer(regressor)
    sample_background = X_train.sample(n=100, random_state=42)

    # Model Serialization
    model_payload = {
        "version": MODEL_VERSION,
        "trained_at": datetime.now().isoformat(),
        "features": FEATURE_COLUMNS,
        "regressor": regressor,
        "classifier": classifier,
        "explainer": explainer,
        "background_sample": sample_background,
        "metrics": {
            "accuracy": round(float(acc), 4),
            "precision": round(float(prec), 4),
            "recall": round(float(rec), 4),
            "f1_score": round(float(f1), 4),
            "mae": round(float(mae), 4),
            "rmse": round(float(rmse), 4),
            "r2": round(float(r2), 4),
            "total_samples": len(df_raw),
            "train_samples": len(X_train),
            "test_samples": len(X_test),
            "datasets_used": [
                "data/raw/landslide_dataset_raw.csv (12,025 observation points)",
                "data/isro/historical_landslides_ner.json (448 ISRO/GLC historical events)",
                "data/geojson/ner_zones.geojson (10 authoritative monitoring zones)",
                "Global_Landslide_Catalog_Export_rows.csv (NASA GLC Indian catalogue)"
            ]
        },
        "feature_importance": dict(sorted_features)
    }

    model_path = os.path.join(MODELS_DIR, "terraguard_xgb.joblib")
    joblib.dump(model_payload, model_path, compress=3)
    print(f"Model successfully saved to: {model_path}")

    # Save human-readable metadata JSON
    meta_path = os.path.join(MODELS_DIR, "model_metadata.json")
    with open(meta_path, "w", encoding="utf-8") as f:
        json.dump({
            "version": MODEL_VERSION,
            "trained_at": model_payload["trained_at"],
            "features": FEATURE_COLUMNS,
            "metrics": model_payload["metrics"],
            "feature_importance": model_payload["feature_importance"]
        }, f, indent=2)
    print(f"Model metadata successfully saved to: {meta_path}")

    # Reload model inside ModelManager
    ModelManager.get_instance().load_model()
    print("[ModelManager] In-memory model refreshed to latest version.")

    return model_payload

if __name__ == "__main__":
    train_models()
