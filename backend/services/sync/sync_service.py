from datetime import datetime
from typing import Dict, Any, List, Optional
import uuid

class SyncService:
    _instance: Optional["SyncService"] = None

    @classmethod
    def get_instance(cls) -> "SyncService":
        if cls._instance is None:
            cls._instance = SyncService()
        return cls._instance

    def __init__(self):
        self._synced_batches: List[Dict[str, Any]] = []

    def process_sync_batch(self, items: List[Dict[str, Any]], client_id: str = "field-pwa-01") -> Dict[str, Any]:
        """Processes offline queued field reports and incidents."""
        batch_id = f"SYNC-{uuid.uuid4().hex[:6].upper()}"
        processed_items = []
        now = datetime.now().isoformat()

        for item in items:
            item_id = item.get("localId") or item.get("id") or f"ITEM-{uuid.uuid4().hex[:6]}"
            processed_items.append({
                "localId": item_id,
                "serverId": f"TG-SRV-{uuid.uuid4().hex[:6]}",
                "status": "SYNCED",
                "type": item.get("type", "INCIDENT"),
                "syncedAt": now
            })

        summary = {
            "batchId": batch_id,
            "clientId": client_id,
            "totalReceived": len(items),
            "totalSynced": len(processed_items),
            "status": "COMPLETED",
            "timestamp": now,
            "items": processed_items
        }

        self._synced_batches.insert(0, summary)
        return summary

    def get_sync_status(self) -> Dict[str, Any]:
        return {
            "total_batches_synced": len(self._synced_batches),
            "last_sync": self._synced_batches[0]["timestamp"] if self._synced_batches else None,
            "engine_status": "ONLINE"
        }
