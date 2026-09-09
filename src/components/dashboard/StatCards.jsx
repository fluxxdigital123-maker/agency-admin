import React from "react";
import { fmtMoney } from "@/lib/format";
import { TrendingUp, Users, Wallet, AlertCircle } from "lucide-react";

export default function StatCards({ mrr, clients, revenueThisMonth, outstanding }) {
  const cards = [
    { label: "Total MRR", value: fmtMoney(mrr), icon: TrendingUp, color: "#30D158", sub: "Active clients" },
    { label: "Total Clients", value: clients, icon: Users, color: "#0A84FF", sub: "On the roster" },
    { label: "Revenue This Month", value: fmtMoney(revenueThisMonth), icon: Wallet, color: "#BF5AF2", sub: "Collected this month" },
    {
      label: "Outstanding Payments",
      value: fmtMoney(outstanding),
      icon: AlertCircle,
      color: outstanding > 0 ? "#FF9F0A" : "#86868b",
      sub: "Pending + overdue",
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