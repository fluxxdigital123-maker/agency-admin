import React from "react";
import { fmtMoney } from "@/lib/format";
import { TrendingUp, DollarSign, Repeat, CheckCircle2 } from "lucide-react";

export default function PipelineTotals({ leads }) {
  const count = leads.length;
  const totalUpfront = leads.reduce((s, l) => s + (l.upfrontCash || 0), 0);
  const totalMrr = leads.reduce((s, l) => s + (l.monthlyRecurring || 0), 0);
  const closed = leads.filter((l) => l.status === "CLOSED");
  const closedMrr = closed.reduce((s, l) => s + (l.monthlyRecurring || 0), 0);

  const cards = [
    { label: "Total Leads", value: count, icon: TrendingUp, color: "#0A84FF" },
    { label: "Upfront (pipeline)", value: fmtMoney(totalUpfront), icon: DollarSign, color: "#BF5AF2" },
    { label: "Monthly Recurring (pipeline)", value: fmtMoney(totalMrr), icon: Repeat, color: "#FF9F0A" },
    { label: "Closed MRR", value: fmtMoney(closedMrr), icon: CheckCircle2, color: "#30D158" },
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
            <div className="text-[22px] font-semibold tracking-tight mt-2 tabular-nums">{c.value}</div>
          </div>
        );
      })}
    </div>
  );
}