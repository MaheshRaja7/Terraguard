import React, { useEffect, useState } from "react";
import { 
  X, 
  Mountain, 
  Droplets, 
  Users, 
  Truck, 
  AlertTriangle, 
  Clock, 
  CheckCircle,
  FileText,
  CloudRain,
  Wind,
  Thermometer,
  Gauge
} from "lucide-react";
import { api } from "@/lib/api";
import { WeatherData, ZoneFeature, ThreatLevel } from "@/types";
import { RiskBadge, SourceBadge } from "@/components/common/StatusBadges";

interface ZoneDetailDrawerProps {
  zone: ZoneFeature | null;
  onClose: () => void;
}

export function ZoneDetailDrawer({ zone, onClose }: ZoneDetailDrawerProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);

  useEffect(() => {
    if (!zone) return;

    const { latitude, longitude } = zone.properties;

    async function loadWeather() {
      setWeatherLoading(true);
      try {
        const data = await api.getWeather(latitude, longitude);
        setWeather(data);
      } catch (error) {
        console.error("Zone weather fetch failed", error);
      } finally {
        setWeatherLoading(false);
      }
    }

    loadWeather();
  }, [zone]);

  if (!zone) return null;
  const p = zone.properties;

  const liveRiskScore = Number(p.risk_score ?? p.baseline_susceptibility ?? 0);
  const riskLevel: ThreatLevel = 
    liveRiskScore >= 76 ? "CRITICAL" : 
    liveRiskScore >= 51 ? "HIGH" : 
    liveRiskScore >= 26 ? "MODERATE" : "LOW";

  const w = weather?.weather;

  return (
    <div className="absolute top-3 right-3 z-[1001] w-80 sm:w-96 bg-[#0c162cf8] backdrop-blur-md border border-[#213866] rounded-lg p-4 shadow-2xl font-mono text-xs text-slate-300 transition-all max-h-[90%] overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between border-b border-slate-700/80 pb-2 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">{p.id}</span>
            <RiskBadge level={riskLevel} score={liveRiskScore} />
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">{p.name}</div>
          <div className="text-[10px] text-sky-400">{p.district}, {p.state}</div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Geomorphic and Exposure Stats */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Mountain className="w-3 h-3 text-amber-400" />
            <span>TERRAIN SLOPE</span>
          </div>
          <div className="text-base font-bold text-white mt-0.5">{p.slope}°</div>
          <div className="text-[9px] text-slate-400">Elevation: {p.elevation}m</div>
        </div>

        <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Users className="w-3 h-3 text-purple-400" />
            <span>POPULATION</span>
          </div>
          <div className="text-base font-bold text-white mt-0.5">{p.population_at_risk?.toLocaleString()}</div>
          <div className="text-[9px] text-slate-400">At Immediate Risk</div>
        </div>

        <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-400" />
            <span>HISTORICAL SLIDES</span>
          </div>
          <div className="text-base font-bold text-red-400 mt-0.5">{p.historical_landslides}</div>
          <div className="text-[9px] text-slate-400">ISRO Mapped Catalog</div>
        </div>

        <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Truck className="w-3 h-3 text-sky-400" />
            <span>LIFELINE ROAD</span>
          </div>
          <div className="text-xs font-bold text-white mt-0.5 truncate">{p.road_exposure}</div>
          <div className="text-[9px] text-slate-400">Highway Corridors</div>
        </div>
      </div>

      {/* Live weather radar for selected location */}
      <div className="mb-3 p-2.5 bg-[#0e1930] rounded border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-sky-300">
            <CloudRain className="w-3.5 h-3.5" />
            WEATHER RADAR
          </div>
          <span className="text-[9px] text-slate-400">{weatherLoading ? "LOADING..." : weather?.data_freshness || "LIVE"}</span>
        </div>

        {weatherLoading ? (
          <div className="text-[10px] text-slate-400">Fetching Open-Meteo conditions...</div>
        ) : (
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400"><Thermometer className="w-3 h-3 text-amber-400" />TEMP</div>
              <div className="mt-1 text-base font-bold text-white">{w?.temperature ?? "--"}°C</div>
            </div>
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400"><Droplets className="w-3 h-3 text-sky-400" />HUMIDITY</div>
              <div className="mt-1 text-base font-bold text-sky-300">{w?.humidity ?? "--"}%</div>
            </div>
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400"><CloudRain className="w-3 h-3 text-red-400" />24H RAIN</div>
              <div className="mt-1 text-base font-bold text-red-400">{w?.rain_24h ?? "--"} mm</div>
            </div>
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400"><Wind className="w-3 h-3 text-indigo-400" />WIND</div>
              <div className="mt-1 text-base font-bold text-indigo-300">{w?.wind_speed ?? "--"} km/h</div>
            </div>
            <div className="col-span-2 p-2 bg-[#121f3b] rounded border border-slate-800">
              <div className="flex items-center gap-1 text-slate-400"><Gauge className="w-3 h-3 text-emerald-400" />SOIL MOISTURE</div>
              <div className="mt-1 text-sm font-bold text-emerald-300">
                {weather?.soil_moisture?.depths?.[0]?.moisture ?? "--"} m³/m³ at 0–7cm
              </div>
              <div className="text-[9px] text-slate-400 mt-1">
                {weather?.soil_moisture?.status || "Monitoring..."}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Geology & Environmental Attributes */}
      <div className="space-y-2 mb-3 text-[11px]">
        {p.geology && (
          <div className="p-2 bg-[#0e1930] rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">GEOLOGICAL SUBSTRATE:</span>
            <span className="text-slate-200">{p.geology}</span>
          </div>
        )}

        {p.critical_facilities && p.critical_facilities.length > 0 && (
          <div className="p-2 bg-[#0e1930] rounded border border-slate-800">
            <span className="text-slate-400 block text-[10px]">CRITICAL INFRASTRUCTURE:</span>
            <ul className="list-disc list-inside text-slate-300 space-y-0.5 mt-1">
              {p.critical_facilities.map((fac, idx) => (
                <li key={idx} className="truncate">{fac}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
        <SourceBadge type="HISTORICAL" label="ISRO Atlas 2023" />
        <span>Freshness: {weather?.data_freshness || "Live Operations"}</span>
      </div>
    </div>
  );
}
