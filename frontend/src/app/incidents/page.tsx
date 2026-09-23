"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Flame, 
  PlusCircle, 
  MapPin, 
  Truck, 
  Clock, 
  User, 
  Filter,
  CheckCircle2,
  AlertTriangle,
  Camera
} from "lucide-react";
import { api } from "@/lib/api";
import { FieldIncident } from "@/types";
import { RiskBadge } from "@/components/common/StatusBadges";

function resolveMediaUrl(url?: string | null): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:") || url.startsWith("blob:")) {
    return url;
  }
  if (url.startsWith("/uploads/") || url.startsWith("/api/uploads/")) {
    const backendBase = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").replace(/\/api$/, "");
    return `${backendBase}${url.startsWith("/api/uploads/") ? url.replace("/api", "") : url}`;
  }
  return url;
}

export default function IncidentsPage() {
  const [incidents, setIncidents] = useState<FieldIncident[]>([]);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);
  const [brokenMedia, setBrokenMedia] = useState<Record<string, boolean>>({});
  const [selectedIncident, setSelectedIncident] = useState<FieldIncident | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getIncidents();
        setIncidents(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const categories = ["ALL", "ROAD_BLOCKAGE", "LANDSLIDE", "CRACK", "ROCKFALL"];

  const filtered = incidents.filter((inc) => {
    if (filterType === "ALL") return true;
    return inc.type === filterType;
  });

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-400" />
            GROUND INCIDENT REPORTS & FIELD LOGISTICS
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Verified ground reports from District Disaster Officers, BRO, and local field wardens
          </p>
        </div>

        <Link
          href="/incidents/report"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition-colors shadow-md shadow-sky-950 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>REPORT FIELD INCIDENT</span>
        </Link>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilterType(c)}
            className={`px-3 py-1 rounded text-xs border transition-colors ${
              filterType === c
                ? "bg-sky-950 text-sky-300 border-sky-600 font-bold"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            {c.replace("_", " ")}
          </button>
        ))}
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((inc) => (
          <div
            key={inc.id}
            className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col justify-between hover:border-slate-600 transition-all space-y-3 shadow-lg"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-sky-400">{inc.id}</span>
                <RiskBadge level={inc.severity} />
              </div>

              <div className="text-sm font-bold text-white mb-1">{inc.category}</div>
              <p className="text-xs text-slate-300 leading-relaxed line-clamp-3">
                {inc.description}
              </p>

              {inc.photo_url && (
                <div className="mt-2.5 overflow-hidden rounded border border-slate-700 bg-slate-950/80">
                  {brokenMedia[inc.id] ? (
                    <div className="w-full h-28 flex flex-col items-center justify-center bg-slate-900/60 text-slate-500 text-xs gap-1.5 p-2">
                      <Camera className="w-5 h-5 text-slate-500" />
                      <span className="text-[11px] font-mono text-slate-400">Field photo evidence attached</span>
                    </div>
                  ) : inc.photo_url.toLowerCase().endsWith(".mp4") || inc.photo_url.toLowerCase().includes("video") ? (
                    <video
                      src={resolveMediaUrl(inc.photo_url)}
                      controls
                      className="w-full h-32 object-cover bg-black cursor-pointer"
                      onClick={() => setSelectedIncident(inc)}
                      onError={() => setBrokenMedia((prev) => ({ ...prev, [inc.id]: true }))}
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(inc.photo_url)}
                      alt="Incident media"
                      className="w-full h-32 object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                      onClick={() => setSelectedIncident(inc)}
                      onError={() => setBrokenMedia((prev) => ({ ...prev, [inc.id]: true }))}
                    />
                  )}
                </div>
              )}

              {inc.road_blocked && (
                <div className="mt-2.5 px-2 py-1 bg-red-950/40 border border-red-800/60 rounded flex items-center gap-1.5 text-xs text-red-400 font-bold">
                  <Truck className="w-3.5 h-3.5 shrink-0" />
                  <span>ROAD BLOCKED: {inc.road_name || "Arterial Highway"}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{inc.district}, {inc.state}</span>
                </span>
                <span className="text-[10px] text-slate-500">
                  {inc.location.latitude.toFixed(2)}°N, {inc.location.longitude.toFixed(2)}°E
                </span>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="flex items-center gap-1 text-slate-400 truncate">
                  <User className="w-3 h-3 text-slate-500 shrink-0" />
                  <span>{inc.reporter_name || "Field Officer"}</span>
                </span>
                <span className="text-slate-500">
                  {new Date(inc.reported_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedIncident && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setSelectedIncident(null)}
        >
          <div
            className="relative w-full max-w-5xl max-h-[90vh] overflow-hidden rounded-xl border border-slate-700 bg-[#0b1329] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedIncident(null)}
              className="absolute right-3 top-3 z-10 rounded-full bg-slate-900/80 border border-slate-700 px-2 py-1 text-xs font-bold text-white hover:bg-slate-800"
            >
              CLOSE
            </button>

            <div className="grid lg:grid-cols-[1.4fr_0.8fr] max-h-[90vh] overflow-hidden">
              <div className="bg-black flex items-center justify-center min-h-[300px]">
                {selectedIncident.photo_url &&
                  (selectedIncident.photo_url.toLowerCase().endsWith(".mp4") || selectedIncident.photo_url.toLowerCase().includes("video") ? (
                    <video
                      src={resolveMediaUrl(selectedIncident.photo_url)}
                      controls
                      autoPlay
                      className="w-full h-full max-h-[90vh] object-contain bg-black"
                    />
                  ) : (
                    <img
                      src={resolveMediaUrl(selectedIncident.photo_url)}
                      alt="Full incident media"
                      className="w-full h-full max-h-[90vh] object-contain"
                    />
                  ))}
              </div>

              <div className="p-5 space-y-4 overflow-y-auto">
                <div>
                  <div className="text-[10px] uppercase text-sky-400 font-bold tracking-wider">Incident</div>
                  <div className="mt-1 text-xl font-black text-white">{selectedIncident.id}</div>
                  <div className="mt-1 text-sm font-bold text-slate-200">{selectedIncident.category}</div>
                </div>

                <div className="border-b border-slate-800 pb-3">
                  <div className="text-[10px] uppercase text-slate-400">Severity</div>
                  <div className="mt-1"><RiskBadge level={selectedIncident.severity} /></div>
                </div>

                <div className="space-y-2 text-[11px] text-slate-300">
                  <div className="flex justify-between gap-3"><span className="text-slate-400">District</span><span>{selectedIncident.district}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">State</span><span>{selectedIncident.state}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Reporter</span><span>{selectedIncident.reporter_name || "Field Officer"}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Coordinates</span><span>{selectedIncident.location.latitude.toFixed(2)}, {selectedIncident.location.longitude.toFixed(2)}</span></div>
                  <div className="flex justify-between gap-3"><span className="text-slate-400">Road blocked</span><span>{selectedIncident.road_blocked ? "YES" : "NO"}</span></div>
                </div>

                <div className="rounded border border-slate-800 bg-[#111c33] p-3">
                  <div className="text-[10px] uppercase text-slate-400 mb-1">Description</div>
                  <p className="text-xs leading-relaxed text-slate-200">{selectedIncident.description}</p>
                </div>

                {selectedIncident.road_name && (
                  <div className="rounded border border-red-800/40 bg-red-950/20 p-3 text-[11px] text-red-200">
                    <div className="text-[10px] uppercase text-red-300">Road / Access</div>
                    <div className="mt-1 font-bold">{selectedIncident.road_name}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
