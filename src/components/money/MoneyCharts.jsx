import React from "react";
import {
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell, Legend,
} from "recharts";
import { fmtMoney } from "@/lib/format";
import { LineChart as LineIcon, BarChart3, PieChart as PieIcon } from "lucide-react";

const AXIS = "#86868b";
const GRID = "rgba(128,128,128,0.15)";
const TOOLTIP_STYLE = {
  background: "rgba(20,20,22,0.92)",
  border: "0.5px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#f5f5f7",
  fontSize: 13,
};

export default function MoneyCharts({ mrrGrowth, revVsCost, collection }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* MRR growth over time */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <LineIcon className="w-[18px] h-[18px]" style={{ color: "#0A84FF" }} />
          <h2 className="text-[17px] font-semibold tracking-tight">MRR Growth Over Time</h2>
        </div>
        {mrrGrowth.length === 0 ? (
          <EmptyChart label="No client start dates yet." />
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mrrGrowth} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="month" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtMoney(v)} />
                <Line type="monotone" dataKey="mrr" stroke="#0A84FF" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Revenue vs costs */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-[18px] h-[18px]" style={{ color: "#BF5AF2" }} />
          <h2 className="text-[17px] font-semibold tracking-tight">Revenue vs Costs</h2>
        </div>
        {revVsCost.length === 0 ? (
          <EmptyChart label="No active clients with revenue." />
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revVsCost} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={GRID} vertical={false} />
                <XAxis dataKey="name" tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={48} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(255,255,255,0.04)" }} formatter={(v) => fmtMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
                <Bar dataKey="revenue" name="Revenue" fill="#30D158" radius={[4, 4, 0, 0]} maxBarSize={28} />
                <Bar dataKey="cost" name="Cost" fill="#FF453A" radius={[4, 4, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Payment collection rate */}
      <div className="glass-card p-6 lg:col-span-2">
        <div className="flex items-center gap-2 mb-4">
          <PieIcon className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
          <h2 className="text-[17px] font-semibold tracking-tight">Payment Collection Rate</h2>
        </div>
        {collection.length === 0 ? (
          <EmptyChart label="No payments recorded yet." />
        ) : (
          <div style={{ height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={collection}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {collection.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={TOOLTIP_STYLE} formatter={(v) => fmtMoney(v)} />
                <Legend wrapperStyle={{ fontSize: 12 }} iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyChart({ label }) {
  return (
    <div className="flex items-center justify-center text-[14px] text-muted-foreground" style={{ height: 240 }}>
      {label}
    </div>
  );
}