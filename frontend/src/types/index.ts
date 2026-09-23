export type ThreatLevel = "LOW" | "MODERATE" | "HIGH" | "CRITICAL";

export interface ZoneProperties {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number;
  longitude: number;
  slope: number;
  elevation: number;
  aspect?: string;
  historical_landslides: number;
  population_at_risk: number;
  road_exposure: string;
  critical_facilities: string[];
  baseline_susceptibility: number;
  risk_score?: number;
  live_weather?: {
    rain_24h?: number;
    soil_moisture_0_7?: number;
  };
  geology?: string;
  land_cover?: string;
}

export interface ZoneFeature {
  type: "Feature";
  id: string;
  properties: ZoneProperties;
  geometry: {
    type: "Polygon";
    coordinates: number[][][];
  };
}

export interface ZoneGeoJSON {
  type: "FeatureCollection";
  features: ZoneFeature[];
}

export interface RiskFactor {
  feature: string;
  label: string;
  impact: number;
  impact_display: string;
  direction: "RISK_INCREASE" | "RISK_DECREASE";
  value: number;
}

export interface RiskExplanation {
  attribution_type: string;
  base_value: number;
  factors: RiskFactor[];
  total_factors_analyzed: number;
}

export interface RiskTrendPoint {
  time: string;
  score: number;
}

export interface EmergencyPriority {
  priority_score: number;
  priority_tier: "P1" | "P2" | "P3";
  priority_label: string;
}

export interface ZoneRiskEvaluation {
  zone_id: string;
  zone_name: string;
  district: string;
  state: string;
  risk_score: number;
  risk_level: ThreatLevel;
  risk_probability: number;
  class_probabilities: Record<ThreatLevel, number>;
  confidence: number;
  data_completeness: number;
  priority: EmergencyPriority;
  layers: {
    susceptibility: {
      score: number;
      slope: number;
      elevation: number;
      geology: string;
      historical_landslides: number;
    };
    trigger: {
      score: number;
      rain_1h: number;
      rain_6h: number;
      rain_24h: number;
      rain_72h: number;
      forecast_rain_24h: number;
      soil_moisture_0_7: number;
      soil_moisture_status: string;
    };
    exposure: {
      score: number;
      population_at_risk: number;
      road_exposure: string;
      critical_facilities: string[];
    };
  };
  explanation: RiskExplanation;
  trend: {
    series: RiskTrendPoint[];
    change_6h: string;
    acceleration_points: number;
    status: string;
    reason: string;
  };
  sources: {
    historical_landslides: string;
    weather: string;
    soil_moisture: string;
    terrain: string;
    is_modelled_soil: boolean;
  };
  data_freshness: string;
  last_updated: string;
}

export interface SoilMoistureDepth {
  depth: string;
  moisture: number;
  unit: string;
  status: string;
}

export interface WeatherData {
  weather: {
    temperature: number;
    humidity: number;
    rain_current: number;
    wind_speed: number;
    pressure: number;
    rain_1h: number;
    rain_6h: number;
    rain_24h: number;
    rain_72h: number;
    forecast_rain_6h: number;
    forecast_rain_24h: number;
    forecast_timeline: { time: string; rain_mm: number; soil_moisture: number }[];
    is_cached: boolean;
  };
  soil_moisture: {
    label: string;
    source: string;
    is_modelled: boolean;
    note: string;
    depths: SoilMoistureDepth[];
    six_hours_ago: number;
    twenty_four_hours_ago: number;
    trend: string;
    status: string;
  };
  data_freshness: string;
}

export interface AlertItem {
  id: string;
  zoneId: string;
  zoneName: string;
  district: string;
  state: string;
  riskScore: number;
  severity: ThreatLevel;
  isEscalation: boolean;
  message: string;
  recipients: string[];
  channels: string[];
  createdAt: string;
  status: "ACTIVE" | "ACKNOWLEDGED" | "ASSIGNED" | "RESOLVED";
  priority: string;
  acknowledgedAt?: string | null;
  acknowledgedBy?: string | null;
}

export interface TimelineItem {
  id: string;
  title: string;
  zoneId: string;
  type: string;
  refId?: string;
  timestamp: string;
  isoTimestamp?: string;
}

export interface FieldIncident {
  id: string;
  type: string;
  category: string;
  severity: ThreatLevel;
  district: string;
  state: string;
  location: { latitude: number; longitude: number };
  description: string;
  road_blocked: boolean;
  road_name?: string | null;
  reporter_name?: string;
  status: string;
  photo_url?: string | null;
  media_urls?: string[];
  reported_at: string;
}

export interface RoadCorridor {
  id: string;
  name: string;
  state: string;
  district: string;
  length_km: number;
  status: "OPEN" | "PARTIAL" | "BLOCKED" | "CRITICAL";
  risk_level: ThreatLevel;
  active_blockages: number;
  blockage_location: string;
  alternative_route: string;
  last_updated: string;
}

export interface SMSLogItem {
  messageId: string;
  type: string;
  provider: string;
  recipient: string;
  recipientTitle?: string;
  audienceTier?: "DISTRICT_ADMIN" | "DISASTER_AUTHORITIES" | "COMMUNITY" | string;
  channel?: string;
  message: string;
  zoneId: string;
  riskScore: number;
  severity: ThreatLevel;
  status: "QUEUED" | "PROCESSING" | "SENT" | "DELIVERED" | "FAILED";
  displayStatus: string;
  demo: boolean;
  createdAt: string;
  deliveredAt?: string | null;
}

export interface AppBroadcastItem {
  broadcastId: string;
  severity: ThreatLevel;
  riskScore: number;
  zoneId: string;
  zoneName?: string;
  district: string;
  title: string;
  summary: string;
  actionRequired: string;
  channels: string[];
  audience?: string[];
  active: boolean;
  createdAt: string;
}

export interface AlertRecipient {
  name: string;
  phone: string;
  role: string;
}

export interface AlertTemplateTier {
  id: "DISTRICT_ADMIN" | "DISASTER_AUTHORITIES" | "COMMUNITY";
  label: string;
  subtext: string;
  badgeColor: string;
  recipients: AlertRecipient[];
  channels: string[];
  protocol: string;
  message: string;
}

export interface MultiTierTemplatesResponse {
  zone_info: Record<string, any>;
  tiers: {
    DISTRICT_ADMIN: AlertTemplateTier;
    DISASTER_AUTHORITIES: AlertTemplateTier;
    COMMUNITY: AlertTemplateTier;
  };
}

export interface AutoDispatchStatus {
  config: {
    enabled: boolean;
    threshold_score: number;
    min_severity: string;
    channels: string[];
    auto_dispatched_count: number;
    last_auto_dispatch?: string | null;
  };
  active_provider: any;
  active_app_broadcasts: number;
}

export interface PriorityQueueItem {
  tier: "P1" | "P2" | "P3";
  zoneId: string;
  name: string;
  risk: number;
  population: number;
  exposure: string;
}

export interface DashboardData {
  metrics: {
    monitored_zones: number;
    critical_zones: number;
    active_alerts: number;
    blocked_roads: number;
    population_at_risk: number;
  };
  mode: string;
  demo_mode: boolean;
  priority_queue: PriorityQueueItem[];
  recent_alerts: AlertItem[];
  timeline: TimelineItem[];
  source: string;
}
