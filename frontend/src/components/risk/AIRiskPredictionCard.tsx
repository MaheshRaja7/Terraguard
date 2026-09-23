"use client";

import React from "react";
import { 
  TrendingUp, 
  AlertOctagon, 
  HelpCircle, 
  Activity, 
  Info,
  Layers,
  ArrowUpRight
} from "lucide-react";
import { ZoneRiskEvaluation, ZoneFeature } from "@/types";
import { RiskBadge, PriorityBadge, SourceBadge, FreshnessBadge } from "@/components/common/StatusBadges";

interface AIRiskPredictionCardProps {
  evaluation: ZoneRiskEvaluation | null;
  loading?: boolean;
  zones?: ZoneFeature[];
  onSelectZoneId?: (zoneId: string) => void;
}

export function AIRiskPredictionCard({ 
  evaluation, 
  loading = false,
  zones,
  onSelectZoneId,
}: AIRiskPredictionCardProps) {
  if (loading || !evaluation) {
    return (
      <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-5 flex flex-col items-center justify-center min-h-[480px] font-mono text-xs text-slate-400 gap-3">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
        <span>COMPUTING THREE-LAYER AI RISK & SHAP ATTRIBUTION...</span>
      </div>
    );
  }

  const {
    zone_id,
    zone_name,
    district,
    state,
    risk_score,
    risk_level,
    risk_probability,
    priority,
    explanation,
    trend,
    layers,
    data_freshness,
  } = evaluation;

  // Max impact for factor bar scaling
  const maxImpact = Math.max(...(explanation?.factors || []).map((f) => Math.abs(f.impact)), 15.0);

  return (
    <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 flex flex-col justify-between shadow-xl">
      {/* Card Header */}
      <div>
        <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
              AI RISK PREDICTION
            </span>
          </div>
          <FreshnessBadge freshness={data_freshness} />
        </div>

        {/* Zone Identity & Quick Switcher */}
        <div className="mb-3">
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-sm font-extrabold text-white tracking-wide truncate">
              {zone_name}
            </span>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-xs font-mono text-sky-400 font-bold">{zone_id}</span>
              {zones && onSelectZoneId && zones.length > 0 && (
                <select
                  value={zone_id}
                  onChange={(e) => onSelectZoneId(e.target.value)}
                  className="bg-[#121f3b] border border-slate-700 text-sky-300 text-[11px] font-mono px-1.5 py-0.5 rounded outline-none cursor-pointer hover:border-sky-500 transition-colors"
                  title="Select a different hazard zone to re-evaluate"
                >
                  {zones.map((z) => (
                    <option key={z.id} value={z.id} className="bg-[#0b1329] text-white">
                      {z.id} - {z.properties.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
          <div className="text-xs text-slate-400 font-mono mt-0.5">
            {district}, {state}
          </div>
        </div>

        {/* Main Score Hero */}
        <div className="bg-[#121f38] border border-[#213761] rounded-lg p-3.5 mb-3 flex items-center justify-between">
          <div>
            <div className="text-[10px] font-mono text-slate-400 uppercase font-semibold">
              OPERATIONAL RISK SCORE
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-4xl font-black font-mono tracking-tight text-red-400">
                {risk_score}
              </span>
              <span className="text-xs font-mono text-slate-400">/ 100</span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <RiskBadge level={risk_level} />
              <PriorityBadge tier={priority?.priority_tier || "P1"} />
            </div>
          </div>

          <div className="text-right font-mono">
            <div className="text-[10px] text-slate-400 uppercase">RISK PROBABILITY</div>
            <div className="text-xl font-bold text-slate-100">
              {Math.round(risk_probability * 100)}%
            </div>
            <div className="flex items-center justify-end gap-1 text-xs text-red-400 mt-1 font-semibold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{trend?.change_6h} in 6h</span>
            </div>
          </div>
        </div>

        {/* Three Layer Breakdown summary */}
        <div className="grid grid-cols-3 gap-1.5 text-center font-mono text-xs mb-3">
          <div className="p-1.5 bg-[#14223d] rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">LAYER 1 (SUSC)</div>
            <div className="font-bold text-sky-300">{layers?.susceptibility?.score || 72}/100</div>
          </div>
          <div className="p-1.5 bg-[#14223d] rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">LAYER 2 (TRIG)</div>
            <div className="font-bold text-red-400">{layers?.trigger?.score || 84}/100</div>
          </div>
          <div className="p-1.5 bg-[#14223d] rounded border border-slate-800">
            <div className="text-[10px] text-slate-400">LAYER 3 (EXP)</div>
            <div className="font-bold text-amber-300">{layers?.exposure?.score || 65}/100</div>
          </div>
        </div>

        {/* Explainability Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <span>WHY IS THIS ZONE AT RISK?</span>
            </span>
            <span className="text-[10px] text-sky-400 font-semibold uppercase">
              {explanation?.attribution_type || "SHAP Model Explanation"}
            </span>
          </div>

          <div className="space-y-2">
            {(explanation?.factors || []).slice(0, 5).map((f) => {
              const widthPct = Math.min(100, Math.round((Math.abs(f.impact) / maxImpact) * 100));
              const isIncrease = f.impact > 0;
              return (
                <div key={f.feature} className="text-xs font-mono">
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-slate-300 truncate max-w-[200px]">{f.label}</span>
                    <span className={isIncrease ? "text-red-400 font-bold" : "text-emerald-400 font-bold"}>
                      {f.impact_display} pts
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        isIncrease ? "bg-red-500" : "bg-emerald-500"
                      }`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Card Footer / Scientific Integrity Note */}
      <div className="pt-3 mt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
        <span>Scientific Model: XGBoost + SHAP</span>
        <span className="text-slate-400">No Hardware Sensor Required</span>
      </div>
    </div>
  );
}
