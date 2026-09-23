import os
import joblib
import json
from typing import Dict, Any, Optional

MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "models"))
MODEL_PATH = os.path.join(MODELS_DIR, "terraguard_xgb.joblib")
META_PATH = os.path.join(MODELS_DIR, "model_metadata.json")

class ModelManager:
    _instance: Optional["ModelManager"] = None
    _model_data: Optional[Dict[str, Any]] = None

    @classmethod
    def get_instance(cls) -> "ModelManager":
        if cls._instance is None:
            cls._instance = ModelManager()
        return cls._instance

    def __init__(self):
        self.load_model()

    def load_model(self):
        if os.path.exists(MODEL_PATH):
            try:
                self._model_data = joblib.load(MODEL_PATH)
                print(f"[ModelManager] Loaded ML model version: {self._model_data.get('version', 'unknown')}")
            except Exception as e:
                print(f"[ModelManager] Error loading model: {e}")
                self._model_data = None
        else:
            print(f"[ModelManager] Model file not found at {MODEL_PATH}")

    @property
    def is_available(self) -> bool:
        return self._model_data is not None

    @property
    def regressor(self):
        return self._model_data["regressor"] if self._model_data else None

    @property
    def classifier(self):
        return self._model_data["classifier"] if self._model_data else None

    @property
    def explainer(self):
        return self._model_data["explainer"] if self._model_data else None

    @property
    def version(self) -> str:
        return self._model_data.get("version", "TG-XGB-1.0") if self._model_data else "UNLOADED"

    @property
    def metrics(self) -> Dict[str, Any]:
        if self._model_data and "metrics" in self._model_data:
            return self._model_data["metrics"]
        if os.path.exists(META_PATH):
            with open(META_PATH, "r", encoding="utf-8") as f:
                return json.load(f).get("metrics", {})
        return {}

    @property
    def feature_importance(self) -> Dict[str, float]:
        if self._model_data and "feature_importance" in self._model_data:
            return self._model_data["feature_importance"]
        return {}
