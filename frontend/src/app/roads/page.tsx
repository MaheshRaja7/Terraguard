"use client";

import React, { useState, useEffect } from "react";
import { 
  Truck, 
  AlertTriangle, 
  Route, 
  CheckCircle2, 
  Clock, 
  ShieldAlert,
  ArrowRight
} from "lucide-react";
import { api } from "@/lib/api";
import { RoadCorridor } from "@/types";
import { RiskBadge } from "@/components/common/StatusBadges";

export default function RoadsPage() {
  const [roads, setRoads] = useState<RoadCorridor[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRoads = async () => {
    try {
      setLoading(true);
      const res = await api.getRoads();
      setRoads(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoads();
  }, []);

  const handleStatusChange = async (roadId: string, newStatus: string) => {
    try {
      await api.updateRoad(roadId, newStatus);
      loadRoads();
    } catch (err) {
      console.error("Failed updating road:", err);
    }
  };

  const statusStyles: Record<string, string> = {
    OPEN: "bg-emerald-950/60 text-emerald-400 border-emerald-700",
    PARTIAL: "bg-amber-950/60 text-amber-400 border-amber-700",
    BLOCKED: "bg-red-950/80 text-red-400 border-red-700 animate-pulse",
    CRITICAL: "bg-red-950 text-red-300 border-red-600 font-black",
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header Banner */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Truck className="w-4 h-4 text-amber-400" />
            STRATEGIC HIGHWAY & LIFELINE CORRIDOR MONITORING
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time transit viability for NH-10, NH-29, NH-37 and regional supply corridors
          </p>
        </div>
        <div className="text-xs text-slate-300 flex items-center gap-2">
          <span>Total Highways Monitored:</span>
          <span className="font-bold text-white px-2 py-0.5 bg-slate-800 rounded">{roads.length}</span>
        </div>
      </div>

      {/* Roads Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {roads.map((road) => {
          const isBlocked = road.status === "BLOCKED";
          return (
            <div
              key={road.id}
              className={`p-4 rounded-lg border flex flex-col justify-between transition-all ${
                isBlocked
                  ? "bg-red-950/20 border-red-800/80 shadow-lg shadow-red-950/30"
                  : "bg-[#0e172a] border-slate-800"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-sky-400">{road.id}</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-bold border ${statusStyles[road.status]}`}>
                    {road.status}
                  </span>
                </div>

                <div className="text-sm font-bold text-white mb-1">{road.name}</div>
                <div className="text-xs text-slate-400 mb-2.5">
                  {road.district} ({road.state}) • Length: {road.length_km} km
                </div>

                {/* Blockage details if applicable */}
                <div className="space-y-1.5 text-xs text-slate-300 p-2.5 bg-[#121f3b] rounded border border-slate-800">
                  <div className="flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">CURRENT OBSTRUCTION:</span>
                      <span>{road.blockage_location || "Clear passage"}</span>
                    </div>
                  </div>

                  <div className="flex items-start gap-1.5 pt-1.5 border-t border-slate-800">
                    <Route className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-slate-400 block text-[10px]">RECOMMENDED DETOUR / BYPASS:</span>
                      <span className="text-sky-300">{road.alternative_route}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Status Update Quick Controls */}
              <div className="pt-3 mt-3 border-t border-slate-800/80">
                <div className="text-[10px] text-slate-400 mb-1.5">OFFICER STATUS OVERRIDE:</div>
                <div className="flex gap-1">
                  {["OPEN", "PARTIAL", "BLOCKED"].map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(road.id, st)}
                      className={`flex-1 py-1 text-[10px] font-bold rounded border transition-colors ${
                        road.status === st
                          ? "bg-slate-700 text-white border-slate-500"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
