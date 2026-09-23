"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Play, 
  RotateCcw, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  ExternalLink,
  MessageSquare,
  Flame,
  WifiOff,
  Wifi,
  Radio
} from "lucide-react";
import { api } from "@/lib/api";

export default function DemoPage() {
  const [runningScenario, setRunningScenario] = useState(false);
  const [scenarioDone, setScenarioDone] = useState(false);
  const [activeStep, setActiveStep] = useState(1);

  const handleRunEmergencyScenario = async () => {
    try {
      setRunningScenario(true);
      await api.runDemoEmergencyScenario();
      setScenarioDone(true);
      window.dispatchEvent(new CustomEvent("terraguard:scenario-triggered"));
    } catch (err) {
      console.error(err);
    } finally {
      setRunningScenario(false);
    }
  };

  const handleReset = async () => {
    try {
      await api.resetDemoScenario();
      setScenarioDone(false);
      window.dispatchEvent(new CustomEvent("terraguard:scenario-reset"));
    } catch (err) {
      console.error(err);
    }
  };

  const steps = [
    { num: 1, title: "EOC Executive Command Center", link: "/dashboard", desc: "Show Row 1 KPIs (1,284 zones, 47 critical, 18 alerts, 12 blocked roads, 84,210 pop at risk)." },
    { num: 2, title: "Interactive GIS Risk Map", link: "/risk-map", desc: "Select Zone TG-018 (Gangtok Corridor NH-10) to inspect slope (38.4°), elevation, and ISRO historical catalog." },
    { num: 3, title: "AI Prediction & Explainability", link: "/ai-prediction", desc: "Inspect TreeSHAP feature attributions: Heavy rainfall (+23), Modelled soil (+18), Steep slope (+16)." },
    { num: 4, title: "Meteorology & Modelled Soil", link: "/soil-moisture", desc: "Review multi-depth modelled soil moisture (0-7cm at 0.43 m³/m³) with zero physical sensor requirements." },
    { num: 5, title: "Execute Emergency Scenario", action: handleRunEmergencyScenario, isAction: true, desc: "Simulate 120mm cloudburst in East Sikkim. Risk jumps 42 → 87, Critical alert triggers, Priority becomes P1." },
    { num: 6, title: "Verify SMS Dispatch in SMS Center", link: "/alerts/sms", desc: "Inspect the simulated SMS dispatch lifecycle (Queued → Sent → Delivered — Local Demo)." },
    { num: 7, title: "Field Reporting & Offline PWA Sync", link: "/incidents/report", desc: "Submit field incident. Test offline queuing in IndexedDB and instant sync when network is active." },
  ];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono text-xs">
      {/* Banner */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-purple-400" />
            SIH 2026 JUDGE DEMO FLOW & EMERGENCY SCENARIO CONTROLLER
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Structured 3-to-5 minute evaluation walkthrough demonstrating end-to-end disaster risk intelligence
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRunEmergencyScenario}
            disabled={runningScenario}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-all shadow-md shadow-red-950"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>{runningScenario ? "Escalating..." : "RUN EMERGENCY SCENARIO"}</span>
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>RESET</span>
          </button>
        </div>
      </div>

      {/* Scenario State Notification Box */}
      {scenarioDone && (
        <div className="p-4 bg-red-950/40 border border-red-700 rounded-lg space-y-2 text-slate-200">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <ShieldAlert className="w-5 h-5 animate-pulse" />
            <span>EMERGENCY SCENARIO ACTIVE: ZONE TG-018 ESCALATED TO CRITICAL (RISK 87/100)</span>
          </div>
          <p className="text-xs text-slate-300">
            • Extreme rainfall trigger applied: 120mm cumulative 24h precipitation.
            <br />
            • Modelled soil moisture saturated to 0.48 m³/m³.
            <br />
            • NH-10 Lifeline Highway status transitioned to BLOCKED at 29th Mile.
            <br />
            • Critical Warning Alert generated & simulated SMS dispatched to Emergency Operations Center.
            <br />
            • Emergency Priority assigned to P1 CRITICAL.
          </p>
          <div className="flex gap-2 pt-1">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 px-3 py-1 bg-red-600 hover:bg-red-500 text-white rounded font-bold"
            >
              <span>View Dashboard Updates</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
            <Link
              href="/alerts/sms"
              className="inline-flex items-center gap-1 px-3 py-1 bg-sky-950 border border-sky-700 text-sky-300 rounded font-bold"
            >
              <span>View SMS in SMS Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Step-by-Step Judging Guide */}
      <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg space-y-3">
        <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
          HACKATHON EVALUATION WALKTHROUGH STEPS
        </div>

        <div className="space-y-3">
          {steps.map((step) => (
            <div
              key={step.num}
              className="p-3 bg-[#111c34] border border-slate-800 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-sky-950 text-sky-400 border border-sky-700 flex items-center justify-center font-bold text-[10px]">
                    {step.num}
                  </span>
                  <span className="font-bold text-white text-xs">{step.title}</span>
                </div>
                <p className="text-[11px] text-slate-400 pl-7">{step.desc}</p>
              </div>

              {step.isAction ? (
                <button
                  onClick={step.action}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors self-start sm:self-auto"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>TRIGGER NOW</span>
                </button>
              ) : (
                <Link
                  href={step.link!}
                  className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-bold self-start sm:self-auto"
                >
                  <span>Open Screen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
