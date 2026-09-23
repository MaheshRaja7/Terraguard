"use client";

import React, { useState } from "react";
import { 
  Settings as SettingsIcon, 
  Globe2, 
  MessageSquare, 
  Sliders, 
  ShieldCheck, 
  CheckCircle2 
} from "lucide-react";

export default function SettingsPage() {
  const [smsProvider, setSmsProvider] = useState("local");
  const [saved, setSaved] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("en");

  const languages = [
    { code: "en", name: "English (Active)", status: "Active" },
    { code: "hi", name: "Hindi (हिंदी)", status: "Prepared" },
    { code: "as", name: "Assamese (অসমীয়া)", status: "Prepared" },
    { code: "bn", name: "Bengali (বাংলা)", status: "Prepared" },
    { code: "mni", name: "Manipuri (মৈতৈলোন্)", status: "Prepared" },
    { code: "lus", name: "Mizo (Mizo ṭawng)", status: "Prepared" },
    { code: "kha", name: "Khasi (Ka Ktien Khasi)", status: "Prepared" },
    { code: "ne", name: "Nepali (नेपाली)", status: "Prepared" },
  ];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto font-mono text-xs">
      {/* Header */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex items-center justify-between">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <SettingsIcon className="w-4 h-4 text-sky-400" />
            TERRAGUARD SYSTEM CONFIGURATION & MULTILINGUAL SETTINGS
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Gateway parameters, notification thresholds and regional language support
          </p>
        </div>
      </div>

      {saved && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-700 rounded text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>System configuration preferences saved.</span>
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="p-5 bg-[#0e172a] border border-[#1e3156] rounded-lg space-y-4 shadow-xl">
        {/* SMS Provider Selection */}
        <div className="space-y-2 border-b border-slate-800 pb-4">
          <label className="text-white font-bold flex items-center gap-1.5 uppercase">
            <MessageSquare className="w-4 h-4 text-sky-400" />
            <span>SMS GATEWAY PROVIDER</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            <div
              onClick={() => setSmsProvider("local")}
              className={`p-3 rounded border cursor-pointer transition-all ${
                smsProvider === "local"
                  ? "bg-sky-950/50 border-sky-500 text-white font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="text-xs">Local SMS Simulator</div>
              <div className="text-[10px] text-slate-400 mt-1 font-normal">
                Default: Zero cost, runs 100% locally on laptop without external credentials.
              </div>
            </div>

            <div
              onClick={() => setSmsProvider("msg91")}
              className={`p-3 rounded border cursor-pointer transition-all ${
                smsProvider === "msg91"
                  ? "bg-sky-950/50 border-sky-500 text-white font-bold"
                  : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className="text-xs">MSG91 Real SMS Gateway</div>
              <div className="text-[10px] text-slate-400 mt-1 font-normal">
                Optional: Uses MSG91_AUTH_KEY in .env. Automatically falls back to Local if missing.
              </div>
            </div>
          </div>
        </div>

        {/* Multilingual Support Architecture */}
        <div className="space-y-2 border-b border-slate-800 pb-4">
          <label className="text-white font-bold flex items-center gap-1.5 uppercase">
            <Globe2 className="w-4 h-4 text-purple-400" />
            <span>REGIONAL NORTH EASTERN LANGUAGES (SIH REQUISITE)</span>
          </label>
          <p className="text-[11px] text-slate-400">
            Emergency warning templates prepared for regional language dissemination across NER:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
            {languages.map((lang) => (
              <div
                key={lang.code}
                onClick={() => setSelectedLanguage(lang.code)}
                className={`p-2 rounded border cursor-pointer text-center ${
                  selectedLanguage === lang.code
                    ? "bg-purple-950/50 border-purple-500 text-white font-bold"
                    : "bg-slate-900 border-slate-800 text-slate-400"
                }`}
              >
                <div className="text-xs">{lang.name}</div>
                <div className="text-[9px] text-slate-500 mt-0.5">{lang.status}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Alert Threshold Tuning */}
        <div className="space-y-2 pb-2">
          <label className="text-white font-bold flex items-center gap-1.5 uppercase">
            <Sliders className="w-4 h-4 text-red-400" />
            <span>OPERATIONAL WARNING THRESHOLDS</span>
          </label>
          <div className="grid grid-cols-2 gap-3 text-slate-300">
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">CRITICAL ALERT THRESHOLD</span>
              <span className="font-bold text-red-400">Score &gt;= 76</span>
            </div>
            <div className="p-2 bg-[#121f3b] rounded border border-slate-800">
              <span className="text-[10px] text-slate-400 block">HIGH ADVISORY THRESHOLD</span>
              <span className="font-bold text-orange-400">Score 51 – 75</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold tracking-wider uppercase rounded transition-colors"
        >
          SAVE SYSTEM SETTINGS
        </button>
      </form>
    </div>
  );
}
