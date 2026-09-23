import { offlineDb } from "./offline-db";
import { api } from "./api";

type SyncListener = (status: {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncedText: string;
}) => void;

class SyncManager {
  private isOnline: boolean = true;
  private isSyncing: boolean = false;
  private listeners: Set<SyncListener> = new Set();
  private lastSyncedText: string = "Just now";

  constructor() {
    if (typeof window !== "undefined") {
      this.isOnline = navigator.onLine;
      window.addEventListener("online", () => this.handleNetworkChange(true));
      window.addEventListener("offline", () => this.handleNetworkChange(false));
      // Periodic check
      setInterval(() => this.checkAndSync(), 15000);
    }
  }

  public subscribe(listener: SyncListener): () => void {
    this.listeners.add(listener);
    this.notify();
    return () => this.listeners.delete(listener);
  }

  private async notify() {
    const pending = await offlineDb.getPendingQueue();
    Array.from(this.listeners).forEach((l) => {
      l({
        isOnline: this.isOnline,
        isSyncing: this.isSyncing,
        pendingCount: pending.length,
        lastSyncedText: this.lastSyncedText,
      });
    });
  }

  private handleNetworkChange(online: boolean) {
    this.isOnline = online;
    this.notify();
    if (online) {
      this.triggerSync();
    }
  }

  public async triggerSync(): Promise<number> {
    if (!this.isOnline || this.isSyncing) return 0;
    
    this.isSyncing = true;
    this.notify();

    try {
      const pending = await offlineDb.getPendingQueue();
      if (pending.length === 0) {
        this.isSyncing = false;
        this.notify();
        return 0;
      }

      const itemsToSync = pending.map((p) => ({
        localId: p.localId,
        type: p.type,
        ...p.payload,
      }));

      await api.syncOfflineBatch(itemsToSync);
      const syncedIds = pending.map((p) => p.localId);
      await offlineDb.markSynced(syncedIds);

      this.lastSyncedText = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      this.isSyncing = false;
      this.notify();
      return pending.length;
    } catch (err) {
      console.error("[SyncManager] Sync failed:", err);
      this.isSyncing = false;
      this.notify();
      return 0;
    }
  }

  public async checkAndSync() {
    if (this.isOnline) {
      await this.triggerSync();
    }
  }
}

export const syncManager = new SyncManager();
