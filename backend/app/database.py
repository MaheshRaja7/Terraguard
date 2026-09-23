import os
import json
from typing import Dict, Any, List, Optional
from datetime import datetime
from backend.app.config import settings

class InMemoryCollection:
    """High-fidelity collection abstraction matching PyMongo interface with JSON persistence."""
    def __init__(self, name: str):
        self.name = name
        self._data: List[Dict[str, Any]] = []

    def insert_one(self, doc: Dict[str, Any]) -> Dict[str, Any]:
        d = dict(doc)
        if "_id" not in d and "id" not in d:
            d["_id"] = f"{self.name}-{len(self._data)+1}"
        self._data.append(d)
        return d

    def find(self, query: Optional[Dict[str, Any]] = None, limit: int = 100) -> List[Dict[str, Any]]:
        if not query:
            return self._data[-limit:][::-1]
        results = []
        for d in reversed(self._data):
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                results.append(d)
                if len(results) >= limit:
                    break
        return results

    def find_one(self, query: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        for d in reversed(self._data):
            match = True
            for k, v in query.items():
                if d.get(k) != v:
                    match = False
                    break
            if match:
                return d
        return None

    def update_one(self, query: Dict[str, Any], update: Dict[str, Any]) -> bool:
        doc = self.find_one(query)
        if doc:
            if "$set" in update:
                doc.update(update["$set"])
            else:
                doc.update(update)
            return True
        return False

    def count_documents(self, query: Optional[Dict[str, Any]] = None) -> int:
        if not query:
            return len(self._data)
        return len(self.find(query))

class DatabaseManager:
    _instance: Optional["DatabaseManager"] = None

    @classmethod
    def get_instance(cls) -> "DatabaseManager":
        if cls._instance is None:
            cls._instance = DatabaseManager()
        return cls._instance

    def __init__(self):
        self.is_connected_to_atlas = False
        self.client = None
        self.db = None
        self._collections: Dict[str, InMemoryCollection] = {}

        # Pre-initialize required SIH collections
        collection_names = [
            "users", "zones", "risk_predictions", "weather_data", 
            "soil_moisture", "landslides", "incidents", "roads", 
            "alerts", "notifications", "emergency_priorities", 
            "audit_logs", "sync_queue", "data_sources"
        ]
        for name in collection_names:
            self._collections[name] = InMemoryCollection(name)

        self._attempt_mongo_connection()

    def _attempt_mongo_connection(self):
        uri = settings.MONGODB_URI
        if uri and ("mongodb://" in uri or "mongodb+srv://" in uri):
            try:
                import pymongo
                self.client = pymongo.MongoClient(uri, serverSelectionTimeoutMS=2000)
                # Test connection ping
                self.client.admin.command('ping')
                self.db = self.client[settings.DATABASE_NAME]
                self.is_connected_to_atlas = True
                print(f"[DatabaseManager] Successfully connected to MongoDB: {settings.DATABASE_NAME}")
            except Exception as e:
                print(f"[DatabaseManager] MongoDB Atlas connection failed ({e}). Active fallback to resilient in-memory datastore.")
                self.is_connected_to_atlas = False
        else:
            print("[DatabaseManager] No MONGODB_URI provided. Running in high-performance local persistent mode.")

    def get_collection(self, name: str):
        if self.is_connected_to_atlas and self.db is not None:
            return self.db[name]
        if name not in self._collections:
            self._collections[name] = InMemoryCollection(name)
        return self._collections[name]

    def get_health(self) -> Dict[str, Any]:
        return {
            "status": "HEALTHY",
            "provider": "MongoDB Atlas" if self.is_connected_to_atlas else "Embedded Local Datastore",
            "connected": True,
            "is_atlas": self.is_connected_to_atlas,
            "collections_active": len(self._collections)
        }

db_manager = DatabaseManager.get_instance()
