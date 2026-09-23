"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MapPin,
  Cpu,
  CloudRain,
  Droplets,
  AlertOctagon,
  MessageSquare,
  Sliders,
  Route,
  FileText,
  BarChart3,
  Settings,
  ShieldCheck,
  Flame,
  Truck,
  FilePlus2,
  FolderGit2
} from "lucide-react";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
  badgeColor?: string;
}

export function Sidebar() {
  const pathname = usePathname();

  const navigation: { section: string; items: NavItem[] }[] = [
    {
      section: "CORE OPERATIONS",
      items: [
        { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { name: "GIS Risk Map", href: "/risk-map", icon: MapPin },
        { name: "AI Prediction", href: "/ai-prediction", icon: Cpu },
        { name: "Early Alerts", href: "/alerts", icon: AlertOctagon, badge: "18", badgeColor: "bg-red-950 text-red-400 border border-red-800/50" },
        { name: "SMS Center", href: "/alerts/sms", icon: MessageSquare, badge: "LOCAL", badgeColor: "bg-sky-950 text-sky-400 border border-sky-800/50" },
      ],
    },
    {
      section: "METEOROLOGY & SOIL",
      items: [
        { name: "Weather Radar", href: "/weather", icon: CloudRain },
        { name: "Soil Moisture", href: "/soil-moisture", icon: Droplets },
      ],
    },
    {
      section: "FIELD RESPONSE & LOGISTICS",
      items: [
        { name: "Field Incidents", href: "/incidents", icon: Flame },
        { name: "Report Incident", href: "/incidents/report", icon: FilePlus2 },
        { name: "Road Corridors", href: "/roads", icon: Truck, badge: "NH-10", badgeColor: "bg-amber-950 text-amber-400 border border-amber-800/50" },
        { name: "Safe Route", href: "/safe-route", icon: Route },
      ],
    },
    {
      section: "DECISION SUPPORT",
      items: [
        { name: "Risk Simulator", href: "/risk-simulator", icon: Sliders },
        { name: "Analytics", href: "/analytics", icon: BarChart3 },
        { name: "Reports Export", href: "/reports", icon: FileText },
      ],
    },
    {
      section: "GOVERNANCE & DEMO",
      items: [
        { name: "Judge Demo Flow", href: "/demo", icon: ShieldCheck, badge: "SIH", badgeColor: "bg-purple-950 text-purple-400 border border-purple-800/50" },
        { name: "Admin & Data", href: "/admin", icon: FolderGit2 },
        { name: "Settings", href: "/settings", icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#091122] border-r border-[#192849] flex flex-col flex-shrink-0 h-[calc(100vh-53px)] sticky top-[53px] overflow-y-auto">
      <div className="px-3 py-4 space-y-6">
        {navigation.map((group) => (
          <div key={group.section} className="space-y-1">
            <h3 className="px-3 text-[10px] font-mono uppercase tracking-wider text-slate-400 font-semibold">
              {group.section}
            </h3>
            <nav className="space-y-0.5 mt-1">
              {group.items.map((item) => {
                const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center justify-between px-3 py-2 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? "bg-red-600/15 text-red-400 border border-red-500/30 font-semibold"
                        : "text-slate-300 hover:bg-[#121e38] hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? "text-red-400" : "text-slate-400"}`} />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && (
                      <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${item.badgeColor}`}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Footer Branding Info */}
      <div className="mt-auto p-3 border-t border-[#192849] bg-[#070c18] text-[11px] text-slate-400 font-mono">
        <div className="flex items-center justify-between text-slate-400">
          <span>AI ENGINE</span>
          <span className="text-emerald-400">XGBoost + SHAP</span>
        </div>
        <div className="flex items-center justify-between text-slate-400 mt-1">
          <span>HISTORICAL</span>
          <span className="text-slate-300">ISRO Landslide Atlas</span>
        </div>
      </div>
    </aside>
  );
}
