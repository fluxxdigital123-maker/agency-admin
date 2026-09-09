import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { BarChart3, Eye } from "lucide-react";
import { ChartCard, AXIS, GRID, TOOLTIP_STYLE, yCompact } from "./ChartKit";
import { fmtNumber } from "@/lib/format";

export default function ComparisonChart({ rows }) {
  const data = useMemo(
    () =>
      rows.map((r) => ({
        name: (r.client.name || "—").split(" ")[0],
        subscribers: r.latest?.subscribers ?? 0,
        views: r.latest?.views ?? 0,
      })),
    [rows]
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard
        icon={BarChart3}
        color="#0A84FF"
        title="Subscribers by Client"
        hasData={rows.length > 0}
        emptyLabel="No snapshots yet. Pull from YouTube to compare."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => fmtNumber(v)} />
            <Bar dataKey="subscribers" fill="#0A84FF" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        icon={Eye}
        color="#30D158"
        title="Total Views by Client"
        hasData={rows.length > 0}
        emptyLabel="No snapshots yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => fmtNumber(v)} />
            <Bar dataKey="views" fill="#30D158" radius={[4, 4, 0, 0]} maxBarSize={36} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}