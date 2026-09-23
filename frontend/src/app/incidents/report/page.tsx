"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { 
  FilePlus2, 
  MapPin, 
  Camera, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  WifiOff, 
  ArrowLeft,
  Navigation
} from "lucide-react";
import Link from "next/link";
import { api } from "@/lib/api";
import { offlineDb } from "@/lib/offline-db";
import { ThreatLevel } from "@/types";

export default function ReportIncidentPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    type: "LANDSLIDE",
    severity: "HIGH" as ThreatLevel,
    latitude: 27.33,
    longitude: 88.61,
    accuracy: 10,
    district: "East Sikkim",
    state: "Sikkim",
    description: "",
    road_blocked: false,
    road_name: "NH-10 Lifeline Highway",
    reporter_name: "Field Officer (SDMA Gangtok)",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setFormData((prev) => ({
          ...prev,
          latitude: Number(pos.coords.latitude.toFixed(5)),
          longitude: Number(pos.coords.longitude.toFixed(5)),
          accuracy: Math.round(pos.coords.accuracy),
        }));
        setIsLocating(false);
      },
      (err) => {
        console.warn("Location error:", err);
        setIsLocating(false);
        // Default to Gangtok coordinates
        setFormData((prev) => ({ ...prev, latitude: 27.3314, longitude: 88.6138 }));
      },
      { timeout: 8000 }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

    try {
      if (isOnline) {
        if (mediaFiles.length > 0) {
          await api.uploadIncident(formData, mediaFiles);
          setSuccessMsg("Incident report and attached media transmitted successfully to EOC Command Center.");
        } else {
          await api.createIncident(formData);
          setSuccessMsg("Incident report transmitted successfully to EOC Command Center.");
        }
      } else {
        await offlineDb.queueReport("INCIDENT", { ...formData, mediaFiles });
        setSuccessMsg("OFFLINE MODE: Report saved to local IndexedDB queue. Will auto-sync when network connectivity returns.");
      }

      setTimeout(() => {
        router.push("/incidents");
      }, 2500);
    } catch (err) {
      await offlineDb.queueReport("INCIDENT", { ...formData, mediaFiles });
      setSuccessMsg("Network unreachable. Report queued locally in IndexedDB.");
      setTimeout(() => router.push("/incidents"), 2500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4 font-mono">
      {/* Back Link */}
      <Link
        href="/incidents"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>BACK TO INCIDENT LOGS</span>
      </Link>

      {/* Main Form Box */}
      <div className="p-5 bg-[#0e172a] border border-[#1e3156] rounded-lg shadow-2xl space-y-4">
        <div>
          <h1 className="text-base font-extrabold text-white flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-sky-400" />
            FIELD INCIDENT & ROAD HAZARD REPORT
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Offline-capable geo-tagged dispatch form for emergency field teams and patrol units
          </p>
        </div>

        {successMsg ? (
          <div className="p-4 bg-emerald-950/50 border border-emerald-700/60 rounded text-emerald-300 text-xs space-y-2">
            <div className="flex items-center gap-2 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              <span>DISPATCH CONFIRMED</span>
            </div>
            <div>{successMsg}</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Category & Severity Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase">
                  INCIDENT CATEGORY
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-2 rounded outline-none"
                >
                  <option value="LANDSLIDE">LANDSLIDE / MUDFLOW</option>
                  <option value="CRACK">SURFACE TENSION CRACK</option>
                  <option value="ROCKFALL">ROCKFALL / UNSTABLE OVERHANG</option>
                  <option value="ROAD_BLOCKAGE">ROAD BLOCKAGE</option>
                  <option value="HEAVY_RAIN">EXTREME LOCALIZED RAIN</option>
                  <option value="DRAINAGE_FAILURE">DRAINAGE CULVERT FAILURE</option>
                  <option value="INFRASTRUCTURE_DAMAGE">BRIDGE / BUILDING DAMAGE</option>
                  <option value="OTHER">OTHER HAZARD</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-bold uppercase">
                  HAZARD SEVERITY
                </label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                  className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-2 rounded outline-none"
                >
                  <option value="CRITICAL">CRITICAL (Immediate Threat)</option>
                  <option value="HIGH">HIGH (Imminent Hazard)</option>
                  <option value="MODERATE">MODERATE (Patrol Required)</option>
                  <option value="LOW">LOW (Monitored)</option>
                </select>
              </div>
            </div>

            {/* GPS Geo-Tagging */}
            <div className="p-3 bg-[#111c34] border border-slate-800 rounded space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300 font-bold flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-sky-400" />
                  GPS GEO-TAGGING
                </span>
                <button
                  type="button"
                  onClick={handleGetLocation}
                  disabled={isLocating}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 bg-sky-950 text-sky-300 border border-sky-700 rounded hover:bg-sky-900"
                >
                  <Navigation className="w-3 h-3" />
                  {isLocating ? "Acquiring GPS..." : "Auto-Detect GPS"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-slate-300">
                <div>
                  <span className="text-[10px] text-slate-500">LATITUDE</span>
                  <input
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0a1224] border border-slate-700 px-2 py-1 rounded text-white"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-500">LONGITUDE</span>
                  <input
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-[#0a1224] border border-slate-700 px-2 py-1 rounded text-white"
                  />
                </div>
              </div>
            </div>

            {/* Road Blockage Checkbox & Road Name */}
            <div className="p-3 bg-[#111c34] border border-slate-800 rounded space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.road_blocked}
                  onChange={(e) => setFormData({ ...formData, road_blocked: e.target.checked })}
                  className="w-4 h-4 rounded text-red-600 bg-slate-800 border-slate-600"
                />
                <span className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                  <Truck className="w-4 h-4" />
                  INCIDENT CAUSED COMPLETE / PARTIAL ROAD BLOCKAGE
                </span>
              </label>

              {formData.road_blocked && (
                <div>
                  <label className="block text-[10px] text-slate-400 mb-1">AFFECTED HIGHWAY / ROAD</label>
                  <input
                    type="text"
                    value={formData.road_name}
                    onChange={(e) => setFormData({ ...formData, road_name: e.target.value })}
                    placeholder="e.g. NH-10 (Sevoke-Gangtok), NH-29..."
                    className="w-full bg-[#0a1224] border border-slate-700 px-3 py-1.5 rounded text-white outline-none"
                  />
                </div>
              )}
            </div>

            {/* Media Upload */}
            <div className="p-3 bg-[#111c34] border border-slate-800 rounded space-y-2">
              <label className="block text-slate-400 mb-1 font-bold uppercase flex items-center gap-2">
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                PHOTO / VIDEO EVIDENCE
              </label>
              <input
                type="file"
                accept="image/*,video/*"
                multiple
                onChange={(e) => setMediaFiles(Array.from(e.target.files || []))}
                className="block w-full text-[11px] text-slate-300 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:bg-sky-900 file:text-sky-100 file:font-bold"
              />
              {mediaFiles.length > 0 && (
                <div className="flex flex-wrap gap-2 text-[10px] text-slate-300">
                  {mediaFiles.map((file, idx) => (
                    <span key={`${file.name}-${idx}`} className="px-2 py-1 rounded bg-slate-800 border border-slate-700">
                      {file.name}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold uppercase">
                DETAILED HAZARD DESCRIPTION & SIGHTINGS
              </label>
              <textarea
                rows={3}
                required
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe slide width, debris depth, visible slope fissures, affected houses or blocked culverts..."
                className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-2 rounded outline-none resize-none"
              />
            </div>

            {/* Reporter Identification */}
            <div>
              <label className="block text-slate-400 mb-1 font-bold uppercase">
                OFFICER / WARDEN IDENTITY
              </label>
              <input
                type="text"
                value={formData.reporter_name}
                onChange={(e) => setFormData({ ...formData, reporter_name: e.target.value })}
                className="w-full bg-[#121f3b] border border-slate-700 text-white px-3 py-1.5 rounded outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded bg-red-600 hover:bg-red-500 font-bold text-white tracking-wider uppercase transition-all shadow-lg shadow-red-950 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "TRANSMITTING TO COMMAND CENTER..." : "TRANSMIT FIELD INCIDENT REPORT"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
