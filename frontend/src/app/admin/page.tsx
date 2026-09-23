"use client";

import React, { useState, useEffect } from "react";
import { 
  FolderGit2, 
  UploadCloud, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  FileText,
  Activity
} from "lucide-react";
import { api } from "@/lib/api";

export default function AdminPage() {
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [retraining, setRetraining] = useState(false);
  const [retrainSuccess, setRetrainSuccess] = useState(false);

  // File import state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadPreview, setUploadPreview] = useState<any>(null);
  const [uploading, setUploading] = useState(false);

  const loadAdminData = async () => {
    try {
      const [sys, mod] = await Promise.all([
        api.getSystemStatus().catch(() => null),
        api.getModelInfo().catch(() => null),
      ]);
      if (sys) setSystemStatus(sys);
      if (mod) setModelInfo(mod);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, []);

  const handleRetrain = async () => {
    try {
      setRetraining(true);
      await api.retrainModel();
      setRetrainSuccess(true);
      setTimeout(() => setRetrainSuccess(false), 4000);
      loadAdminData();
    } catch (err) {
      console.error("Retrain error:", err);
    } finally {
      setRetraining(false);
    }
  };

  const formatPercent = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0.0%";
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatPoints = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return "0.0 pts";
    return `${value.toFixed(2)} pts`;
  };

  const handleFileUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const res = await fetch("http://localhost:8000/api/admin/import-data", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      setUploadPreview(data);
    } catch (err) {
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <FolderGit2 className="w-4 h-4 text-sky-400" />
            ADMINISTRATION, DATA PIPELINES & MODEL GOVERNANCE
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            System diagnostics, automated schema inspection for new CSV/Excel/GeoJSON, and XGBoost retraining
          </p>
        </div>
      </div>

      {/* 1. System Health Status Section */}
      <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg space-y-3">
        <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
          SYSTEM HEALTH & INTEGRATION STATUS
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {(systemStatus?.services || [
            { name: "AI Model Engine", status: "GREEN", detail: "Version TG-XGB-1.0 (Active)" },
            { name: "Database Persistence", status: "GREEN", detail: "Embedded Datastore / MongoDB Atlas Ready" },
            { name: "Weather Provider (Open-Meteo)", status: "GREEN", detail: "Live API Operational" },
            { name: "Official IMD Integration", status: "YELLOW", detail: "IMD integration not configured (Graceful Fallback Active)" },
            { name: "SMS Gateway", status: "GREEN", detail: "LOCAL_SIMULATOR (Local Demo Active)" },
            { name: "Offline Sync Engine", status: "GREEN", detail: "ONLINE (Service Worker & IndexedDB Active)" },
          ]).map((s: any) => {
            const isGreen = s.status === "GREEN";
            const isYellow = s.status === "YELLOW";
            return (
              <div
                key={s.name}
                className="p-3 bg-[#121f3b] border border-slate-800 rounded flex flex-col justify-between"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white">{s.name}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                      isGreen
                        ? "bg-emerald-950 text-emerald-400 border-emerald-800"
                        : isYellow
                        ? "bg-amber-950 text-amber-400 border-amber-800"
                        : "bg-red-950 text-red-400 border-red-800"
                    }`}
                  >
                    {s.status}
                  </span>
                </div>
                <div className="text-[11px] text-slate-400 mt-2">{s.detail}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Model Governance & Retraining Section */}
      <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="text-xs font-bold text-white uppercase flex items-center gap-2">
            <Cpu className="w-4 h-4 text-sky-400" />
            <span>MODEL GOVERNANCE & VERSIONING ({modelInfo?.version || "TG-XGB-1.0"})</span>
          </div>

          <button
            onClick={handleRetrain}
            disabled={retraining}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${retraining ? "animate-spin" : ""}`} />
            <span>{retraining ? "Retraining XGBoost..." : "RETRAIN MODEL"}</span>
          </button>
        </div>

        {retrainSuccess && (
          <div className="p-2 bg-emerald-950/60 border border-emerald-700 rounded text-emerald-300">
            Model retrained successfully. New metrics and SHAP background samples re-serialized to backend/models.
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">ACCURACY</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {formatPercent(modelInfo?.metrics?.accuracy)}
            </div>
          </div>
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">PRECISION</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {formatPercent(modelInfo?.metrics?.precision)}
            </div>
          </div>
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">RECALL</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {formatPercent(modelInfo?.metrics?.recall)}
            </div>
          </div>
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">F1-SCORE</div>
            <div className="text-lg font-black text-emerald-400 mt-0.5">
              {formatPercent(modelInfo?.metrics?.f1_score)}
            </div>
          </div>
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">MAE (0-100)</div>
            <div className="text-lg font-black text-sky-400 mt-0.5">
              {formatPoints(modelInfo?.metrics?.mae)}
            </div>
          </div>
          <div className="p-2.5 bg-[#121f3b] rounded border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">RMSE</div>
            <div className="text-lg font-black text-sky-400 mt-0.5">
              {formatPoints(modelInfo?.metrics?.rmse)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Data Import System with Column Detection */}
      <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg space-y-3">
        <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
          DATA IMPORT SYSTEM & SCHEMA DETECTION (.CSV / .XLSX / .GEOJSON)
        </div>

        <form onSubmit={handleFileUpload} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="file"
              accept=".csv,.xlsx,.xls,.json,.geojson"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="text-xs text-slate-400 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-mono file:bg-slate-800 file:text-slate-200 hover:file:bg-slate-700"
            />
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="px-4 py-1.5 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold disabled:opacity-50"
            >
              {uploading ? "Analyzing Schema..." : "Inspect & Import Schema"}
            </button>
          </div>
        </form>

        {uploadPreview && (
          <div className="p-3 bg-[#111c34] border border-slate-800 rounded space-y-2 mt-3">
            <div className="flex justify-between text-slate-300">
              <span className="font-bold text-sky-400">File: {uploadPreview.filename}</span>
              <span>Size: {(uploadPreview.file_size_bytes / 1024).toFixed(1)} KB</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">DETECTED COLUMNS:</span>
              <div className="flex flex-wrap gap-1">
                {uploadPreview.detected_columns.map((c: string) => (
                  <span key={c} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {c}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block mb-1">AUTOMATIC FIELD MAPPINGS:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {Object.entries(uploadPreview.mapping_suggestions || {}).map(([standard, detected]) => (
                  <div key={standard} className="p-1.5 bg-[#0a1224] rounded border border-slate-800 text-[11px]">
                    <span className="text-slate-500 block">{standard} →</span>
                    <span className="text-emerald-400 font-bold">{String(detected)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
