import React from "react";
import { 
  Map, 
  AlertTriangle, 
  BellRing, 
  Truck, 
  Users, 
  Flame 
} from "lucide-react";

interface MetricRowProps {
  metrics: {
    monitored_zones: number;
    critical_zones: number;
    active_alerts: number;
    blocked_roads: number;
    population_at_risk: number;
  };
  demoMode?: boolean;
}

export function MetricRow({ metrics, demoMode = false }: MetricRowProps) {
  const cards = [
    {
      title: "MONITORED ZONES",
      value: metrics.monitored_zones?.toLocaleString() || "1,284",
      sub: "8 NER States + Corridors",
      icon: Map,
      color: "text-sky-400",
      bg: "bg-sky-950/30 border-sky-800/40",
    },
    {
      title: "CRITICAL ZONES",
      value: metrics.critical_zones?.toLocaleString() || "47",
      sub: "Risk Score >= 76",
      icon: AlertTriangle,
      color: "text-red-400",
      bg: "bg-red-950/40 border-red-800/60 shadow-lg shadow-red-950/30",
      isPulsing: true,
    },
    {
      title: "ACTIVE ALERTS",
      value: metrics.active_alerts?.toLocaleString() || "18",
      sub: "SMS & Web Broadcasts",
      icon: BellRing,
      color: "text-orange-400",
      bg: "bg-orange-950/30 border-orange-800/40",
    },
    {
      title: "BLOCKED ROADS",
      value: metrics.blocked_roads?.toLocaleString() || "12",
      sub: "Lifeline Corridors (NH-10)",
      icon: Truck,
      color: "text-amber-400",
      bg: "bg-amber-950/30 border-amber-800/40",
    },
    {
      title: "POPULATION AT RISK",
      value: metrics.population_at_risk?.toLocaleString() || "84,210",
      sub: "Immediate Vulnerability",
      icon: Users,
      color: "text-purple-400",
      bg: "bg-purple-950/30 border-purple-800/40",
    },
  ];

  return (
    <div className="space-y-1.5">
      {demoMode && (
        <div className="flex items-center justify-between px-3 py-1 bg-amber-950/40 border border-amber-800/50 rounded text-amber-300 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            OPERATIONAL DEMO MODE ACTIVE
          </span>
          <span className="text-slate-400">Illustrative telemetry grounded in real ISRO & Open-Meteo baseline</span>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className={`p-3 rounded-lg border backdrop-blur flex flex-col justify-between transition-all hover:translate-y-[-2px] ${c.bg}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-wider text-slate-400 uppercase">
                  {c.title}
                </span>
                <Icon className={`w-4 h-4 ${c.color} ${c.isPulsing ? "animate-pulse" : ""}`} />
              </div>
              <div className="my-1.5">
                <div className={`text-2xl font-black font-mono tracking-tight ${c.color}`}>
                  {c.value}
                </div>
              </div>
              <div className="text-[10px] font-mono text-slate-400 truncate">{c.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
