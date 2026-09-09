import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from "recharts";
import { BarChart3, TrendingUp } from "lucide-react";
import { ChartCard, AXIS, GRID, TOOLTIP_STYLE, yCompact } from "@/components/analytics/ChartKit";
import { PLATFORMS, PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/viewPlatforms";

export default function ViewsCharts({ snapshots, clients }) {
  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients || []) m[c.id] = c;
    return m;
  }, [clients]);

  const stackData = useMemo(() => {
    const byClient = {};
    for (const s of snapshots || []) {
      const key = s.client || "_";
      if (!byClient[key]) byClient[key] = { name: (clientMap[s.client]?.name || "—").split(" ")[0] };
      const p = s.platform || "YOUTUBE_SHORTS";
      byClient[key][p] = (byClient[key][p] || 0) + (Number(s.views) || 0);
    }
    return Object.values(byClient);
  }, [snapshots, clientMap]);

  const daily = useMemo(() => {
    const byDate = {};
    for (const s of snapshots || []) {
      const d = s.date;
      if (!byDate[d]) byDate[d] = { date: d.slice(5), views: 0, likes: 0, comments: 0, shares: 0 };
      byDate[d].views += Number(s.views) || 0;
      byDate[d].likes += Number(s.likes) || 0;
      byDate[d].comments += Number(s.comments) || 0;
      byDate[d].shares += Number(s.shares) || 0;
    }
    return Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [snapshots]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard
        icon={BarChart3}
        color="#0A84FF"
        title="Views by Client"
        hasData={stackData.length > 0}
        emptyLabel="No view snapshots yet. Log views to see the breakdown."
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={stackData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
            <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            {PLATFORMS.map((p) => (
              <Bar key={p} dataKey={p} stackId="a" name={PLATFORM_LABEL[p]} fill={PLATFORM_COLOR[p]} maxBarSize={42} radius={[0, 0, 0, 0]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        icon={TrendingUp}
        color="#30D158"
        title="Daily Views"
        hasData={daily.length > 0}
        emptyLabel="No daily data yet."
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={daily} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
            <XAxis dataKey="date" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={yCompact} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="views" stroke="#30D158" strokeWidth={2} dot={{ r: 3 }} name="Views" />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}