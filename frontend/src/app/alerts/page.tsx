"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  AlertOctagon, 
  CheckCircle2, 
  MessageSquare, 
  BellRing, 
  Clock, 
  ShieldAlert,
  Play,
  CloudRain,
  Activity,
  ChevronDown,
  ChevronUp,
  Radio,
  RefreshCw,
  Droplets,
  Wind
} from "lucide-react";
import { api } from "@/lib/api";
import { AlertItem } from "@/types";
import { RiskBadge, PriorityBadge } from "@/components/common/StatusBadges";

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [ackLoading, setAckLoading] = useState<string | null>(null);

  // Live Weather Scanning State
  const [scanning, setScanning] = useState(false);
  const [scanResults, setScanResults] = useState<any | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const res = await api.getAlerts();
      setAlerts(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLastScan = async () => {
    try {
      const res = await api.getLiveWeatherStatus();
      if (res.has_scanned && res.data) {
        setScanResults(res.data);
      }
    } catch (err) {
      console.error("Error loading last scan:", err);
    }
  };

  useEffect(() => {
    loadAlerts();
    loadLastScan();
  }, []);

  const handleAcknowledge = async (alertId: string) => {
    try {
      setAckLoading(alertId);
      await api.acknowledgeAlert(alertId, "Duty Commander");
      loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setAckLoading(null);
    }
  };

  const handleTriggerCritical = async () => {
    try {
      await api.triggerTestCriticalAlert();
      loadAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleScanLiveWeather = async () => {
    try {
      setScanning(true);
      setScanMessage("Querying Open-Meteo live API and evaluating risk using TG-XGB-2.0 ML model...");
      const res = await api.evaluateLiveWeatherAlerts({ limit: 25, notify_sms: true, force_dispatch: false });
      if (res.success) {
        setScanResults(res.data);
        setScanMessage(res.message);
        setShowDetails(true);
        loadAlerts();
      }
    } catch (err: any) {
      console.error(err);
      setScanMessage("Failed to complete real-time weather scan: " + (err.message || err));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Banner */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-red-400" />
            EARLY WARNING DISASTER ALERTS & REAL-TIME WEATHER BROADCASTS
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Real-time weather triggers matched with multi-dataset ML model for proactive disaster response
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Real-time Weather Scan & Alert Action */}
          <button
            onClick={handleScanLiveWeather}
            disabled={scanning}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shadow-emerald-950 border border-emerald-500"
          >
            {scanning ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <CloudRain className="w-3.5 h-3.5" />
            )}
            <span>{scanning ? "SCANNING LIVE WEATHER..." : "SCAN LIVE WEATHER & SEND ALERTS"}</span>
          </button>

          <button
            onClick={handleTriggerCritical}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors shadow-md shadow-red-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>TRIGGER TEST CRITICAL</span>
          </button>

          <Link
            href="/alerts/sms"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-sky-950 hover:bg-sky-900 border border-sky-700 text-sky-300 text-xs font-bold transition-colors"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>SMS CENTER</span>
          </Link>
        </div>
      </div>

      {/* Real-Time Weather Evaluation Panel */}
      {scanResults && (
        <div className="p-4 bg-[#0a1224] border border-sky-900/60 rounded-lg space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-bold text-sky-300">
                REAL-TIME WEATHER EVALUATION SUMMARY
              </span>
              <span className="text-[10px] bg-sky-950 border border-sky-700 text-sky-300 px-1.5 py-0.5 rounded font-bold">
                MODEL: {scanResults.model_version || "TG-XGB-2.0-NER-UNIFIED"}
              </span>
            </div>

            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span>Scanned: <strong className="text-white">{scanResults.total_places_scanned} places</strong></span>
              <span>Elevated: <strong className="text-amber-400">{scanResults.elevated_places_count}</strong></span>
              <span>Alerts Dispatched: <strong className="text-red-400">{scanResults.alerts_dispatched_count}</strong></span>
              <button 
                onClick={() => setShowDetails(!showDetails)}
                className="text-sky-400 hover:text-sky-300 underline text-[11px] flex items-center gap-0.5 ml-2"
              >
                {showDetails ? "Hide Table" : "View Live Places"}
                {showDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {scanMessage && (
            <p className="text-xs text-emerald-300 bg-emerald-950/30 border border-emerald-900/50 p-2 rounded">
              {scanMessage}
            </p>
          )}

          {/* Details Table */}
          {showDetails && scanResults.evaluations && (
            <div className="overflow-x-auto border border-slate-800 rounded">
              <table className="w-full text-[11px] text-left text-slate-300">
                <thead className="bg-[#0e172a] text-slate-400 uppercase font-bold border-b border-slate-800">
                  <tr>
                    <th className="px-3 py-2">Place & District</th>
                    <th className="px-3 py-2">State</th>
                    <th className="px-3 py-2">24h Rainfall</th>
                    <th className="px-3 py-2">Soil Moisture</th>
                    <th className="px-3 py-2">Temp & Hum</th>
                    <th className="px-3 py-2">AI Risk Score</th>
                    <th className="px-3 py-2">Emergency Priority</th>
                    <th className="px-3 py-2">Alert Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {scanResults.evaluations.map((ev: any) => {
                    const r = ev.predicted_risk;
                    const w = ev.real_time_weather;
                    return (
                      <tr key={ev.place_id} className={ev.is_elevated ? "bg-red-950/15" : "hover:bg-slate-900/50"}>
                        <td className="px-3 py-2 font-bold text-white">
                          <div>{ev.name}</div>
                          <span className="text-[10px] text-slate-400">{ev.district}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-300">{ev.state}</td>
                        <td className="px-3 py-2 text-sky-400 font-bold">
                          {w.rain_24h.toFixed(1)} mm
                        </td>
                        <td className="px-3 py-2 text-slate-300">
                          {w.soil_moisture_0_7.toFixed(3)} m³/m³
                          <span className="text-[9px] text-slate-400 block">{w.soil_status}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">
                          {w.temperature.toFixed(1)}°C | {w.humidity.toFixed(0)}%
                        </td>
                        <td className="px-3 py-2 font-bold">
                          <span className={r.score >= 70 ? "text-red-400" : (r.score >= 45 ? "text-amber-400" : "text-emerald-400")}>
                            {r.score}/100 ({r.level})
                          </span>
                        </td>
                        <td className="px-3 py-2">
                          <PriorityBadge tier={r.priority_tier} />
                        </td>
                        <td className="px-3 py-2">
                          {ev.is_elevated ? (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-900/40 text-red-300 border border-red-700">
                              ALERT DISPATCHED
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-900/30 text-emerald-400 border border-emerald-800">
                              MONITORING NORMAL
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Alerts Feed */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="font-bold text-white flex items-center gap-1.5">
            <BellRing className="w-3.5 h-3.5 text-sky-400" />
            ACTIVE EMERGENCY ADVISORIES & INCIDENT DISPATCHES ({alerts.length})
          </span>
          <span>Auto-refreshed from Alert Engine</span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-8 text-center text-slate-500 bg-[#0e172a] rounded-lg border border-slate-800">
            No active alerts currently registered. Click &quot;Scan Live Weather & Send Alerts&quot; to evaluate live conditions.
          </div>
        ) : (
          alerts.map((alt) => {
            const isAck = alt.status === "ACKNOWLEDGED";
            return (
              <div
                key={alt.id}
                className={`p-4 rounded-lg border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  alt.severity === "CRITICAL"
                    ? "bg-red-950/25 border-red-800/80 shadow-lg shadow-red-950/20"
                    : "bg-[#0e172a] border-slate-800"
                }`}
              >
                <div className="space-y-1.5 max-w-3xl">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-bold text-sky-400">{alt.id}</span>
                    <RiskBadge level={alt.severity} score={alt.riskScore} />
                    <PriorityBadge tier={alt.priority || "P1"} />
                    {alt.isEscalation && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                        ESCALATION EVENT
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">
                      Zone: <span className="text-white font-bold">{alt.zoneId}</span> ({alt.district}, {alt.state})
                    </span>
                  </div>

                  <p className="text-xs text-slate-200 leading-relaxed font-sans font-medium whitespace-pre-line bg-[#091122] p-2.5 rounded border border-slate-800">
                    {alt.message}
                  </p>

                  <div className="flex items-center gap-4 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-500" />
                      <span>Issued: {new Date(alt.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
                    </span>
                    <span>Recipients: {alt.recipients.join(", ")}</span>
                    <span>Channels: {alt.channels.join(", ")}</span>
                  </div>
                </div>

                {/* Action Button */}
                <div className="shrink-0 flex flex-col items-end gap-2">
                  {isAck ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1.5 rounded">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ACKNOWLEDGED ({alt.acknowledgedBy || "Duty Officer"})</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleAcknowledge(alt.id)}
                      disabled={ackLoading === alt.id}
                      className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase transition-colors flex items-center gap-1.5 shadow-md shadow-emerald-950"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{ackLoading === alt.id ? "Acknowledging..." : "Acknowledge Alert"}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
