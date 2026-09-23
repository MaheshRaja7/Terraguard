import React from "react";
import { 
  Clock, 
  AlertCircle, 
  ShieldAlert, 
  Truck, 
  Users, 
  Radio, 
  CheckCircle2, 
  Flame 
} from "lucide-react";
import { TimelineItem, PriorityQueueItem } from "@/types";
import { PriorityBadge } from "@/components/common/StatusBadges";

interface TimelineQueueRowProps {
  timeline: TimelineItem[];
  priorityQueue: PriorityQueueItem[];
  onSelectZone?: (zoneId: string) => void;
}

export function TimelineQueueRow({ timeline, priorityQueue, onSelectZone }: TimelineQueueRowProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Column 1: Live Incident Timeline */}
      <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-sky-400" />
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                LIVE INCIDENT TIMELINE
              </span>
            </div>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              EVENT LOG ACTIVE
            </span>
          </div>

          <div className="relative pl-4 space-y-3.5 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-800">
            {timeline.slice(0, 6).map((item, idx) => (
              <div 
                key={item.id || idx} 
                onClick={() => item.zoneId && onSelectZone && onSelectZone(item.zoneId)}
                className={`relative text-xs font-mono transition-colors ${item.zoneId ? "cursor-pointer hover:bg-[#121f3b] p-1.5 -ml-1.5 rounded" : ""}`}
                title={item.zoneId ? `Click to inspect zone ${item.zoneId}` : undefined}
              >
                <div className="absolute -left-[19px] top-2 w-2.5 h-2.5 rounded-full bg-slate-900 border-2 border-sky-400" />
                <div className="flex items-baseline justify-between">
                  <span className="font-bold text-slate-200">{item.title}</span>
                  <span className="text-[10px] text-slate-400 shrink-0 ml-2">{item.timestamp}</span>
                </div>
                {item.zoneId && (
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Sector: <span className="text-sky-400 font-bold">{item.zoneId}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 mt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400">
          Real backend timestamps in live operations • Click any incident to focus zone
        </div>
      </div>

      {/* Column 2: Emergency Priority Engine Queue */}
      <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 flex flex-col justify-between shadow-xl">
        <div>
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-400" />
              <span className="font-mono text-xs font-bold text-slate-300 uppercase tracking-wider">
                EMERGENCY PRIORITY QUEUE
              </span>
            </div>
            <span className="text-[10px] font-mono text-slate-400 uppercase">
              FORMULA: RISK × EXPOSURE × INFRASTRUCTURE
            </span>
          </div>

          <div className="space-y-2 font-mono">
            {priorityQueue.map((item) => {
              const isP1 = item.tier === "P1";
              return (
                <div
                  key={item.zoneId}
                  onClick={() => onSelectZone && onSelectZone(item.zoneId)}
                  className={`p-2.5 rounded border transition-all cursor-pointer ${
                    isP1
                      ? "bg-red-950/20 border-red-800/40 hover:border-red-500 hover:bg-red-950/40 shadow-sm shadow-red-950"
                      : item.tier === "P2"
                      ? "bg-amber-950/15 border-amber-800/30 hover:border-amber-500 hover:bg-amber-950/30"
                      : "bg-slate-900 border-slate-800 hover:border-slate-600 hover:bg-[#121f3b]"
                  }`}
                  title={`Click to focus map and view AI prediction for ${item.zoneId}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <PriorityBadge tier={item.tier} />
                      <span className="text-xs font-bold text-white tracking-wide">
                        {item.zoneId}: {item.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-red-400">
                      Risk {item.risk}/100
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-1.5 text-[11px] text-slate-400">
                    <div className="flex items-center gap-1.5 truncate">
                      <Users className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>Pop: {item.population.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1.5 truncate text-slate-300">
                      <Truck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      <span className="truncate">{item.exposure}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-2 mt-3 border-t border-slate-800 text-[10px] font-mono text-slate-400 flex items-center justify-between">
          <span>Priority Tiers: P1 (Critical) | P2 (High) | P3 (Moderate)</span>
          <span className="text-emerald-400">Automated Dispatch Ready</span>
        </div>
      </div>
    </div>
  );
}
