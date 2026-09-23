"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  TrendingUp, 
  Clock, 
  Activity, 
  ShieldAlert,
  Flame,
  CheckCircle2
} from "lucide-react";
import { api } from "@/lib/api";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer, 
  CartesianGrid, 
  Legend 
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await api.getAnalytics();
        setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const hourly = data?.hourly_trends || [];
  const districts = data?.district_risk || [];
  const categories = data?.incident_categories || [];
  const metrics = data?.response_metrics || {
    mean_time_to_detect_min: 4.2,
    mean_time_to_warn_min: 1.8,
    mean_time_to_dispatch_min: 12.5,
    alerts_issued_24h: 18,
    sms_notifications_delivered: 142,
  };

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto font-mono">
      {/* Header */}
      <div className="p-3 bg-[#0e172a] border border-[#1e3156] rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-sm font-extrabold text-white flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-sky-400" />
            REGIONAL DISASTER INTELLIGENCE & ANALYTICS
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Temporal Risk Evolution, Climatological Triggers & Emergency Operations Response Metrics
          </p>
        </div>
      </div>

      {/* KPI Response Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0e172a] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-sky-400" />
            <span>MEAN TIME TO DETECT</span>
          </div>
          <div className="text-2xl font-black text-sky-400 mt-1">
            {metrics.mean_time_to_detect_min} min
          </div>
          <div className="text-[10px] text-slate-500">From trigger onset</div>
        </div>

        <div className="p-3 bg-[#0e172a] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span>MEAN TIME TO WARN</span>
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">
            {metrics.mean_time_to_warn_min} min
          </div>
          <div className="text-[10px] text-slate-500">Automated SMS dispatch</div>
        </div>

        <div className="p-3 bg-[#0e172a] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
            <span>24H ALERTS ISSUED</span>
          </div>
          <div className="text-2xl font-black text-red-400 mt-1">
            {metrics.alerts_issued_24h}
          </div>
          <div className="text-[10px] text-slate-500">Zero false alarms</div>
        </div>

        <div className="p-3 bg-[#0e172a] border border-slate-800 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-400" />
            <span>SMS DELIVERED</span>
          </div>
          <div className="text-2xl font-black text-purple-400 mt-1">
            {metrics.sms_notifications_delivered}
          </div>
          <div className="text-[10px] text-slate-500">Local simulation & gateway</div>
        </div>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* District Risk Bar Chart */}
        <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg">
          <div className="text-xs font-bold text-white uppercase mb-3">
            AVERAGE OPERATIONAL RISK BY DISTRICT
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={districts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis type="number" domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <YAxis dataKey="district" type="category" width={110} stroke="#64748b" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", fontSize: 12 }} />
                <Bar dataKey="average_risk" fill="#ef4444" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Temporal Trends Line Chart */}
        <div className="p-4 bg-[#0e172a] border border-[#1e3156] rounded-lg">
          <div className="text-xs font-bold text-white uppercase mb-3">
            TEMPORAL RISK ACCELERATION BY NER STATE (HOURLY)
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={hourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f293d" />
                <XAxis dataKey="time" stroke="#64748b" fontSize={11} />
                <YAxis domain={[0, 100]} stroke="#64748b" fontSize={11} />
                <RechartsTooltip contentStyle={{ backgroundColor: "#0b1329", borderColor: "#1e293b", fontSize: 12 }} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="Sikkim" stroke="#ef4444" strokeWidth={2.5} />
                <Line type="monotone" dataKey="Nagaland" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="Meghalaya" stroke="#38bdf8" strokeWidth={2} />
                <Line type="monotone" dataKey="Arunachal" stroke="#a855f7" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
