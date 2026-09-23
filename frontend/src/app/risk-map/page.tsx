"use client";

import React, { useState, useEffect } from "react";
import { RiskMap } from "@/components/map/RiskMap";
import { ZoneDetailDrawer } from "@/components/map/ZoneDetailDrawer";
import { api } from "@/lib/api";
import { ZoneFeature, RoadCorridor } from "@/types";
import { RiskBadge, SourceBadge } from "@/components/common/StatusBadges";
import { Search, Filter, Mountain, AlertTriangle, Layers } from "lucide-react";

export default function RiskMapPage() {
  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [roads, setRoads] = useState<RoadCorridor[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneFeature | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedState, setSelectedState] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const [zonesRes, roadsRes] = await Promise.all([
          api.getZones(),
          api.getRoads(),
        ]);
        if (zonesRes?.features) setZones(zonesRes.features);
        if (roadsRes) setRoads(roadsRes);
      } catch (e) {
        console.error("Map page fetch error", e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const states = ["ALL", "Sikkim", "Meghalaya", "Nagaland", "Assam", "Arunachal Pradesh", "Manipur", "Mizoram", "Tripura", "West Bengal"];

  const filteredZones = zones.filter((z) => {
    const p = z.properties;
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesState = selectedState === "ALL" || p.state.toLowerCase().includes(selectedState.toLowerCase());
    return matchesSearch && matchesState;
  });

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg font-mono">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Mountain className="w-4 h-4 text-sky-400" />
            NORTH EASTERN REGION GIS RISK & HAZARD MAPPING
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            CartoDB Dark Tile Engine with ISRO / NRSC Landslide Inventory & Real-Time Open-Meteo Triggers
          </p>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge type="HISTORICAL" label="ISRO Atlas 2023" />
          <SourceBadge type="MODELLED" label="Open-Meteo" />
        </div>
      </div>

      {/* Main Map + Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Left Filter & Zone Selector Sidebar */}
        <div className="lg:col-span-4 bg-[#0e172a] border border-[#1e3156] rounded-lg p-3 space-y-3 font-mono">
          <div className="flex items-center gap-2 bg-[#121f3b] px-2.5 py-1.5 rounded border border-slate-700 text-xs">
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search zone, district, road..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-transparent text-white w-full outline-none placeholder:text-slate-500 text-xs"
            />
          </div>

          {/* State filter buttons */}
          <div className="space-y-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">FILTER BY REGION:</div>
            <div className="flex flex-wrap gap-1">
              {states.slice(0, 6).map((st) => (
                <button
                  key={st}
                  onClick={() => setSelectedState(st)}
                  className={`px-2 py-0.5 rounded text-[10px] border transition-colors ${
                    selectedState === st
                      ? "bg-sky-600 text-white border-sky-400"
                      : "bg-slate-800 text-slate-400 border-slate-700 hover:text-slate-200"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* List of Zones */}
          <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
            <div className="text-[10px] text-slate-400 font-bold uppercase">
              HAZARD SECTORS ({filteredZones.length})
            </div>
            {filteredZones.map((zone) => {
              const p = zone.properties;
              const isSelected = selectedZone?.id === zone.id;
              const level =
                p.baseline_susceptibility >= 76 ? "CRITICAL" :
                p.baseline_susceptibility >= 51 ? "HIGH" :
                p.baseline_susceptibility >= 26 ? "MODERATE" : "LOW";

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  className={`p-2.5 rounded border cursor-pointer transition-all text-xs ${
                    isSelected
                      ? "bg-sky-950/40 border-sky-500 shadow-md shadow-sky-950"
                      : "bg-[#111c33] border-slate-800 hover:bg-[#152340]"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white tracking-wide">{p.id}: {p.name}</span>
                    <RiskBadge level={level} score={p.baseline_susceptibility} />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                    <span>{p.district}, {p.state}</span>
                    <span className="text-sky-400 font-semibold">{p.road_exposure.split(" ")[0]}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Map Canvas */}
        <div className="lg:col-span-8 relative">
          <RiskMap
            zones={filteredZones}
            selectedZoneId={selectedZone?.id}
            onSelectZone={(z: ZoneFeature) => setSelectedZone(z)}
            roads={roads}
            height="620px"
          />
          {selectedZone && (
            <ZoneDetailDrawer zone={selectedZone} onClose={() => setSelectedZone(null)} />
          )}
        </div>
      </div>
    </div>
  );
}
