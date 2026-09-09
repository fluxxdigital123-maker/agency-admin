import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { LineChart as LineIcon, TrendingUp, Clock } from "lucide-react";
import { ChartCard, AXIS, GRID, TOOLTIP_STYLE, yCompact } from "./ChartKit";
import { fmtNumber } from "@/lib/format";

function fmtDateShort(d) {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return d;
  }
}

export default function PerClientCharts({ snapshots }) {
  const data = useMemo(
    () =>
      snapshots.map((s) => ({
        date: fmtDateShort(s.date),
        views: s.views ?? null,
        subscribers: s.subscribers ?? null,
        watchHours: s.watchHours ?? null,
      })),
    [snapshots]
  );

  const hasViews = data.some((d) => d.views != null);
  const hasSubs = data.some((d) => d.subscribers != null);
  const hasWatch = data.some((d) => d.watchHours != null);

  const commonAxis = (dataKey) => (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
      <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
      <YAxis
        tick={{ fill: AXIS, fontSize: 11 }}
        tickLine={false}
        axisLine={false}
        width={48}
        tickFormatter={yCompact}
      />
      <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtNumber(v)} />
      <Line type="monotone" dataKey={dataKey} stroke="#0A84FF" strokeWidth={2.5} dot={false} connectNulls />
    </>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard
        icon={LineIcon}
        color="#0A84FF"
        title="Views Over Time"
        hasData={hasViews}
        emptyLabel="No views recorded yet. Pull from YouTube or add a manual snapshot."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            {commonAxis("views")}
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        icon={TrendingUp}
        color="#30D158"
        title="Subscriber Growth"
        hasData={hasSubs}
        emptyLabel="No subscriber data yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtNumber(v)} />
              <Line type="monotone" dataKey="subscribers" stroke="#30D158" strokeWidth={2.5} dot={false} connectNulls />
            </>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        icon={Clock}
        color="#BF5AF2"
        title="Watch-Time Trend"
        hasData={hasWatch}
        emptyLabel="Watch hours aren't available via the YouTube Data API — add them manually per snapshot."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <>
              <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
              <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
              <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtNumber(v)} />
              <Line type="monotone" dataKey="watchHours" stroke="#BF5AF2" strokeWidth={2.5} dot={false} connectNulls />
            </>
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}