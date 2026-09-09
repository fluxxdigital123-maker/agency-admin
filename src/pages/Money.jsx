import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import RevenueCards from "@/components/money/RevenueCards";
import MrrBreakdown from "@/components/money/MrrBreakdown";
import PaymentTracker from "@/components/money/PaymentTracker";
import CostTracking from "@/components/money/CostTracking";
import MoneyCharts from "@/components/money/MoneyCharts";

export default function Money() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, p, t] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.Payment.list("-dueDate", 500),
        base44.entities.TeamMember.list("-created_date", 500),
      ]);
      setClients(c || []);
      setPayments(p || []);
      setTeam(t || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const activeClients = useMemo(
    () => clients.filter((c) => c.status === "ACTIVE"),
    [clients]
  );

  const teamCostByClient = useMemo(() => {
    const m = {};
    for (const t of team) {
      m[t.client] = (m[t.client] || 0) + (t.cost || 0);
    }
    return m;
  }, [team]);

  const currentMRR = activeClients.reduce((s, c) => s + (c.monthlyFee || 0), 0);
  const totalRevenue = payments
    .filter((p) => p.status === "PAID")
    .reduce((s, p) => s + (p.amount || 0), 0);
  const monthlyCost = team.reduce((s, t) => s + (t.cost || 0), 0);
  const projectedAnnual = currentMRR * 12;
  const netProfit = currentMRR - monthlyCost;

  const mrrGrowth = useMemo(() => {
    const withStart = activeClients.filter((c) => c.startDate);
    if (withStart.length === 0) return [];
    const earliest = withStart.reduce((min, c) =>
      new Date(c.startDate) < new Date(min) ? c.startDate : min, withStart[0].startDate
    );
    const start = new Date(earliest);
    start.setDate(1);
    const now = new Date();
    const months = [];
    const d = new Date(start.getFullYear(), start.getMonth(), 1);
    while (d <= now) {
      const monthEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0);
      const mrr = withStart
        .filter((c) => new Date(c.startDate) <= monthEnd)
        .reduce((s, c) => s + (c.monthlyFee || 0), 0);
      months.push({
        month: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
        mrr,
      });
      d.setMonth(d.getMonth() + 1);
    }
    return months;
  }, [activeClients]);

  const revVsCost = useMemo(
    () =>
      activeClients
        .map((c) => ({
          name: (c.name || "—").split(" ")[0],
          revenue: c.monthlyFee || 0,
          cost: teamCostByClient[c.id] || 0,
        }))
        .filter((r) => r.revenue > 0 || r.cost > 0),
    [activeClients, teamCostByClient]
  );

  const collection = useMemo(() => {
    const groups = { PAID: 0, PENDING: 0, OVERDUE: 0 };
    for (const p of payments) {
      if (groups[p.status] != null) groups[p.status] += p.amount || 0;
    }
    const colors = { PAID: "#30D158", PENDING: "#FF9F0A", OVERDUE: "#FF453A" };
    return Object.entries(groups)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value, color: colors[name] }));
  }, [payments]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Money</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Revenue, collections, costs, and margins across all clients.
        </p>
      </div>

      <RevenueCards
        totalRevenue={totalRevenue}
        currentMRR={currentMRR}
        projectedAnnual={projectedAnnual}
        netProfit={netProfit}
        monthlyCost={monthlyCost}
      />

      <MrrBreakdown clients={activeClients} payments={payments} />

      <PaymentTracker payments={payments} clientMap={clientMap} onPaid={load} />

      <CostTracking clients={activeClients} teamCostByClient={teamCostByClient} />

      <MoneyCharts mrrGrowth={mrrGrowth} revVsCost={revVsCost} collection={collection} />
    </div>
  );
}