import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { buildRevenueForecast, fmtMoneyShort } from "@/lib/revenueForecast";
import { fmtMoney } from "@/lib/format";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { TrendingUp, Loader2 } from "lucide-react";

export default function RevenueForecast({ clients = [] }) {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newPerMonth, setNewPerMonth] = useState(2);

  useEffect(() => {
    let active = true;
    base44.entities.Lead.list("-created_date", 500)
      .then((l) => { if (active) setLeads(l || []); })
      .catch(() => {})
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const forecast = useMemo(
    () => buildRevenueForecast(clients, leads, newPerMonth, 6),
    [clients, leads, newPerMonth]
  );

  const endExpected = forecast.series[forecast.series.length - 1]?.expected || 0;
  const endBest = forecast.series[forecast.series.length - 1]?.best || 0;
  const endWorst = forecast.series[forecast.series.length - 1]?.worst || 0;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <TrendingUp className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[20px] font-semibold tracking-tight">Revenue Forecast</h2>
      </div>
      <p className="text-[14px] text-muted-foreground mb-4">
        Projected MRR for the next 6 months — active clients, weighted pipeline leads, known churn,
        and a scenario for new client signups.
      </p>

      {loading ? (
        <div className="flex items-center justify-center h-[280px]">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            <Metric label="Current MRR" value={fmtMoney(forecast.currentMrr)} />
            <Metric label="Expected (mo 6)" value={fmtMoney(endExpected)} tone="#0A84FF" />
            <Metric label="Best case" value={fmtMoney(endBest)} tone="#30D158" />
            <Metric label="Worst case" value={fmtMoney(endWorst)} tone="#FF453A" />
          </div>

          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={forecast.series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.18} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.5)" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmtMoneyShort} tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.5)" tickLine={false} axisLine={false} width={56} />
                <Tooltip
                  formatter={(v, n) => [fmtMoney(v), n === "band" ? "Range" : n.charAt(0).toUpperCase() + n.slice(1)]}
                  contentStyle={{
                    background: "rgba(20,20,22,0.9)",
                    border: "0.5px solid rgba(255,255,255,0.1)",
                    borderRadius: 12,
                    color: "#fff",
                    fontSize: 13,
                  }}
                />
                <Area dataKey="worst" stackId="band" stroke="none" fill="transparent" legendType="none" />
                <Area dataKey="band" stackId="band" stroke="none" fill="url(#bandFill)" legendType="none" />
                <Line dataKey="best" stroke="#30D158" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
                <Line dataKey="expected" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 3 }} />
                <Line dataKey="worst" stroke="#FF453A" strokeWidth={1.5} strokeDasharray="5 4" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-4 text-[12px] text-muted-foreground">
            <Legend color="#0A84FF" label="Expected" />
            <Legend color="#30D158" label="Best" dashed />
            <Legend color="#FF453A" label="Worst" dashed />
            <Legend color="hsl(var(--primary) / 0.25)" label="Range" square />
          </div>

          <div className="mt-6 rounded-[12px] bg-background/50 border border-border p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[14px] font-medium">New clients / month</span>
              <span className="text-[15px] font-semibold tabular-nums">{newPerMonth}</span>
            </div>
            <input
              type="range"
              min={0}
              max={10}
              step={1}
              value={newPerMonth}
              onChange={(e) => setNewPerMonth(Number(e.target.value))}
              className="w-full accent-[hsl(var(--primary))]"
            />
            <div className="flex items-center justify-between text-[11px] text-muted-foreground mt-1">
              <span>0</span>
              <span>~{fmtMoney(forecast.avgMrr)} avg MRR / new client</span>
              <span>10</span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Metric({ label, value, tone }) {
  return (
    <div className="rounded-[12px] bg-background/50 border border-border p-3">
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[18px] font-semibold tracking-tight mt-0.5" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
    </div>
  );
}

function Legend({ color, label, dashed, square }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        style={{
          background: square ? color : "transparent",
          borderColor: color,
          borderStyle: dashed ? "dashed" : "solid",
        }}
        className={square ? "w-3 h-3 rounded-sm border" : "w-4 h-0.5 rounded"}
      />
      {label}
    </span>
  );
}