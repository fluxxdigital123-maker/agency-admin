import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import StatCards from "@/components/dashboard/StatCards";
import ClientStageCards from "@/components/dashboard/ClientStageCards";
import DailyObjectives from "@/components/dashboard/DailyObjectives";
import Notifications from "@/components/dashboard/Notifications";
import IntegrationBanner from "@/components/settings/IntegrationBanner";

export default function Dashboard() {
  const [clients, setClients] = useState([]);
  const [payments, setPayments] = useState([]);
  const [progress, setProgress] = useState([]);
  const [viewSnapshots, setViewSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, p, pr, vs] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.Payment.list("-dueDate", 1000),
        base44.entities.ClientProgress.list("-updatedAt", 1000),
        base44.entities.ViewSnapshot.list("-date", 2000),
      ]);
      setClients(c || []);
      setPayments(p || []);
      setProgress(pr || []);
      setViewSnapshots(vs || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "ACTIVE"), [clients]);

  const mrr = activeClients.reduce((s, c) => s + (c.monthlyFee || 0), 0);

  const now = new Date();
  const ym = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const revenueThisMonth = payments
    .filter((p) => p.status === "PAID" && p.paidDate && String(p.paidDate).slice(0, 7) === ym)
    .reduce((s, p) => s + (p.amount || 0), 0);
  const outstanding = payments
    .filter((p) => p.status !== "PAID")
    .reduce((s, p) => s + (p.amount || 0), 0);

  const progressByClient = useMemo(() => {
    const m = {};
    for (const p of progress) {
      const ex = m[p.client];
      const pTime = new Date(p.updatedAt || p.created_date).getTime();
      const exTime = ex ? new Date(ex.updatedAt || ex.created_date).getTime() : 0;
      if (!ex || pTime > exTime) m[p.client] = p;
    }
    return m;
  }, [progress]);

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
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Dashboard</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Your agency at a glance — revenue, clients, and what needs attention today.
        </p>
      </div>

      <IntegrationBanner
        integrationId="discord"
        message="Connect the Discord bot to enable automatic production-stage detection (runs every ~30 min, read-only)."
      />

      <StatCards
        mrr={mrr}
        clients={clients.length}
        revenueThisMonth={revenueThisMonth}
        outstanding={outstanding}
      />

      <Notifications />

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-3">Clients</h2>
        <ClientStageCards clients={activeClients} progressByClient={progressByClient} />
      </section>

      <DailyObjectives activeClients={activeClients} viewSnapshots={viewSnapshots} />
    </div>
  );
}