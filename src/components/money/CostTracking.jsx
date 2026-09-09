import React from "react";
import { fmtMoney } from "@/lib/format";

export default function CostTracking({ clients, teamCostByClient }) {
  const rows = clients
    .map((c) => {
      const cost = teamCostByClient[c.id] || 0;
      const fee = c.monthlyFee || 0;
      const profit = fee - cost;
      const margin = fee > 0 ? Math.round((profit / fee) * 100) : cost > 0 ? -100 : 0;
      return { c, fee, cost, profit, margin };
    })
    .sort((a, b) => b.profit - a.profit);

  const totalFee = rows.reduce((s, r) => s + r.fee, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);
  const totalProfit = totalFee - totalCost;
  const totalMargin = totalFee > 0 ? Math.round((totalProfit / totalFee) * 100) : 0;

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <h2 className="text-[20px] font-semibold tracking-tight">Cost &amp; Profit</h2>
        <span className="text-[14px] font-medium text-muted-foreground">
          Margin {totalMargin}%
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-8 text-[15px] text-muted-foreground">No active clients.</p>
      ) : (
        <div>
          <div
            className="grid items-center px-6 py-2.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,1.6fr) 1fr 1fr 1fr 0.8fr", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Client</span>
            <span className="text-right">Revenue</span>
            <span className="text-right">Team Cost</span>
            <span className="text-right">Profit</span>
            <span className="text-right">Margin</span>
          </div>
          {rows.map((r) => {
            const profitHex = r.profit >= 0 ? "#30D158" : "#FF453A";
            return (
              <div
                key={r.c.id}
                className="grid items-center px-6 py-3"
                style={{ gridTemplateColumns: "minmax(0,1.6fr) 1fr 1fr 1fr 0.8fr", borderBottom: "0.5px solid var(--border)" }}
              >
                <span className="text-[15px] font-medium truncate">{r.c.name}</span>
                <span className="text-right text-[15px]">{fmtMoney(r.fee)}</span>
                <span className="text-right text-[15px] text-muted-foreground">{fmtMoney(r.cost)}</span>
                <span className="text-right text-[15px] font-medium" style={{ color: profitHex }}>
                  {fmtMoney(r.profit)}
                </span>
                <span className="text-right">
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-1 text-[12px] font-medium"
                    style={{ background: `${profitHex}1A`, color: profitHex }}
                  >
                    {r.margin}%
                  </span>
                </span>
              </div>
            );
          })}
          {/* Totals */}
          <div
            className="grid items-center px-6 py-3.5"
            style={{ gridTemplateColumns: "minmax(0,1.6fr) 1fr 1fr 1fr 0.8fr" }}
          >
            <span className="text-[15px] font-semibold">Total</span>
            <span className="text-right text-[15px] font-semibold">{fmtMoney(totalFee)}</span>
            <span className="text-right text-[15px] font-semibold text-muted-foreground">{fmtMoney(totalCost)}</span>
            <span className="text-right text-[15px] font-semibold" style={{ color: totalProfit >= 0 ? "#30D158" : "#FF453A" }}>
              {fmtMoney(totalProfit)}
            </span>
            <span className="text-right text-[15px] font-semibold">{totalMargin}%</span>
          </div>
        </div>
      )}
    </div>
  );
}