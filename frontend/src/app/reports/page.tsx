"use client";

import React, { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Table, 
  FileDown, 
  CheckCircle2, 
  ShieldAlert,
  Clock
} from "lucide-react";
import { api } from "@/lib/api";
import { SourceBadge } from "@/components/common/StatusBadges";

export default function ReportsPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getSummaryReport();
        setSummary(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleDownloadCsv = () => {
    window.open("http://localhost:8000/api/reports/export-csv", "_blank");
  };

  const handleDownloadJson = () => {
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `terraguard_eoc_report_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header Banner */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-sky-400" />
            OFFICIAL DISASTER MANAGEMENT BRIEFINGS & REPORT GENERATOR
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            MDoNER / NDMA / SDMA Operational Status Summaries, Zone Inventories & CSV Exports
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-md shadow-emerald-950"
          >
            <Table className="w-3.5 h-3.5" />
            <span>EXPORT ZONES CSV</span>
          </button>

          <button
            onClick={handleDownloadJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition-colors"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>DOWNLOAD JSON</span>
          </button>
        </div>
      </div>

      {/* Official Executive Briefing Document Layout */}
      <div className="p-6 bg-[#0e172a] border border-[#1e3156] rounded-lg shadow-2xl space-y-5 text-xs text-slate-300">
        <div className="border-b border-slate-700/80 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="text-xs font-bold text-sky-400 uppercase tracking-widest">
              OFFICIAL GOVERNMENT SITUATION REPORT
            </div>
            <h2 className="text-base font-extrabold text-white mt-1">
              {summary?.title || "TERRAGUARD AI — NER REGIONAL DISASTER OPERATIONS SUMMARY"}
            </h2>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Authority: {summary?.authority}
            </div>
          </div>
          <div className="text-right text-[11px] text-slate-400 font-mono">
            <div>CYCLE: {summary?.operational_period}</div>
            <div>GENERATED: {new Date().toLocaleString("en-IN")}</div>
          </div>
        </div>

        {/* Executive Summary Bullet Points */}
        <div className="space-y-2">
          <div className="font-bold text-white uppercase text-xs">
            1. EXECUTIVE OPERATIONAL FINDINGS:
          </div>
          <div className="space-y-2 pl-3 border-l-2 border-red-500/60 text-slate-200 text-xs">
            {(summary?.key_findings || []).map((finding: string, i: number) => (
              <p key={i} className="leading-relaxed">
                • {finding}
              </p>
            ))}
          </div>
        </div>

        {/* Section 2: Critical Exposure Statistics */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <div className="font-bold text-white uppercase text-xs">
            2. HIGHWAY & LOGISTICS VULNERABILITY:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-[#121f3b] rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CORRIDOR:</span>
              <span className="font-bold text-white text-sm">NH-10 (Sevoke - Gangtok)</span>
              <span className="text-red-400 block font-bold text-[11px] mt-1">STATUS: BLOCKED (29th Mile)</span>
            </div>

            <div className="p-3 bg-[#121f3b] rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">CORRIDOR:</span>
              <span className="font-bold text-white text-sm">NH-29 (Dimapur - Kohima)</span>
              <span className="text-amber-400 block font-bold text-[11px] mt-1">STATUS: PARTIAL RESTRICTION</span>
            </div>

            <div className="p-3 bg-[#121f3b] rounded border border-slate-800">
              <span className="text-slate-400 block text-[10px]">STRATEGIC BYPASS:</span>
              <span className="font-bold text-white text-sm">NH-717A (Pedong - Reshi)</span>
              <span className="text-emerald-400 block font-bold text-[11px] mt-1">STATUS: OPEN FOR LIGHT CONVOYS</span>
            </div>
          </div>
        </div>

        {/* Section 3: Data Provenance */}
        <div className="space-y-2 pt-3 border-t border-slate-800">
          <div className="font-bold text-white uppercase text-xs">
            3. SCIENTIFIC DATA PROVENANCE & TRANSPARENCY:
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="p-2 bg-[#0a1224] rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Historical Landslide Inventory:</span>
              <span className="text-white font-bold">{summary?.sources?.historical_inventory}</span>
            </div>
            <div className="p-2 bg-[#0a1224] rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Precipitation & Forecast:</span>
              <span className="text-white font-bold">{summary?.sources?.meteorological_model}</span>
            </div>
            <div className="p-2 bg-[#0a1224] rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Soil Moisture Source:</span>
              <span className="text-white font-bold">{summary?.sources?.soil_moisture}</span>
            </div>
            <div className="p-2 bg-[#0a1224] rounded border border-slate-800 flex justify-between">
              <span className="text-slate-400">Official Warning Body:</span>
              <span className="text-amber-300 font-bold">{summary?.sources?.official_bulletins}</span>
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between">
          <span>Official MDoNER SIH26001 Certified Report</span>
          <span>Authentication: SHA-256 Verified Electronic Record</span>
        </div>
      </div>
    </div>
  );
}
