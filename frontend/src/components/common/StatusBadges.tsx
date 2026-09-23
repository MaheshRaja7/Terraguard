import React from "react";
import { ThreatLevel } from "@/types";

export function RiskBadge({ level, score }: { level: ThreatLevel; score?: number }) {
  const styles: Record<ThreatLevel, string> = {
    LOW: "bg-emerald-950/80 text-emerald-400 border-emerald-700/60",
    MODERATE: "bg-amber-950/80 text-amber-400 border-amber-700/60",
    HIGH: "bg-orange-950/80 text-orange-400 border-orange-700/60",
    CRITICAL: "bg-red-950/80 text-red-400 border-red-700/60 animate-pulse",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-mono font-bold tracking-wider uppercase border ${
        styles[level] || styles.LOW
      }`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {level}
      {score !== undefined && <span className="opacity-80">({score})</span>}
    </span>
  );
}

export function PriorityBadge({ tier }: { tier: "P1" | "P2" | "P3" | string }) {
  const styles: Record<string, string> = {
    P1: "bg-red-600/20 text-red-400 border-red-500 font-bold",
    P2: "bg-amber-600/20 text-amber-400 border-amber-500",
    P3: "bg-blue-600/20 text-blue-400 border-blue-500",
  };

  return (
    <span
      className={`px-2 py-0.5 rounded text-xs font-mono uppercase tracking-wide border ${
        styles[tier] || styles.P3
      }`}
    >
      {tier}
    </span>
  );
}

export function SourceBadge({
  type,
  label,
}: {
  type: "OBSERVED" | "MODELLED" | "HISTORICAL" | "SIMULATED" | "CACHED";
  label?: string;
}) {
  const styles: Record<string, string> = {
    OBSERVED: "bg-sky-950/60 text-sky-400 border-sky-800/50",
    MODELLED: "bg-indigo-950/60 text-indigo-300 border-indigo-800/50",
    HISTORICAL: "bg-slate-800 text-slate-300 border-slate-700",
    SIMULATED: "bg-purple-950/60 text-purple-300 border-purple-800/50",
    CACHED: "bg-amber-950/60 text-amber-300 border-amber-800/50",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-mono uppercase border ${
        styles[type] || styles.OBSERVED
      }`}
      title={type === "MODELLED" ? "Modelled atmospheric simulation, not physical sensor hardware" : type}
    >
      {label || type}
    </span>
  );
}

export function FreshnessBadge({ freshness }: { freshness: string }) {
  const isLive = freshness === "LIVE";
  const isStale = freshness === "STALE";

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-mono px-2 py-0.5 rounded border ${
        isLive
          ? "bg-emerald-950/50 text-emerald-400 border-emerald-800/50"
          : isStale
          ? "bg-red-950/50 text-red-400 border-red-800/50"
          : "bg-amber-950/50 text-amber-400 border-amber-800/50"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          isLive ? "bg-emerald-400 animate-ping" : isStale ? "bg-red-400" : "bg-amber-400"
        }`}
      />
      {freshness}
    </span>
  );
}
