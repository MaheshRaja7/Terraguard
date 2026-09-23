from fastapi import APIRouter
from typing import Dict, Any, List
from pydantic import BaseModel, Field
from backend.services.sync.sync_service import SyncService

router = APIRouter(tags=["Offline PWA Sync"])

class SyncPayload(BaseModel):
    clientId: str = Field("field-officer-mobile", description="Identifier of reporting field device")
    items: List[Dict[str, Any]] = Field(..., description="Queued offline incident reports")

@router.post("/sync")
async def sync_offline_reports(payload: SyncPayload) -> Dict[str, Any]:
    svc = SyncService.get_instance()
    summary = svc.process_sync_batch(payload.items, payload.clientId)
    return summary

@router.get("/sync/status")
async def get_sync_status() -> Dict[str, Any]:
    return SyncService.get_instance().get_sync_status()
