import { openDB, DBSchema, IDBPDatabase } from "idb";

interface TerraGuardDB extends DBSchema {
  sync_queue: {
    key: string;
    value: {
      localId: string;
      type: "INCIDENT" | "ROAD_STATUS";
      payload: any;
      createdAt: string;
      status: "PENDING" | "SYNCING" | "SYNCED" | "FAILED";
    };
  };
  cached_zones: {
    key: string;
    value: any;
  };
  cached_alerts: {
    key: string;
    value: any;
  };
}

const DB_NAME = "terraguard_offline_db";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<TerraGuardDB>> | null = null;

function getDb(): Promise<IDBPDatabase<TerraGuardDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("IndexedDB is only available in the browser"));
  }
  if (!dbPromise) {
    dbPromise = openDB<TerraGuardDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("sync_queue")) {
          db.createObjectStore("sync_queue", { keyPath: "localId" });
        }
        if (!db.objectStoreNames.contains("cached_zones")) {
          db.createObjectStore("cached_zones", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("cached_alerts")) {
          db.createObjectStore("cached_alerts", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

export const offlineDb = {
  async queueReport(type: "INCIDENT" | "ROAD_STATUS", payload: any): Promise<string> {
    const db = await getDb();
    const localId = `OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const record = {
      localId,
      type,
      payload,
      createdAt: new Date().toISOString(),
      status: "PENDING" as const,
    };
    await db.put("sync_queue", record);
    return localId;
  },

  async getPendingQueue(): Promise<any[]> {
    try {
      const db = await getDb();
      const all = await db.getAll("sync_queue");
      return all.filter((item) => item.status === "PENDING");
    } catch {
      return [];
    }
  },

  async markSynced(localIds: string[]): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction("sync_queue", "readwrite");
      for (const id of localIds) {
        await tx.store.delete(id);
      }
      await tx.done;
    } catch (e) {
      console.warn("Failed to clear synced items from IDB", e);
    }
  },

  async cacheZones(zones: any[]): Promise<void> {
    try {
      const db = await getDb();
      const tx = db.transaction("cached_zones", "readwrite");
      for (const z of zones) {
        await tx.store.put(z);
      }
      await tx.done;
    } catch (e) {
      console.warn("Failed to cache zones to IDB", e);
    }
  },

  async getCachedZones(): Promise<any[]> {
    try {
      const db = await getDb();
      return await db.getAll("cached_zones");
    } catch {
      return [];
    }
  },
};
