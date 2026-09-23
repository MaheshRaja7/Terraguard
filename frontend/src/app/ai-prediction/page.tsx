"use client";

import React, { useState, useEffect } from "react";
import { 
  Cpu, 
  Activity, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  HelpCircle,
  CheckCircle2,
  Sliders
} from "lucide-react";
import { api } from "@/lib/api";
import { ZoneFeature, ZoneRiskEvaluation } from "@/types";
import { RiskBadge, PriorityBadge, SourceBadge } from "@/components/common/StatusBadges";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  CartesianGrid 
} from "recharts";

export default function AIPredictionPage() {
  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState("TG-018");
  const [evaluation, setEvaluation] = useState<ZoneRiskEvaluation | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        const res = await api.getZones();
        if (res?.features) {
          setZones(res.features);
        }
      } catch (e) {
        console.error(e);
      }
    }
    init();
  }, []);

  useEffect(() => {
    async function loadRisk() {
      if (!selectedZoneId) return;
      try {
        setLoading(true);
        const res = await api.getZoneRisk(selectedZoneId);
        setEvaluation(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadRisk();
  }, [selectedZoneId]);

  const trendData = evaluation?.trend?.series || [
    { time: "08:00", score: 42 },
    { time: "10:00", score: 58 },
    { time: "12:00", score: 71 },
    { time: "14:00", score: 87 },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header Banner */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-red-400" />
            THREE-LAYER AI RISK ENGINE & SHAP EXPLAINABILITY
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            XGBoost Multi-Objective Prediction Engine with TreeSHAP Feature Attribution
          </p>
        </div>

        {/* Zone Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-bold">SELECT ZONE:</span>
          <select
            value={selectedZoneId}
            onChange={(e) => setSelectedZoneId(e.target.value)}
            className="bg-[#121f3b] border border-slate-700 text-white text-xs px-2.5 py-1 rounded outline-none"
          >
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.id}: {z.properties.name} ({z.properties.district})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Score & Architecture Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 3-Layer Concept Cards */}
        <div className="lg:col-span-4 space-y-3">
          <div className="p-3 bg-[#0e172a] border border-sky-900/40 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-sky-400 uppercase">LAYER 1: SUSCEPTIBILITY</span>
              <span className="text-xs font-bold text-sky-300">
                {evaluation?.layers?.susceptibility?.score || 72}/100
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Slope Gradient:</span>
                <span>{evaluation?.layers?.susceptibility?.slope || 38.4}°</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Elevation:</span>
                <span>{evaluation?.layers?.susceptibility?.elevation || 1650}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Historical Slide Density:</span>
                <span className="text-red-400">{evaluation?.layers?.susceptibility?.historical_landslides || 48}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Geological Weathering:</span>
                <span className="truncate max-w-[150px]">{evaluation?.layers?.susceptibility?.geology || "Daling Phyllite"}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0e172a] border border-red-900/40 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-red-400 uppercase">LAYER 2: TRIGGER RISK</span>
              <span className="text-xs font-bold text-red-300">
                {evaluation?.layers?.trigger?.score || 84}/100
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Cumulative Rain (24h):</span>
                <span className="text-red-400 font-bold">{evaluation?.layers?.trigger?.rain_24h || 120} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Precipitation (6h):</span>
                <span>{evaluation?.layers?.trigger?.rain_6h || 45} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Modelled Soil Moisture:</span>
                <span className="text-amber-400 font-bold">{evaluation?.layers?.trigger?.soil_moisture_0_7 || 0.48} m³/m³</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Soil Saturation Status:</span>
                <span className="text-red-400">{evaluation?.layers?.trigger?.soil_moisture_status || "SATURATION RISING"}</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-[#0e172a] border border-amber-900/40 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 uppercase">LAYER 3: EXPOSURE & IMPACT</span>
              <span className="text-xs font-bold text-amber-300">
                {evaluation?.layers?.exposure?.score || 65}/100
              </span>
            </div>
            <div className="text-[11px] text-slate-300 mt-2 space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-400">Population at Risk:</span>
                <span>{evaluation?.layers?.exposure?.population_at_risk?.toLocaleString() || "24,500"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Lifeline Highway:</span>
                <span className="text-amber-300 font-bold truncate max-w-[150px]">{evaluation?.layers?.exposure?.road_exposure || "NH-10 Corridor"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Emergency Priority:</span>
                <PriorityBadge tier={evaluation?.priority?.priority_tier || "P1"} />
              </div>
            </div>
          </div>
        </div>

        {/* Center/Right: Risk Trend & SHAP Factors */}
        <div className="lg:col-span-8 space-y-4">
          {/* Trend Chart */}
          <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div>
                <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-red-400" />
                  RISK ACCELERATION TIME-SERIES (LAST 6 HOURS)
                </span>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  Illustrates progression: 42 (Moderate) → 58 (High) → 71 (High) → 87 (Critical)
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-red-400">
                  {evaluation?.trend?.change_6h || "+45"} points
                </span>
                <div className="text-[10px] text-slate-400">RAPID ELEVATION</div>
              </div>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                  <RechartsTooltip contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", fontSize: 12 }} />
                  <Line type="monotone" dataKey="score" stroke="#ef4444" strokeWidth={3} dot={{ fill: "#ef4444", r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SHAP Explainability Waterfall */}
          <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <div className="text-xs font-bold text-white uppercase">
                TREE-SHAP FEATURE ATTRIBUTION ANALYSIS
              </div>
              <span className="text-[10px] text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-950 border border-sky-800">
                {evaluation?.explanation?.attribution_type || "SHAP Model Explanation"}
              </span>
            </div>

            <div className="space-y-2.5">
              {(evaluation?.explanation?.factors || []).map((f) => (
                <div key={f.feature} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-200">{f.label}</span>
                    <span className={f.impact > 0 ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                      {f.impact_display} risk points
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden flex">
                    <div
                      className={`h-full rounded-full ${
                        f.impact > 0 ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${Math.min(100, Math.abs(f.impact) * 4)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 mt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
              <span>Baseline Expected Value: {evaluation?.explanation?.base_value || 42.0}</span>
              <span>Model: XGBoost v1.0 (Serialized Joblib)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
