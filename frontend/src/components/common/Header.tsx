"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ShieldAlert, 
  Wifi, 
  WifiOff, 
  AlertTriangle, 
  Play, 
  RotateCcw, 
  Radio, 
  CloudRain,
  UserCheck
} from "lucide-react";
import { syncManager } from "@/lib/sync-manager";
import { api } from "@/lib/api";

export function Header() {
  const [time, setTime] = useState("");
  const [networkStatus, setNetworkStatus] = useState({
    isOnline: true,
    isSyncing: false,
    pendingCount: 0,
    lastSyncedText: "Just now",
  });
  const [isTriggeringScenario, setIsTriggeringScenario] = useState(false);
  const [scenarioSuccess, setScenarioSuccess] = useState(false);

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString("en-IN", {
          timeZone: "Asia/Kolkata",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }) + " IST"
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((status) => {
      setNetworkStatus(status);
    });
    return () => unsubscribe();
  }, []);

  const handleRunEmergencyScenario = async () => {
    try {
      setIsTriggeringScenario(true);
      await api.runDemoEmergencyScenario();
      setScenarioSuccess(true);
      setTimeout(() => setScenarioSuccess(false), 4000);
      // Trigger a soft refresh event across components
      window.dispatchEvent(new CustomEvent("terraguard:scenario-triggered"));
    } catch (err) {
      console.error("Scenario trigger failed:", err);
    } finally {
      setIsTriggeringScenario(false);
    }
  };

  const handleResetScenario = async () => {
    try {
      await api.resetDemoScenario();
      window.dispatchEvent(new CustomEvent("terraguard:scenario-reset"));
    } catch (err) {
      console.error("Reset failed:", err);
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#0b1325]/95 backdrop-blur border-b border-[#1b2b4b] px-4 py-2.5 flex items-center justify-between text-sm">
      {/* Brand & Mission Title */}
      <div className="flex items-center gap-3">
        <Link href="/dashboard" className="flex items-center gap-2.5 group">
          <div className="w-9 h-9 rounded bg-red-600/20 border border-red-500/50 flex items-center justify-center text-red-400 group-hover:border-red-400 transition-colors">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold tracking-wider text-base text-white">
                TERRAGUARD <span className="text-red-500">AI</span>
              </span>
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-blue-950/80 text-blue-400 border border-blue-800/60">
                SIH26001
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block tracking-wide">
              NER Early Warning & Landslide Risk Monitoring Center
            </p>
          </div>
        </Link>
      </div>

      {/* Center Actions & Scenario Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRunEmergencyScenario}
          disabled={isTriggeringScenario}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono font-bold tracking-wider uppercase border transition-all ${
            scenarioSuccess
              ? "bg-emerald-600 text-white border-emerald-400 shadow-lg shadow-emerald-900/50"
              : "bg-red-600/90 hover:bg-red-500 text-white border-red-400 shadow-md shadow-red-950"
          }`}
          title="Simulate 120mm heavy rainfall escalation in East Sikkim (TG-018) triggering critical alert and local SMS"
        >
          <Play className="w-3.5 h-3.5 fill-current" />
          {isTriggeringScenario ? "Escalating..." : scenarioSuccess ? "Scenario Active!" : "Run Emergency Scenario"}
        </button>

        <button
          onClick={handleResetScenario}
          className="p-1.5 rounded hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-700/60 text-xs hidden md:flex items-center gap-1"
          title="Reset emergency scenario to baseline"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right Telemetry & Status Indicators */}
      <div className="flex items-center gap-3">
        {/* Network & Offline Status */}
        <div className="flex items-center gap-1.5 font-mono text-xs">
          {networkStatus.isOnline ? (
            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded">
              <Wifi className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">ONLINE</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-950/80 border border-amber-700 px-2 py-0.5 rounded animate-pulse">
              <WifiOff className="w-3.5 h-3.5" />
              <span>OFFLINE</span>
              {networkStatus.pendingCount > 0 && (
                <span className="bg-amber-500 text-slate-950 px-1 rounded font-bold text-[10px]">
                  {networkStatus.pendingCount}
                </span>
              )}
            </span>
          )}
        </div>

        {/* Live System Clock */}
        <div className="font-mono text-xs text-slate-300 bg-[#121c33] border border-[#22365e] px-2.5 py-1 rounded hidden sm:block">
          {time || "--:--:-- IST"}
        </div>

        {/* EOC User Badge */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-700/60">
          <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-600 flex items-center justify-center text-slate-300">
            <UserCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hidden xl:block text-left">
            <div className="text-[11px] font-bold leading-none text-slate-200">NDMA / SDMA</div>
            <div className="text-[10px] text-slate-400 leading-none mt-0.5">Duty Officer</div>
          </div>
        </div>
      </div>
    </header>
  );
}
