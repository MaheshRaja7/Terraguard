import {
  DashboardData,
  ZoneGeoJSON,
  ZoneRiskEvaluation,
  WeatherData,
  AlertItem,
  SMSLogItem,
  FieldIncident,
  RoadCorridor,
  MultiTierTemplatesResponse,
  AutoDispatchStatus,
  AppBroadcastItem
} from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : "/api";

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;
  const isFormData = options?.body instanceof FormData;

  try {
    const res = await fetch(url, {
      ...options,
      headers: isFormData
        ? (options?.headers || {})
        : {
            "Content-Type": "application/json",
            ...(options?.headers || {}),
          },
    });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[API] Network error fetching ${url}:`, err);
    throw err;
  }
}

export const api = {
  getHealth: () => fetchJson<{ status: string; system: string; database: any }>("/health"),
  getDashboard: () => fetchJson<DashboardData>("/dashboard"),
  getZones: (state?: string, district?: string) => {
    const params = new URLSearchParams();
    if (state) params.set("state", state);
    if (district) params.set("district", district);
    const qs = params.toString();
    return fetchJson<ZoneGeoJSON>(`/zones${qs ? `?${qs}` : ""}`);
  },
  getZoneRisk: (zoneId: string) => fetchJson<ZoneRiskEvaluation>(`/risk/${zoneId}`),
  predictRisk: (data: any) =>
    fetchJson<any>("/risk/predict", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getWeather: (lat?: number, lon?: number) => {
    const q = lat && lon ? `?lat=${lat}&lon=${lon}` : "";
    return fetchJson<WeatherData>(`/weather${q}`);
  },
  getAlerts: (status?: string) => {
    const q = status ? `?status=${status}` : "";
    return fetchJson<AlertItem[]>(`/alerts${q}`);
  },
  acknowledgeAlert: (alertId: string, officerName: string = "Duty Commander") =>
    fetchJson<{ success: boolean; alert: AlertItem }>(`/alerts/${alertId}/acknowledge`, {
      method: "PATCH",
      body: JSON.stringify({ officer_name: officerName }),
    }),
  triggerTestCriticalAlert: () =>
    fetchJson<{ success: boolean; alert: AlertItem; message: string }>("/alerts/test-critical", {
      method: "POST",
    }),
  evaluateLiveWeatherAlerts: (params?: { limit?: number; notify_sms?: boolean; force_dispatch?: boolean; elevated_threshold?: number }) =>
    fetchJson<{ success: boolean; message: string; data: any }>("/alerts/evaluate-live-weather", {
      method: "POST",
      body: JSON.stringify(params || {}),
    }),
  getLiveWeatherStatus: () => fetchJson<{ has_scanned: boolean; data?: any; message?: string }>("/alerts/live-weather-status"),
  getMatchingLandslidePlaces: () => fetchJson<{ total: number; places: any[] }>("/alerts/places"),
  getSMSLogs: () => fetchJson<{ status: any; history: SMSLogItem[] }>("/notifications/sms"),
  sendTestSMS: (phoneNumber: string, message: string, audienceTier: string = "GENERAL") =>
    fetchJson<any>("/notifications/test-sms", {
      method: "POST",
      body: JSON.stringify({ phoneNumber, message, audienceTier }),
    }),
  getAlertTemplates: (params?: Record<string, any>) => {
    const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
    return fetchJson<MultiTierTemplatesResponse>(`/notifications/templates${qs}`);
  },
  broadcastMultiTier: (payload?: Record<string, any>) =>
    fetchJson<{ success: boolean; broadcastId: string; totalRecipients: number; smsResults: any[]; appBroadcast: any }>(
      "/notifications/broadcast-multi-tier",
      {
        method: "POST",
        body: JSON.stringify(payload || {}),
      }
    ),
  getAutoDispatchStatus: () => fetchJson<AutoDispatchStatus>("/notifications/auto-dispatch"),
  updateAutoDispatch: (enabled: boolean, threshold_score: number = 75) =>
    fetchJson<any>("/notifications/auto-dispatch", {
      method: "POST",
      body: JSON.stringify({ enabled, threshold_score }),
    }),
  getAppBroadcasts: () => fetchJson<AppBroadcastItem[]>("/notifications/app-broadcasts"),
  getIncidents: () => fetchJson<FieldIncident[]>("/incidents"),
  createIncident: (incidentData: Partial<FieldIncident>) =>
    fetchJson<{ success: boolean; incident: FieldIncident }>("/incidents", {
      method: "POST",
      body: JSON.stringify(incidentData),
    }),
  uploadIncident: (incidentData: Partial<FieldIncident>, files: File[] = []) => {
    const formData = new FormData();

    Object.entries(incidentData).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") return;
      if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
        return;
      }
      if (typeof value === "object") {
        if (value instanceof File) {
          formData.append(key, value);
          return;
        }
        formData.append(key, JSON.stringify(value));
        return;
      }
      formData.append(key, String(value));
    });

    files.forEach((file) => formData.append("files", file));

    return fetchJson<{ success: boolean; incident: FieldIncident }>("/incidents/upload", {
      method: "POST",
      body: formData,
    });
  },
  getRoads: () => fetchJson<RoadCorridor[]>("/roads"),
  updateRoad: (roadId: string, status: string, blockageLocation?: string) =>
    fetchJson<{ success: boolean; road: RoadCorridor }>(`/roads/${roadId}`, {
      method: "PATCH",
      body: JSON.stringify({ status, blockage_location: blockageLocation }),
    }),
  simulateRisk: (data: any) =>
    fetchJson<any>("/simulator/risk", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAnalytics: () => fetchJson<any>("/analytics/risk-trends"),
  getSystemStatus: () => fetchJson<any>("/admin/system-status"),
  getModelInfo: () => fetchJson<any>("/admin/model-info"),
  retrainModel: () => fetchJson<any>("/admin/retrain-model", { method: "POST" }),
  runDemoEmergencyScenario: () => fetchJson<any>("/demo/run-scenario", { method: "POST" }),
  resetDemoScenario: () => fetchJson<any>("/demo/reset", { method: "POST" }),
  syncOfflineBatch: (items: any[]) =>
    fetchJson<any>("/sync", {
      method: "POST",
      body: JSON.stringify({ clientId: "field-pwa-01", items }),
    }),
  getSummaryReport: () => fetchJson<any>("/reports/summary"),
};
