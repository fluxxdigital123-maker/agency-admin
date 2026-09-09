import React from "react";
import { Users, Eye, Target, Clock } from "lucide-react";
import { fmtNumber, fmtDate } from "@/lib/format";

export default function AnalyticsStats({ latest, snapshots }) {
  const ctrValues = (snapshots || [])
    .map((s) => s.impressionsCTR)
    .filter((v) => v != null && !isNaN(Number(v)));
  const avgCtr = ctrValues.length
    ? ctrValues.reduce((a, b) => a + Number(b), 0) / ctrValues.length
    : null;

  const cards = [
    {
      label: "Subscribers",
      value: latest?.subscribers != null ? fmtNumber(latest.subscribers) : "—",
      icon: Users,
      color: "#0A84FF",
      sub: latest ? `as of ${fmtDate(latest.date)}` : "No data yet",
    },
    {
      label: "Total Views",
      value: latest?.views != null ? fmtNumber(latest.views) : "—",
      icon: Eye,
      color: "#30D158",
      sub: latest ? "lifetime channel views" : "No data yet",
    },
    {
      label: "Avg CTR",
      value: avgCtr != null ? `${Number(avgCtr).toFixed(1)}%` : "—",
      icon: Target,
      color: "#FF9F0A",
      sub: "across snapshots",
    },
    {
      label: "Watch Hours",
      value: latest?.watchHours != null ? fmtNumber(latest.watchHours) : "—",
      icon: Clock,
      color: "#BF5AF2",
      sub: "latest snapshot",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div key={c.label} className="glass-card p-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">{c.label}</span>
              <Icon className="w-4 h-4" style={{ color: c.color }} />
            </div>
            <div className="text-[24px] font-semibold tracking-tight mt-2 tabular-nums">{c.value}</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}