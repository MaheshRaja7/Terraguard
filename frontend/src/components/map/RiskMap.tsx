"use client";

import dynamic from "next/dynamic";
import React from "react";

const DynamicRiskMapClient = dynamic(() => import("./RiskMapClient"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[520px] rounded-lg bg-[#091122] border border-[#1b2b4b] flex flex-col items-center justify-center text-slate-400 font-mono text-xs gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-sky-400 border-t-transparent animate-spin" />
      <span>INITIALIZING NER GIS RISK MAP TILES...</span>
    </div>
  ),
});

export function RiskMap(props: any) {
  return <DynamicRiskMapClient {...props} />;
}
