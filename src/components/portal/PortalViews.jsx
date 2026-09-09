import React, { useMemo } from "react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Eye, ThumbsUp, MessageCircle, Share2, BarChart3 } from "lucide-react";

const fmt = (n) =>
  n ? Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n) : "0";

function Stat({ icon: Icon, label, value, color }) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center justify-between">
        <span className="text-[12px] text-white/50">{label}</span>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="text-[22px] font-semibold tabular-nums text-white mt-1">{fmt(value)}</div>
    </div>
  );
}

export default function PortalViews({ snapshots = [] }) {
  const { series, totals } = useMemo(() => {
    const byDate = {};
    const t = { views: 0, likes: 0, comments: 0, shares: 0 };
    for (const s of snapshots) {
      const d = s.date || "";
      if (!byDate[d]) byDate[d] = { date: d, views: 0, likes: 0, comments: 0, shares: 0 };
      byDate[d].views += s.views || 0;
      byDate[d].likes += s.likes || 0;
      byDate[d].comments += s.comments || 0;
      byDate[d].shares += s.shares || 0;
      t.views += s.views || 0;
      t.likes += s.likes || 0;
      t.comments += s.comments || 0;
      t.shares += s.shares || 0;
    }
    const series = Object.values(byDate)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30)
      .map((p) => ({
        ...p,
        label: p.date ? new Date(p.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "",
      }));
    return { series, totals: t };
  }, [snapshots]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat icon={Eye} label="Total views" value={totals.views} color="#0A84FF" />
        <Stat icon={ThumbsUp} label="Likes" value={totals.likes} color="#30D158" />
        <Stat icon={MessageCircle} label="Comments" value={totals.comments} color="#FF9F0A" />
        <Stat icon={Share2} label="Shares" value={totals.shares} color="#BF5AF2" />
      </div>

      <div className="glass-card p-5">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 className="w-[18px] h-[18px] text-white/50" />
          <h2 className="text-[17px] font-semibold tracking-tight text-white">Views over time</h2>
        </div>
        {series.length === 0 ? (
          <p className="text-[14px] text-white/40 py-10 text-center">No view data yet.</p>
        ) : (
          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="pv" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0A84FF" stopOpacity={0.5} />
                    <stop offset="100%" stopColor="#0A84FF" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: "rgba(255,255,255,0.5)" }} tickLine={false} axisLine={false} width={44} />
                <Tooltip
                  formatter={(v) => fmt(v)}
                  contentStyle={{ background: "rgba(20,20,22,0.92)", border: "0.5px solid rgba(255,255,255,0.1)", borderRadius: 12, color: "#fff", fontSize: 13 }}
                />
                <Area type="monotone" dataKey="views" stroke="#0A84FF" strokeWidth={2} fill="url(#pv)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}