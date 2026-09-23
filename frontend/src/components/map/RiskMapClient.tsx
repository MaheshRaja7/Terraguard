"use client";

import React, { useState, useEffect } from "react";
import { 
  MapContainer, 
  TileLayer, 
  Polygon, 
  CircleMarker, 
  Popup, 
  Tooltip, 
  Polyline,
  useMap
} from "react-leaflet";
import { 
  AlertTriangle, 
  Layers, 
  MapPin, 
  Activity, 
  Droplets, 
  Mountain, 
  ShieldAlert,
  Users,
  Eye
} from "lucide-react";
import { ZoneFeature, ThreatLevel, RoadCorridor } from "@/types";
import { RiskBadge, PriorityBadge, SourceBadge } from "@/components/common/StatusBadges";

interface RiskMapClientProps {
  zones: ZoneFeature[];
  selectedZoneId?: string;
  onSelectZone: (zone: ZoneFeature) => void;
  roads?: RoadCorridor[];
  historicalPoints?: any[];
  height?: string;
}

function getRiskColor(score: number): string {
  if (score < 26) return "#10b981"; // Low (green)
  if (score < 51) return "#f59e0b"; // Moderate (amber)
  if (score < 76) return "#f97316"; // High (orange)
  return "#ef4444"; // Critical (crimson)
}

function MapController({ selectedZone }: { selectedZone?: ZoneFeature }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 150);
    return () => clearTimeout(timer);
  }, [map]);

  useEffect(() => {
    if (selectedZone && selectedZone.geometry?.coordinates?.[0]?.[0]) {
      const coords = selectedZone.geometry.coordinates[0];
      const lat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      const lon = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
      map.flyTo([lat, lon], 9, { duration: 1.2 });
    }
  }, [selectedZone, map]);

  return null;
}

export default function RiskMapClient({
  zones,
  selectedZoneId,
  onSelectZone,
  roads = [],
  historicalPoints = [],
  height = "520px",
}: RiskMapClientProps) {
  const [showZones, setShowZones] = useState(true);
  const [showHistorical, setShowHistorical] = useState(true);
  const [showRoads, setShowRoads] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>("ALL");

  // Center on North Eastern Region (Sikkim to Assam/Nagaland)
  const defaultCenter: [number, number] = [26.4, 91.8];
  const defaultZoom = 7;

  const filteredZones = zones.filter((z) => {
    if (activeFilter === "ALL") return true;
    const liveScore = Number(z.properties.risk_score ?? z.properties.baseline_susceptibility ?? 0);
    if (activeFilter === "CRITICAL") return liveScore >= 76 || z.id === "TG-018";
    if (activeFilter === "HIGH") return liveScore >= 51 && liveScore < 76;
    if (activeFilter === "MODERATE") return liveScore >= 26 && liveScore < 51;
    return liveScore < 26;
  });

  const selectedZone = zones.find((z) => z.id === selectedZoneId);

  return (
    <div className="relative w-full rounded-lg overflow-hidden border border-[#1b2b4b] bg-[#091122]">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-wrap items-center gap-2 bg-[#0c162cf0] backdrop-blur p-2 rounded border border-[#22365e] shadow-xl text-xs">
        <div className="flex items-center gap-1 font-mono text-slate-400 font-bold uppercase mr-1">
          <Layers className="w-3.5 h-3.5 text-sky-400" />
          <span>LAYERS:</span>
        </div>

        <button
          onClick={() => setShowZones(!showZones)}
          className={`px-2 py-1 rounded font-mono border transition-colors ${
            showZones
              ? "bg-sky-950 text-sky-300 border-sky-600"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          Risk Zones ({zones.length})
        </button>

        <button
          onClick={() => setShowRoads(!showRoads)}
          className={`px-2 py-1 rounded font-mono border transition-colors ${
            showRoads
              ? "bg-amber-950 text-amber-300 border-amber-600"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          Lifeline Corridors ({roads.length})
        </button>

        <button
          onClick={() => setShowHistorical(!showHistorical)}
          className={`px-2 py-1 rounded font-mono border transition-colors ${
            showHistorical
              ? "bg-indigo-950 text-indigo-300 border-indigo-600"
              : "bg-slate-800 text-slate-400 border-slate-700"
          }`}
        >
          ISRO Inventory ({historicalPoints.length})
        </button>

        <div className="h-4 w-[1px] bg-slate-700 mx-1 hidden sm:block" />

        {/* Threat filter */}
        <div className="flex items-center gap-1">
          {["ALL", "CRITICAL", "HIGH", "MODERATE"].map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                activeFilter === f
                  ? "bg-red-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-3 right-3 z-[1000] bg-[#0c162cf0] backdrop-blur p-2.5 rounded border border-[#22365e] text-[11px] font-mono space-y-1 shadow-2xl">
        <div className="font-bold text-slate-300 text-xs mb-1">RISK LEVEL LEGEND</div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-red-500 shadow-sm shadow-red-500" />
          <span className="text-slate-200 font-bold">CRITICAL (76–100)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-orange-500" />
          <span className="text-slate-300">HIGH (51–75)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-amber-500" />
          <span className="text-slate-300">MODERATE (26–50)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded bg-emerald-500" />
          <span className="text-slate-300">LOW (0–25)</span>
        </div>
        <div className="pt-1 border-t border-slate-700/60 text-[10px] text-slate-400">
          Source: ISRO Landslide Atlas 2023 + Open-Meteo
        </div>
      </div>

      <div style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
        >
          {/* OpenStreetMap with EOC dark mode filter */}
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            className="eoc-map-tiles"
          />
          <MapController selectedZone={selectedZone} />

          {/* Render Hazard Risk Polygons */}
          {showZones &&
            filteredZones.map((zone) => {
              const p = zone.properties;
              const isSelected = selectedZoneId === zone.id;
              const liveRiskScore = Number(p.risk_score ?? p.baseline_susceptibility ?? 0);
              // Coordinates in GeoJSON are [lon, lat], Leaflet Polygon expects [lat, lon]
              const leafletCoords = zone.geometry.coordinates[0].map(([lon, lat]) => [lat, lon] as [number, number]);
              const color = getRiskColor(liveRiskScore);

              return (
                <Polygon
                  key={zone.id}
                  positions={leafletCoords}
                  pathOptions={{
                    color: isSelected ? "#38bdf8" : color,
                    weight: isSelected ? 3 : 2,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.75 : 0.45,
                    dashArray: isSelected ? "4 4" : undefined,
                  }}
                  eventHandlers={{
                    click: () => onSelectZone(zone),
                  }}
                >
                  <Tooltip sticky direction="top">
                    <div className="text-xs font-mono p-1 bg-slate-900 text-white rounded">
                      <div className="font-bold text-sky-400">{p.id}: {p.name}</div>
                      <div>District: {p.district} ({p.state})</div>
                      <div>Live Risk Score: {liveRiskScore}/100</div>
                      <div>Rainfall: {(p.live_weather?.rain_24h ?? 0).toFixed(1)} mm | Soil: {(p.live_weather?.soil_moisture_0_7 ?? 0).toFixed(3)}</div>
                      <div>Slope: {p.slope}° | Pop: {p.population_at_risk?.toLocaleString()}</div>
                    </div>
                  </Tooltip>
                </Polygon>
              );
            })}

          {/* Render Historical Landslide Points (ISRO / NRSC Inventory) */}
          {showHistorical &&
            historicalPoints.map((pt, i) => (
              <CircleMarker
                key={pt.event_id || i}
                center={[pt.latitude, pt.longitude]}
                radius={3.5}
                pathOptions={{
                  color: "#a855f7",
                  fillColor: "#c084fc",
                  fillOpacity: 0.8,
                  weight: 1,
                }}
              >
                <Popup>
                  <div className="text-xs font-mono text-slate-900 p-1">
                    <div className="font-bold text-purple-700">{pt.title || "Historical Slide Point"}</div>
                    <div>Date: {pt.date || "Historical Record"}</div>
                    <div>Trigger: {pt.trigger}</div>
                    <div>Location: {pt.location_description || pt.state}</div>
                    <div className="text-[10px] text-slate-500 mt-1">Source: ISRO Landslide Atlas 2023</div>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* Render Critical Road Corridors and Blockages */}
          {showRoads &&
            roads.map((road) => {
              const isBlocked = road.status === "BLOCKED";
              return (
                <React.Fragment key={road.id}>
                  {/* Simplified representative highway polyline segments */}
                  <CircleMarker
                    center={
                      road.id === "RD-NH10"
                        ? [27.0667, 88.4667]
                        : road.id === "RD-NH29"
                        ? [25.6751, 94.1086]
                        : [24.8167, 93.6000]
                    }
                    radius={isBlocked ? 9 : 6}
                    pathOptions={{
                      color: isBlocked ? "#ef4444" : "#f59e0b",
                      fillColor: isBlocked ? "#b91c1c" : "#d97706",
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs font-mono p-1 text-slate-900">
                        <div className="font-bold">{road.name}</div>
                        <div className={`font-bold ${isBlocked ? "text-red-600" : "text-amber-600"}`}>
                          STATUS: {road.status}
                        </div>
                        <div>Blockage: {road.blockage_location}</div>
                        <div className="text-[10px] mt-1 text-slate-600">Bypass: {road.alternative_route}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
        </MapContainer>
      </div>
    </div>
  );
}
