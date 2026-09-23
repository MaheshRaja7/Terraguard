"use client";

import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  CheckCircle2, 
  Clock, 
  Radio, 
  ShieldCheck,
  AlertCircle,
  Building2,
  Shield,
  Users,
  Volume2,
  VolumeX,
  Zap,
  Copy,
  RotateCcw,
  Sparkles,
  BellRing,
  Check,
  Smartphone,
  Flame,
  ChevronRight,
  Layers
} from "lucide-react";
import { api } from "@/lib/api";
import { 
  SMSLogItem, 
  MultiTierTemplatesResponse, 
  AlertTemplateTier, 
  AutoDispatchStatus, 
  AppBroadcastItem 
} from "@/types";
import { RiskBadge } from "@/components/common/StatusBadges";

type AudienceTierKey = "DISTRICT_ADMIN" | "DISASTER_AUTHORITIES" | "COMMUNITY";

export default function SMSCenterPage() {
  const [logs, setLogs] = useState<SMSLogItem[]>([]);
  const [providerStatus, setProviderStatus] = useState<any>(null);
  const [templatesData, setTemplatesData] = useState<MultiTierTemplatesResponse | null>(null);
  const [selectedTier, setSelectedTier] = useState<AudienceTierKey>("DISTRICT_ADMIN");
  
  const [phone, setPhone] = useState("+919876543210");
  const [recipientTitle, setRecipientTitle] = useState("District Magistrate & DEOC Controller");
  const [messageText, setMessageText] = useState("");
  
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [broadcastingAll, setBroadcastingAll] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);
  
  const [autoDispatch, setAutoDispatch] = useState<AutoDispatchStatus | null>(null);
  const [togglingAuto, setTogglingAuto] = useState(false);
  const [appBroadcasts, setAppBroadcasts] = useState<AppBroadcastItem[]>([]);
  
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [copied, setCopied] = useState(false);

  // Play synthetic Web Audio early warning chime
  const playAlertChime = () => {
    if (!soundEnabled || typeof window === "undefined") return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc1.frequency.setValueAtTime(1320, ctx.currentTime + 0.15); // E6
      
      osc2.frequency.setValueAtTime(440, ctx.currentTime);
      osc2.frequency.setValueAtTime(660, ctx.currentTime + 0.15);

      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } catch (e) {
      // Audio context might be restricted before interaction
    }
  };

  const loadData = async () => {
    try {
      const [logsRes, tmplRes, autoRes, appRes] = await Promise.all([
        api.getSMSLogs(),
        api.getAlertTemplates(),
        api.getAutoDispatchStatus().catch(() => null),
        api.getAppBroadcasts().catch(() => [])
      ]);

      if (logsRes?.history) setLogs(logsRes.history);
      if (logsRes?.status) setProviderStatus(logsRes.status);
      
      if (tmplRes?.tiers) {
        setTemplatesData(tmplRes);
        // Initialize default tier message
        const defaultTier = tmplRes.tiers["DISTRICT_ADMIN"];
        if (defaultTier && !messageText) {
          setMessageText(defaultTier.message);
          if (defaultTier.recipients?.[0]) {
            setPhone(defaultTier.recipients[0].phone);
            setRecipientTitle(defaultTier.recipients[0].name);
          }
        }
      }

      if (autoRes) setAutoDispatch(autoRes);
      if (appRes) setAppBroadcasts(appRes);
    } catch (err) {
      console.error("Failed to load SMS & Early Warning data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update editor when switching audience tier
  const handleSelectTier = (tierKey: AudienceTierKey) => {
    setSelectedTier(tierKey);
    if (templatesData?.tiers?.[tierKey]) {
      const tier = templatesData.tiers[tierKey];
      setMessageText(tier.message);
      if (tier.recipients?.[0]) {
        setPhone(tier.recipients[0].phone);
        setRecipientTitle(tier.recipients[0].name);
      }
    }
  };

  const handleSelectContact = (contact: { name: string; phone: string; role: string }) => {
    setPhone(contact.phone);
    setRecipientTitle(contact.name);
  };

  const handleCopyMessage = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleResetToTemplate = () => {
    if (templatesData?.tiers?.[selectedTier]) {
      setMessageText(templatesData.tiers[selectedTier].message);
    }
  };

  const handleSendSingleSMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSending(true);
      await api.sendTestSMS(phone, messageText, selectedTier);
      playAlertChime();
      setSendSuccess(true);
      setTimeout(() => setSendSuccess(false), 3000);
      loadData();
    } catch (err) {
      console.error("SMS test failed:", err);
    } finally {
      setSending(false);
    }
  };

  const handleBroadcastToAllTiers = async () => {
    try {
      setBroadcastingAll(true);
      playAlertChime();
      await api.broadcastMultiTier({
        zone_id: templatesData?.zone_info?.zone_id || "TG-018",
        district: templatesData?.zone_info?.district || "East Sikkim",
        state: templatesData?.zone_info?.state || "Sikkim",
        risk_score: templatesData?.zone_info?.risk_score || 87.0,
        severity: templatesData?.zone_info?.severity || "CRITICAL",
        custom_messages: {
          [selectedTier]: messageText
        }
      });
      setBroadcastSuccess(true);
      setTimeout(() => setBroadcastSuccess(false), 4000);
      loadData();
    } catch (err) {
      console.error("Multi-tier automated broadcast failed:", err);
    } finally {
      setBroadcastingAll(false);
    }
  };

  const handleToggleAutoDispatch = async () => {
    try {
      setTogglingAuto(true);
      const nextState = !(autoDispatch?.config?.enabled ?? true);
      const res = await api.updateAutoDispatch(nextState, autoDispatch?.config?.threshold_score || 75);
      if (res) {
        setAutoDispatch((prev) => prev ? { ...prev, config: { ...prev.config, enabled: nextState } } : null);
      }
      loadData();
    } catch (err) {
      console.error("Failed to toggle auto dispatch:", err);
    } finally {
      setTogglingAuto(false);
    }
  };

  const currentTierData = templatesData?.tiers?.[selectedTier];

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Real-time App-Based Early Warning Broadcast Banner (if active) */}
      {appBroadcasts.length > 0 && appBroadcasts[0].active && (
        <div className="p-3 bg-gradient-to-r from-red-950/90 via-[#1a0b12] to-amber-950/80 border-2 border-red-500/80 rounded-lg shadow-xl shadow-red-950/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 animate-pulse">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded bg-red-600/30 border border-red-400/60 text-red-400 shrink-0">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[10px] font-black bg-red-600 text-white tracking-widest uppercase">
                  APP-BASED EMERGENCY WARNING ACTIVE
                </span>
                <span className="text-xs font-bold text-red-300">
                  {appBroadcasts[0].title}
                </span>
                <span className="text-[10px] text-slate-400">
                  [{appBroadcasts[0].district} • Zone {appBroadcasts[0].zoneId}]
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 font-sans font-medium">
                {appBroadcasts[0].actionRequired}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`px-2.5 py-1.5 rounded border text-xs flex items-center gap-1.5 transition-colors ${
                soundEnabled 
                  ? "bg-red-950 text-red-300 border-red-600 hover:bg-red-900" 
                  : "bg-slate-900 text-slate-400 border-slate-700"
              }`}
              title={soundEnabled ? "Mute alert chime" : "Unmute alert chime"}
            >
              {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-bold">{soundEnabled ? "CHIME ON" : "MUTED"}</span>
            </button>

            <button
              onClick={handleBroadcastToAllTiers}
              disabled={broadcastingAll}
              className="px-3 py-1.5 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-red-950 uppercase tracking-wider"
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{broadcastingAll ? "BROADCASTING..." : "RE-BROADCAST"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Header Banner & Automated Engine Status Bar */}
      <div className="p-3.5 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-sky-400" />
              TERRAGUARD AUTOMATED EARLY WARNING & SMS DISPATCH SYSTEM
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950 border border-blue-700 text-blue-300 font-bold uppercase">
              CAP-INDIA v1.2 / NDMA PROTOCOL
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Automated threshold escalation, multi-stakeholder alert message generation, and real-time SMS/App-based dissemination
          </p>
        </div>

        {/* Auto Dispatch Engine Control */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="p-2 rounded bg-slate-900/90 border border-slate-800 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${autoDispatch?.config?.enabled ? "bg-emerald-400 animate-ping" : "bg-slate-600"}`} />
              <div className="text-[11px]">
                <div className="text-slate-400 text-[9px] uppercase font-bold">AUTOMATED ENGINE</div>
                <div className={`font-bold ${autoDispatch?.config?.enabled ? "text-emerald-400" : "text-slate-400"}`}>
                  {autoDispatch?.config?.enabled ? "AUTO-TRIGGER: ACTIVE" : "AUTO-TRIGGER: STANDBY"}
                </div>
              </div>
            </div>

            <button
              onClick={handleToggleAutoDispatch}
              disabled={togglingAuto}
              className={`px-2.5 py-1 rounded text-[10px] font-bold border uppercase transition-colors ${
                autoDispatch?.config?.enabled
                  ? "bg-emerald-950 text-emerald-300 border-emerald-700 hover:bg-emerald-900"
                  : "bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700"
              }`}
            >
              {autoDispatch?.config?.enabled ? "DISABLE" : "ENABLE"}
            </button>
          </div>

          <button
            onClick={handleBroadcastToAllTiers}
            disabled={broadcastingAll}
            className="px-3.5 py-2 rounded bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white text-xs font-bold tracking-wider uppercase transition-all shadow-lg shadow-red-950/60 flex items-center gap-2 border border-red-400/40"
          >
            <Zap className="w-4 h-4 fill-current animate-pulse" />
            <span>{broadcastingAll ? "TRANSMITTING 3 TIERS..." : "⚡ MULTI-TIER AUTOMATED BROADCAST"}</span>
          </button>
        </div>
      </div>

      {broadcastSuccess && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500 text-emerald-300 text-xs rounded-lg flex items-center gap-2 shadow-lg animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            SUCCESS: Automated Multi-Tier Broadcast dispatched! Real-time alerts transmitted to District Administrations, Disaster Management Authorities, and Local Communities via SMS & App Push.
          </span>
        </div>
      )}

      {/* Target Stakeholder Audience Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs text-slate-400 px-1">
          <span className="uppercase font-bold tracking-wider flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-sky-400" />
            SELECT TARGET STAKEHOLDER AUDIENCE FOR COMMON ALERT MESSAGE:
          </span>
          <span className="text-[10px] text-slate-500">Auto-formatted to Indian National CAP Standard</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* 1. District Administration */}
          <button
            onClick={() => handleSelectTier("DISTRICT_ADMIN")}
            className={`p-3.5 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedTier === "DISTRICT_ADMIN"
                ? "bg-[#141b36] border-indigo-500 shadow-lg shadow-indigo-950/60 ring-1 ring-indigo-500"
                : "bg-[#0e172a] border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">District Administration</div>
                  <div className="text-[10px] text-indigo-300">DM / DC / SDM / DDMA Officers</div>
                </div>
              </div>
              {selectedTier === "DISTRICT_ADMIN" && (
                <span className="w-2 h-2 rounded-full bg-indigo-400 ring-4 ring-indigo-400/20" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Executive command directives under DM Act Sec 30/34, DEOC activation, machinery pre-positioning.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-indigo-300 uppercase font-bold">
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-800">SMS GATEWAY</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-800">DEOC IN-APP</span>
              <span className="px-1.5 py-0.5 rounded bg-indigo-950/90 border border-indigo-800">CAP-IN XML</span>
            </div>
          </button>

          {/* 2. Disaster Management Authorities */}
          <button
            onClick={() => handleSelectTier("DISASTER_AUTHORITIES")}
            className={`p-3.5 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedTier === "DISASTER_AUTHORITIES"
                ? "bg-[#1d1238] border-purple-500 shadow-lg shadow-purple-950/60 ring-1 ring-purple-500"
                : "bg-[#0e172a] border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-purple-950/80 border border-purple-700/60 text-purple-400">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">Disaster Authorities</div>
                  <div className="text-[10px] text-purple-300">NDMA / SDMA / NDRF / BRO</div>
                </div>
              </div>
              {selectedTier === "DISASTER_AUTHORITIES" && (
                <span className="w-2 h-2 rounded-full bg-purple-400 ring-4 ring-purple-400/20" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Tactical rollout orders, SAR standby, heavy bulldozer chokepoint deployment, VHF comms channels.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-purple-300 uppercase font-bold">
              <span className="px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-800">TACTICAL SMS</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-800">FIELD PUSH</span>
              <span className="px-1.5 py-0.5 rounded bg-purple-950/90 border border-purple-800">VHF NET</span>
            </div>
          </button>

          {/* 3. Local Communities & Citizens */}
          <button
            onClick={() => handleSelectTier("COMMUNITY")}
            className={`p-3.5 rounded-lg border text-left transition-all relative overflow-hidden ${
              selectedTier === "COMMUNITY"
                ? "bg-[#25180f] border-amber-500 shadow-lg shadow-amber-950/60 ring-1 ring-amber-500"
                : "bg-[#0e172a] border-slate-800 hover:border-slate-700 opacity-80 hover:opacity-100"
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded bg-amber-950/80 border border-amber-700/60 text-amber-400">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white uppercase">Local Communities</div>
                  <div className="text-[10px] text-amber-300">Panchayats / Wardens / Public</div>
                </div>
              </div>
              {selectedTier === "COMMUNITY" && (
                <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
              )}
            </div>
            <p className="text-[11px] text-slate-400 leading-snug">
              Plain-language bilingual (English/Hindi) safety advisory, immediate evacuation shelters, helpline 1077/112.
            </p>
            <div className="mt-2.5 flex items-center gap-1.5 text-[9px] text-amber-300 uppercase font-bold">
              <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-800">CITIZEN SMS</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-800">APP SIREN</span>
              <span className="px-1.5 py-0.5 rounded bg-amber-950/90 border border-amber-800">RADIO / LOUDSPEAKER</span>
            </div>
          </button>
        </div>
      </div>

      {/* Main Alert Message Editor + Directory & Architecture */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Col: Common Alert Message Composer (8 cols) */}
        <div className="lg:col-span-8 bg-[#0e172a] border border-[#1e3156] rounded-lg p-4 space-y-3.5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div>
              <div className="text-xs font-bold text-white uppercase flex items-center gap-2">
                <span>COMMON ALERT MESSAGE COMPOSER</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-sky-300">
                  TIER: {selectedTier.replace("_", " ")}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target Protocol: {currentTierData?.protocol || "CAP-INDIA v1.2 Standard"}
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleCopyMessage}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                title="Copy alert text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? "COPIED" : "COPY TEXT"}</span>
              </button>

              <button
                type="button"
                onClick={handleResetToTemplate}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] flex items-center gap-1 transition-colors border border-slate-700"
                title="Reset to official standard template"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>RESET TEMPLATE</span>
              </button>
            </div>
          </div>

          {/* Quick Contact Selector for Active Tier */}
          <div>
            <label className="block text-slate-400 text-[10px] uppercase font-bold mb-1.5">
              TARGET STAKEHOLDER DIRECTORY ({selectedTier.replace("_", " ")})
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentTierData?.recipients?.map((c, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectContact(c)}
                  className={`p-2 rounded border text-left text-xs transition-colors flex items-center justify-between ${
                    phone === c.phone
                      ? "bg-sky-950/80 border-sky-600 text-sky-200 ring-1 ring-sky-600"
                      : "bg-[#111c34] border-slate-800 hover:border-slate-700 text-slate-300"
                  }`}
                >
                  <div className="truncate mr-2">
                    <div className="font-bold text-white truncate text-[11px]">{c.name}</div>
                    <div className="text-[10px] text-slate-400">{c.role}</div>
                  </div>
                  <span className="text-[10px] font-mono text-sky-400 shrink-0">{c.phone}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSendSingleSMS} className="space-y-3 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-bold text-[10px] uppercase">
                  RECIPIENT CONTACT NUMBER
                </label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-1.5 rounded outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold text-[10px] uppercase">
                  DESIGNATION / RECIPIENT TITLE
                </label>
                <input
                  type="text"
                  value={recipientTitle}
                  onChange={(e) => setRecipientTitle(e.target.value)}
                  className="w-full bg-[#121f3b] border border-slate-700 text-slate-200 px-3 py-1.5 rounded outline-none"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-slate-400 font-bold text-[10px] uppercase">
                  STANDARDIZED ALERT MESSAGE CONTENT ({messageText.length} CHARACTERS)
                </label>
                <span className="text-[10px] text-sky-400 font-mono">
                  {Math.ceil(messageText.length / 160)} SMS Part(s)
                </span>
              </div>
              <textarea
                rows={6}
                required
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-2 rounded outline-none resize-none font-mono text-xs leading-relaxed"
              />
            </div>

            <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2 rounded bg-sky-600 hover:bg-sky-500 text-white font-bold tracking-wider uppercase transition-colors shadow-md shadow-sky-950 flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? "TRANSMITTING TO RECIPIENT..." : "DISPATCH SIMULATED SMS TO RECIPIENT"}</span>
              </button>

              {sendSuccess && (
                <span className="text-emerald-400 text-xs font-bold flex items-center gap-1.5 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>SMS DELIVERED SUCCESSFULLY</span>
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right Col: Multi-Channel Architecture & Citizen App Preview (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Citizen & EOC App Preview */}
          <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-bold text-white uppercase flex items-center gap-1.5">
                <Smartphone className="w-3.5 h-3.5 text-orange-400" />
                CITIZEN & EOC APP PREVIEW
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                LIVE APP PUSH
              </span>
            </div>

            <div className="p-3 bg-[#0a1120] border border-slate-800 rounded text-xs space-y-2 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-red-400 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  HIGH PRIORITY ADVISORY
                </span>
                <span className="text-[9px] text-slate-500">NOW</span>
              </div>
              <div className="font-bold text-slate-100 text-xs line-clamp-1">
                TerraGuard Early Warning • {selectedTier.replace("_", " ")}
              </div>
              <p className="text-[11px] text-slate-300 line-clamp-4 leading-relaxed font-sans bg-slate-900/60 p-2 rounded border border-slate-800">
                {messageText || "Alert message preview will appear here..."}
              </p>
              <div className="flex items-center justify-between pt-1 text-[10px] text-slate-400">
                <span>Dispatch Mode: Instant Push</span>
                <span className="text-sky-400">Zone TG-018</span>
              </div>
            </div>
          </div>

          {/* Gateway & Multi-Channel Architecture */}
          <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg p-3.5 space-y-3 text-xs">
            <div className="text-xs font-bold text-white uppercase border-b border-slate-800 pb-2">
              DISPATCH GATEWAY TELEMETRY
            </div>
            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Active SMS Gateway:</span>
                <span className="text-sky-300 font-bold">{providerStatus?.provider || "LOCAL_SIMULATOR"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Dissemination Latency:</span>
                <span className="text-emerald-400 font-mono">350 - 450 ms</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Auto-Dispatched Count:</span>
                <span className="text-white font-bold">{autoDispatch?.config?.auto_dispatched_count ?? logs.length} alerts</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Total Telemetry Logs:</span>
                <span className="text-sky-400 font-bold">{logs.length}</span>
              </div>
            </div>

            <div className="p-2.5 bg-blue-950/30 border border-blue-800/40 rounded text-[11px] text-slate-400 space-y-1">
              <div className="font-bold text-sky-400 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
                <span>CAP-India & Multi-Channel Pipeline</span>
              </div>
              <div>
                Alerts automatically format for SMS, In-App sirens, and CAP XML feeds for NDMA/SDMA integration.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SMS & Early Warning Dispatch Telemetry Logs Table */}
      <div className="bg-[#0e172a] border border-[#1e3156] rounded-lg overflow-hidden">
        <div className="p-3 border-b border-slate-800 text-xs font-bold text-white uppercase flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span>REAL-TIME MULTI-TIER DISPATCH TELEMETRY LOGS</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              {logs.length} RECORDS
            </span>
          </div>
          <span className="text-[10px] text-slate-400">DISPLAY: SMS & APP DELIVERED — LOCAL DEMO</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#091122] text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
              <tr>
                <th className="p-3">MESSAGE ID</th>
                <th className="p-3">AUDIENCE TIER</th>
                <th className="p-3">RECIPIENT & TITLE</th>
                <th className="p-3">CHANNEL</th>
                <th className="p-3">ZONE</th>
                <th className="p-3">RISK SCORE</th>
                <th className="p-3">DELIVERY STATUS</th>
                <th className="p-3">TIMESTAMP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {logs.map((sms) => {
                const tier = sms.audienceTier || "DISTRICT_ADMIN";
                const tierBadge = 
                  tier === "DISTRICT_ADMIN" 
                    ? "bg-indigo-950/80 text-indigo-300 border-indigo-700"
                    : tier === "DISASTER_AUTHORITIES"
                    ? "bg-purple-950/80 text-purple-300 border-purple-700"
                    : "bg-amber-950/80 text-amber-300 border-amber-700";

                return (
                  <tr key={sms.messageId} className="hover:bg-[#111c34] transition-colors">
                    <td className="p-3 font-bold text-sky-400">{sms.messageId}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${tierBadge}`}>
                        {tier.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="text-slate-200 font-bold">{sms.recipient}</div>
                      {sms.recipientTitle && (
                        <div className="text-[10px] text-slate-400 font-sans">{sms.recipientTitle}</div>
                      )}
                    </td>
                    <td className="p-3">
                      <span className="text-[10px] text-slate-300 px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {sms.channel || sms.type || "SMS"}
                      </span>
                    </td>
                    <td className="p-3 text-white font-bold">{sms.zoneId}</td>
                    <td className="p-3">
                      <RiskBadge level={sms.severity} score={sms.riskScore} />
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                        {sms.displayStatus || "SMS DELIVERED — LOCAL DEMO"}
                      </span>
                    </td>
                    <td className="p-3 text-slate-500">
                      {new Date(sms.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
