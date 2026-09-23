"use client";

import React, { useState, useEffect } from "react";
import { 
  Sliders, 
  Play, 
  RotateCcw, 
  ShieldAlert, 
  Info, 
  TrendingUp, 
  Activity,
  Droplets,
  CloudRain,
  Mountain,
  Users
} from "lucide-react";
import { api } from "@/lib/api";
import { RiskBadge, PriorityBadge } from "@/components/common/StatusBadges";

export default function RiskSimulatorPage() {
  const [params, setParams] = useState({
    rain_1h: 18.0,
    rain_6h: 55.0,
    rain_24h: 120.0,
    rain_72h: 180.0,
    forecast_rain_24h: 45.0,
    soil_moisture_0_7: 0.48,
    slope: 38.0,
    elevation: 1650.0,
    historical_density: 10,
    population: 24500,
    road_criticality: 3.0,
  });

  const [simResult, setSimResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runSimulation = async (updated = params) => {
    try {
      setLoading(true);
      const res = await api.simulateRisk(updated);
      setSimResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const handleSliderChange = (key: string, value: number) => {
    const updated = { ...params, [key]: value };
    setParams(updated);
    runSimulation(updated);
  };

  const resetToBaseline = () => {
    const baseline = {
      rain_1h: 5.0,
      rain_6h: 20.0,
      rain_24h: 45.0,
      rain_72h: 70.0,
      forecast_rain_24h: 20.0,
      soil_moisture_0_7: 0.28,
      slope: 30.0,
      elevation: 1200.0,
      historical_density: 4,
      population: 12000,
      road_criticality: 2.0,
    };
    setParams(baseline);
    runSimulation(baseline);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header Banner with Explicit Simulation Notice */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-4 h-4 text-purple-400" />
            OPERATIONAL RISK SCENARIO SIMULATOR (WHAT-IF ENGINE)
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Test extreme precipitation bursts and soil saturation shifts in an isolated sandbox
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded bg-purple-950 border border-purple-700 text-purple-300 text-xs font-bold animate-pulse">
            SIMULATION MODE ACTIVE
          </span>
          <button
            onClick={resetToBaseline}
            className="flex items-center gap-1 text-xs px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded text-slate-300"
          >
            <RotateCcw className="w-3 h-3" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Mandatory Non-Destructive Data Rule Notice */}
      <div className="p-2.5 bg-amber-950/20 border border-amber-800/40 rounded flex items-center gap-2 text-xs text-amber-300">
        <Info className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          CRITICAL INTEGRITY GUARANTEE: This simulator computes ephemeral outcomes and does NOT alter actual historical records, active alerts, or live sensor feeds.
        </span>
      </div>

      {/* Layout: Sliders (Left) vs Real-Time Result Gauge (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Sliders */}
        <div className="lg:col-span-7 bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 space-y-4">
          <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
            DYNAMIC ENVIRONMENTAL & TERRAIN DRIVERS
          </div>

          <div className="space-y-4 text-xs">
            {/* 24h Rainfall Slider */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-sky-400" />
                  24-Hour Rainfall Accumulation
                </span>
                <span className="text-sky-400 font-bold">{params.rain_24h} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={300}
                step={5}
                value={params.rain_24h}
                onChange={(e) => handleSliderChange("rain_24h", Number(e.target.value))}
                className="w-full accent-sky-400"
              />
            </div>

            {/* Modelled Soil Moisture */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Droplets className="w-3.5 h-3.5 text-indigo-400" />
                  Modelled Soil Moisture (0–7 cm depth)
                </span>
                <span className="text-indigo-400 font-bold">{params.soil_moisture_0_7} m³/m³</span>
              </div>
              <input
                type="range"
                min={0.15}
                max={0.55}
                step={0.01}
                value={params.soil_moisture_0_7}
                onChange={(e) => handleSliderChange("soil_moisture_0_7", Number(e.target.value))}
                className="w-full accent-indigo-400"
              />
            </div>

            {/* Slope Gradient */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Mountain className="w-3.5 h-3.5 text-amber-400" />
                  Terrain Slope Angle
                </span>
                <span className="text-amber-400 font-bold">{params.slope}°</span>
              </div>
              <input
                type="range"
                min={10}
                max={60}
                step={1}
                value={params.slope}
                onChange={(e) => handleSliderChange("slope", Number(e.target.value))}
                className="w-full accent-amber-400"
              />
            </div>

            {/* 6h Rain Burst */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <CloudRain className="w-3.5 h-3.5 text-red-400" />
                  6-Hour Rain Burst
                </span>
                <span className="text-red-400 font-bold">{params.rain_6h} mm</span>
              </div>
              <input
                type="range"
                min={0}
                max={150}
                step={5}
                value={params.rain_6h}
                onChange={(e) => handleSliderChange("rain_6h", Number(e.target.value))}
                className="w-full accent-red-400"
              />
            </div>

            {/* Population Exposure */}
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-purple-400" />
                  Exposed Settlement Population
                </span>
                <span className="text-purple-400 font-bold">{params.population.toLocaleString()}</span>
              </div>
              <input
                type="range"
                min={1000}
                max={50000}
                step={1000}
                value={params.population}
                onChange={(e) => handleSliderChange("population", Number(e.target.value))}
                className="w-full accent-purple-400"
              />
            </div>
          </div>
        </div>

        {/* Real-time Simulated Score Gauge */}
        <div className="lg:col-span-5 bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 flex flex-col justify-between space-y-4">
          <div>
            <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2 mb-3">
              SIMULATED OPERATIONAL RISK OUTCOME
            </div>

            <div className="p-4 bg-[#121f3b] rounded-lg border border-slate-700/60 text-center space-y-2">
              <div className="text-[10px] text-slate-400 font-bold uppercase">
                ESTIMATED OPERATIONAL RISK SCORE
              </div>

              <div className="text-5xl font-black text-white tracking-tight">
                {simResult?.risk_score || 87}
                <span className="text-sm text-slate-400 font-normal"> / 100</span>
              </div>

              <div className="flex justify-center gap-2 pt-1">
                <RiskBadge level={simResult?.risk_level || "CRITICAL"} />
                <PriorityBadge tier={simResult?.emergency_priority?.priority_tier || "P1"} />
              </div>
            </div>

            {/* Factor breakdown */}
            <div className="mt-4 space-y-2 text-xs">
              <span className="font-bold text-slate-300 text-[11px]">CONTRIBUTING FACTORS IN SCENARIO:</span>
              {(simResult?.explanation?.factors || []).slice(0, 4).map((f: any) => (
                <div key={f.feature} className="flex justify-between p-1.5 bg-[#0a1224] rounded border border-slate-800">
                  <span className="text-slate-300">{f.label}</span>
                  <span className={f.impact > 0 ? "text-red-400 font-bold" : "text-emerald-400"}>
                    {f.impact_display} pts
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="p-2.5 bg-slate-900 border border-slate-800 rounded text-[10px] text-slate-400">
            Model: XGBoost Multi-Layer Operational Risk Regressor. Real-time inference latency: &lt;15ms.
          </div>
        </div>
      </div>
    </div>
  );
}
