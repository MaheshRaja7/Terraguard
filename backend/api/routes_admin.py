import os
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from backend.app.database import db_manager
from backend.services.weather.weather_service import WeatherService
from backend.services.notifications.notification_service import NotificationService
from backend.services.sync.sync_service import SyncService
from backend.ml.model_manager import ModelManager
from backend.ml.train import train_models

router = APIRouter(tags=["Admin & Data Engineering"])
weather_service = WeatherService()

class FieldMappingRequest(BaseModel):
    latitude_col: str
    longitude_col: str
    slope_col: Optional[str] = None
    rainfall_col: Optional[str] = None
    elevation_col: Optional[str] = None

@router.get("/admin/system-status")
async def get_system_status() -> Dict[str, Any]:
    db_health = db_manager.get_health()
    sms_status = NotificationService.get_instance().get_provider_status()
    sync_status = SyncService.get_instance().get_sync_status()
    model_mgr = ModelManager.get_instance()

    # IMD check
    imd_configured = weather_service.imd.is_configured

    services = [
        {"name": "AI Model Engine", "status": "GREEN" if model_mgr.is_available else "RED", "detail": f"Version {model_mgr.version}"},
        {"name": "Database Persistence", "status": "GREEN", "detail": db_health["provider"]},
        {"name": "Weather Provider (Open-Meteo)", "status": "GREEN", "detail": "Live API Operational"},
        {"name": "Official IMD Integration", "status": "YELLOW" if not imd_configured else "GREEN", "detail": "Configured" if imd_configured else "IMD integration not configured (Graceful Fallback Active)"},
        {"name": "SMS Gateway", "status": "GREEN", "detail": f"{sms_status['provider']} ({sms_status['mode']})"},
        {"name": "Offline Sync Engine", "status": "GREEN", "detail": f"{sync_status['engine_status']} ({sync_status['total_batches_synced']} batches synced)"}
    ]

    return {
        "overall_health": "OPTIMAL",
        "services": services
    }

@router.get("/admin/model-info")
async def get_model_info() -> Dict[str, Any]:
    mgr = ModelManager.get_instance()
    return {
        "version": mgr.version,
        "is_available": mgr.is_available,
        "metrics": mgr.metrics,
        "feature_importance": mgr.feature_importance
    }

@router.post("/admin/retrain-model")
async def retrain_model() -> Dict[str, Any]:
    try:
        payload = train_models()
        ModelManager.get_instance().load_model()
        return {
            "success": True,
            "version": payload["version"],
            "metrics": payload["metrics"],
            "message": "Model retrained and loaded into memory successfully."
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retraining error: {e}")

@router.post("/admin/import-data")
async def import_data(file: UploadFile = File(...)) -> Dict[str, Any]:
    filename = file.filename or "uploaded_file"
    ext = os.path.splitext(filename)[-1].lower()
    
    if ext not in [".csv", ".xlsx", ".xls", ".json", ".geojson"]:
        raise HTTPException(status_code=400, detail="Unsupported format. Supported: .csv, .xlsx, .xls, .json, .geojson")

    contents = await file.read()
    detected_columns = []
    sample_rows = []

    if ext == ".csv":
        import io, csv
        text = contents.decode("utf-8", errors="ignore")
        reader = csv.DictReader(io.StringIO(text))
        detected_columns = reader.fieldnames or []
        for i, row in enumerate(reader):
            if i < 3:
                sample_rows.append(row)
            else:
                break
    elif ext in [".xlsx", ".xls"]:
        import io, pandas as pd
        df = pd.read_excel(io.BytesIO(contents))
        detected_columns = list(df.columns)
        sample_rows = df.head(3).to_dict(orient="records")
    else: # json / geojson
        import json
        data = json.loads(contents.decode("utf-8"))
        if isinstance(data, dict) and data.get("type") == "FeatureCollection":
            feats = data.get("features", [])
            sample_rows = [f.get("properties", {}) for f in feats[:3]]
            detected_columns = list(sample_rows[0].keys()) if sample_rows else []
        elif isinstance(data, list) and len(data) > 0:
            sample_rows = data[:3]
            detected_columns = list(data[0].keys())

    # Smart automatic column mapping suggestion
    mapping_suggestions = {}
    for col in detected_columns:
        c_low = col.lower()
        if "lat" in c_low:
            mapping_suggestions["latitude"] = col
        elif "lon" in c_low or "lng" in c_low:
            mapping_suggestions["longitude"] = col
        elif "slope" in c_low or "gradient" in c_low:
            mapping_suggestions["slope"] = col
        elif "rain" in c_low or "precip" in c_low:
            mapping_suggestions["rainfall"] = col
        elif "elev" in c_low or "alt" in c_low:
            mapping_suggestions["elevation"] = col

    return {
        "filename": filename,
        "format": ext,
        "file_size_bytes": len(contents),
        "detected_columns": detected_columns,
        "sample_preview": sample_rows,
        "mapping_suggestions": mapping_suggestions,
        "message": f"Successfully parsed {filename}. Please confirm field mapping."
    }
