import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database import db_manager
from backend.ml.model_manager import ModelManager

# Import routers
from backend.api.routes_dashboard import router as dashboard_router
from backend.api.routes_zones import router as zones_router
from backend.api.routes_risk import router as risk_router
from backend.api.routes_weather import router as weather_router
from backend.api.routes_alerts import router as alerts_router
from backend.api.routes_notifications import router as notifications_router
from backend.api.routes_incidents import router as incidents_router
from backend.api.routes_roads import router as roads_router
from backend.api.routes_simulator import router as simulator_router
from backend.api.routes_demo import router as demo_router
from backend.api.routes_admin import router as admin_router
from backend.api.routes_analytics import router as analytics_router
from backend.api.routes_sync import router as sync_router
from backend.api.routes_reports import router as reports_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"============================================================")
    print(f"    TERRAGUARD AI — NER Landslide Early Warning System      ")
    print(f"    Problem Statement SIH26001 | Disaster Management        ")
    print(f"    Tagline: '{settings.TAGLINE}'                         ")
    print(f"============================================================")
    
    # Initialize ML models
    model_mgr = ModelManager.get_instance()
    print(f"[Startup] ML Model Engine: {'ACTIVE (v' + model_mgr.version + ')' if model_mgr.is_available else 'UNAVAILABLE'}")
    
    # Check Database layer
    db_health = db_manager.get_health()
    print(f"[Startup] Datastore: {db_health['provider']} (Status: {db_health['status']})")
    print(f"[Startup] SMS Gateway Provider: {settings.SMS_PROVIDER.upper()} (Simulation Delay: {settings.SMS_SIMULATION_DELAY_MS}ms)")
    print(f"[Startup] Demo Mode: {settings.DEMO_MODE}")
    print(f"[Startup] API Documentation ready at: http://localhost:8000/docs")
    yield
    print("[Shutdown] TerraGuard AI service stopped.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AI-Based Early Warning and Landslide Risk Monitoring System in North Eastern Region (NER). Smart India Hackathon 2026 Problem SIH26001.",
    version=settings.VERSION,
    lifespan=lifespan
)

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")
app.mount("/api/uploads", StaticFiles(directory=UPLOAD_DIR), name="api_uploads")

# Robust CORS policy
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:8000",
    "http://127.0.0.1:8000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "tagline": settings.TAGLINE,
        "problem_statement": settings.PROBLEM_STATEMENT,
        "version": settings.VERSION,
        "database": db_manager.get_health(),
        "model_loaded": ModelManager.get_instance().is_available,
        "sms_provider": settings.SMS_PROVIDER
    }

# Register all API routes under /api
app.include_router(dashboard_router, prefix="/api")
app.include_router(zones_router, prefix="/api")
app.include_router(risk_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(alerts_router, prefix="/api")
app.include_router(notifications_router, prefix="/api")
app.include_router(incidents_router, prefix="/api")
app.include_router(roads_router, prefix="/api")
app.include_router(simulator_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(sync_router, prefix="/api")
app.include_router(reports_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="0.0.0.0", port=8000, reload=True)
