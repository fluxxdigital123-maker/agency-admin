import React, { useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { STATUS_LABELS, STATUS_ORDER, STATUS_HEX } from "./LeadCard";
import { fmtMoneyShort } from "@/lib/revenueForecast";
import { fmtMoney } from "@/lib/format";
import { BarChart3 } from "lucide-react";

export default function PipelineValueChart({ leads = [] }) {
  const data = useMemo(() => {
    return STATUS_ORDER.map((s) => {
      const list = leads.filter((l) => l.status === s);
      const value = list.reduce((sum, l) => sum + (l.upfrontCash || 0) + (l.monthlyRecurring || 0) * 12, 0);
      return { stage: STATUS_LABELS[s], value: Math.round(value), count: list.length, hex: STATUS_HEX[s] };
    });
  }, [leads]);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Pipeline Value by Stage</h2>
        </div>
        <span className="text-[14px] font-semibold tabular-nums">{fmtMoney(total)}</span>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Annualized deal value (upfront + 12× monthly) across each pipeline stage.
      </p>
      <div className="h-[260px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(128,128,128,0.18)" vertical={false} />
            <XAxis dataKey="stage" tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.5)" tickLine={false} axisLine={false} />
            <YAxis tickFormatter={fmtMoneyShort} tick={{ fontSize: 12 }} stroke="rgba(128,128,128,0.5)" tickLine={false} axisLine={false} width={56} />
            <Tooltip
              formatter={(v) => fmtMoney(v)}
              contentStyle={{
                background: "rgba(20,20,22,0.9)",
                border: "0.5px solid rgba(255,255,255,0.1)",
                borderRadius: 12,
                color: "#fff",
                fontSize: 13,
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={64}>
              {data.map((d) => (
                <Cell key={d.stage} fill={d.hex} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}