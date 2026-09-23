"use client";

import React, { useState, useEffect } from "react";
import { MetricRow } from "@/components/dashboard/MetricRow";
import { RiskMap } from "@/components/map/RiskMap";
import { AIRiskPredictionCard } from "@/components/risk/AIRiskPredictionCard";
import { TimelineQueueRow } from "@/components/dashboard/TimelineQueueRow";
import { ZoneDetailDrawer } from "@/components/map/ZoneDetailDrawer";
import { api } from "@/lib/api";
import { 
  DashboardData, 
  ZoneFeature, 
  ZoneRiskEvaluation, 
  RoadCorridor 
} from "@/types";

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [zones, setZones] = useState<ZoneFeature[]>([]);
  const [roads, setRoads] = useState<RoadCorridor[]>([]);
  const [historicalPoints, setHistoricalPoints] = useState<any[]>([]);
  const [selectedZone, setSelectedZone] = useState<ZoneFeature | null>(null);
  const [zoneRiskEval, setZoneRiskEval] = useState<ZoneRiskEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [riskLoading, setRiskLoading] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [dash, zonesGeo, roadsData] = await Promise.all([
        api.getDashboard().catch(() => null),
        api.getZones().catch(() => ({ type: "FeatureCollection", features: [] })),
        api.getRoads().catch(() => []),
      ]);

      if (dash) setDashboardData(dash);
      if (zonesGeo && zonesGeo.features) {
        setZones(zonesGeo.features);
        // Default select Zone TG-018 (Gangtok Corridor) as primary focus
        const defaultZone = zonesGeo.features.find((f: ZoneFeature) => f.id === "TG-018") || zonesGeo.features[0];
        if (defaultZone) {
          setSelectedZone(defaultZone);
          fetchZoneRisk(defaultZone.id);
        }
      }
      if (roadsData) setRoads(roadsData);
    } catch (err) {
      console.error("Failed loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchZoneRisk = async (zoneId: string) => {
    try {
      setRiskLoading(true);
      const evalRes = await api.getZoneRisk(zoneId);
      setZoneRiskEval(evalRes);
    } catch (err) {
      console.error(`Failed loading risk evaluation for ${zoneId}:`, err);
    } finally {
      setRiskLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Event listener for judge demo emergency scenario trigger
    const onScenarioTriggered = () => {
      loadData();
      fetchZoneRisk("TG-018");
    };

    window.addEventListener("terraguard:scenario-triggered", onScenarioTriggered);
    window.addEventListener("terraguard:scenario-reset", onScenarioTriggered);
    return () => {
      window.removeEventListener("terraguard:scenario-triggered", onScenarioTriggered);
      window.removeEventListener("terraguard:scenario-reset", onScenarioTriggered);
    };
  }, []);

  const handleSelectZone = (zone: ZoneFeature) => {
    setSelectedZone(zone);
    fetchZoneRisk(zone.id);
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto">
      {/* Row 1: Executive Key Metrics */}
      <MetricRow
        metrics={
          dashboardData?.metrics || {
            monitored_zones: 1284,
            critical_zones: 47,
            active_alerts: 18,
            blocked_roads: 12,
            population_at_risk: 84210,
          }
        }
        demoMode={dashboardData?.demo_mode}
      />

      {/* Row 2: GIS Risk Map (Left) + AI Risk Prediction Card (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        <div className="lg:col-span-8 relative">
          <RiskMap
            zones={zones}
            selectedZoneId={selectedZone?.id}
            onSelectZone={handleSelectZone}
            roads={roads}
            historicalPoints={historicalPoints}
            height="500px"
          />
          {selectedZone && (
            <ZoneDetailDrawer zone={selectedZone} onClose={() => setSelectedZone(null)} />
          )}
        </div>

        <div className="lg:col-span-4">
          <AIRiskPredictionCard
            evaluation={zoneRiskEval}
            loading={riskLoading}
            zones={zones}
            onSelectZoneId={(id) => {
              const target = zones.find((f) => f.id === id);
              if (target) handleSelectZone(target);
            }}
          />
        </div>
      </div>

      {/* Row 3: Live Incident Timeline + Emergency Priority Queue */}
      <TimelineQueueRow
        timeline={dashboardData?.timeline || []}
        priorityQueue={dashboardData?.priority_queue || []}
        onSelectZone={(id) => {
          const target = zones.find((f) => f.id === id);
          if (target) handleSelectZone(target);
        }}
      />
    </div>
  );
}
