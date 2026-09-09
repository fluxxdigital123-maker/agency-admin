import React from "react";
import { fmtMoney } from "@/lib/format";
import { TrendingUp, Wallet, CalendarRange, PiggyBank } from "lucide-react";

export default function RevenueCards({ totalRevenue, currentMRR, projectedAnnual, netProfit, monthlyCost }) {
  const cards = [
    { label: "Total Revenue", value: fmtMoney(totalRevenue), icon: Wallet, color: "#0A84FF", sub: "Collected (paid)" },
    { label: "Current MRR", value: fmtMoney(currentMRR), icon: TrendingUp, color: "#30D158", sub: "Active clients" },
    { label: "Projected Annual", value: fmtMoney(projectedAnnual), icon: CalendarRange, color: "#BF5AF2", sub: "MRR × 12" },
    {
      label: "Net Monthly Profit",
      value: fmtMoney(netProfit),
      icon: PiggyBank,
      color: netProfit >= 0 ? "#30D158" : "#FF453A",
      sub: `MRR − ${fmtMoney(monthlyCost)} costs`,
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
            <div className="text-[24px] font-semibold tracking-tight mt-2">{c.value}</div>
            <div className="text-[12px] text-muted-foreground mt-0.5">{c.sub}</div>
          </div>
        );
      })}
    </div>
  );
}