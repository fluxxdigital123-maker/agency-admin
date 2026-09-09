import React, { useState, useMemo, useEffect } from "react";
import { CheckCircle2, Circle, AlertTriangle, TrendingDown, Bell, ShieldAlert } from "lucide-react";
import { computeGuarantee } from "@/lib/guarantee";
import { base44 } from "@/api/base44Client";
import { fmtDate } from "@/lib/format";
import RiskPill from "@/components/clients/RiskPill";

const DAY_MS = 86400000;

export default function DailyObjectives({ activeClients, viewSnapshots = [], riskByClient }) {
  const [done, setDone] = useState({});
  const [leads, setLeads] = useState([]);
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  useEffect(() => {
    let active = true;
    base44.entities.Lead.list("-created_date", 500)
      .then((l) => { if (active) setLeads(l || []); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const snapsByClient = useMemo(() => {
    const m = {};
    for (const s of viewSnapshots) {
      (m[s.client] = m[s.client] || []).push(s);
    }
    return m;
  }, [viewSnapshots]);

  const items = activeClients
    .filter((c) => c.startDate)
    .map((c) => {
      const start = new Date(c.startDate);
      const days = Math.floor((today - start) / DAY_MS) + 1;
      const g = computeGuarantee(c, snapsByClient[c.id] || [], []);
      return { client: c, days, guarantee: g };
    })
    .filter((it) => it.days <= 30 && it.days >= 1);

  const followUps = useMemo(() => {
    return leads
      .filter((l) => l.nextFollowUp && l.status !== "CLOSED" && l.status !== "LOST" && l.nextFollowUp <= todayStr)
      .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp));
  }, [leads, todayStr]);

  const highRisk = useMemo(() => {
    return (activeClients || [])
      .map((c) => ({ client: c, risk: riskByClient?.[c.id] }))
      .filter((x) => x.risk && x.risk.level === "HIGH")
      .sort((a, b) => (b.risk?.score || 0) - (a.risk?.score || 0));
  }, [activeClients, riskByClient]);

  function toggle(id) {
    setDone((d) => ({ ...d, [id]: !d[id] }));
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
        <h2 className="text-[20px] font-semibold tracking-tight">Daily Objectives</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Agency rule: full refund if a client doesn&apos;t see a views increase in their first 30 days.
        Track each client&apos;s countdown and flag anyone approaching it.
      </p>

      {items.length === 0 ? (
        <p className="text-[14px] text-muted-foreground py-2">
          No active clients within their first 30 days right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ client, days, guarantee }) => {
            const approaching = days >= 25;
            const underZero = guarantee && guarantee.pct !== null && guarantee.pct <= 0 && days >= 20;
            const color = underZero ? "#FF453A" : approaching ? "#FF9F0A" : "#30D158";
            const isDone = !!done[client.id];
            const pctLabel = guarantee && guarantee.pct !== null
              ? `${guarantee.pct > 0 ? "+" : ""}${guarantee.pct.toFixed(0)}%`
              : null;
            return (
              <li key={client.id}>
                <button
                  onClick={() => toggle(client.id)}
                  className="w-full flex items-center gap-3 rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#30D158" }} />
                  ) : underZero ? (
                    <TrendingDown className="w-5 h-5 shrink-0" style={{ color }} />
                  ) : (
                    <Circle className="w-5 h-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-medium truncate"
                      style={isDone ? { opacity: 0.5, textDecoration: "line-through" } : undefined}
                    >
                      {client.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      {underZero
                        ? `Under +0% at day ${days} — needs a views increase`
                        : `Ensure a views increase — day ${days}/30`}
                      {pctLabel && !underZero ? ` · ${pctLabel}` : ""}
                    </div>
                  </div>
                  {(approaching || underZero) && !isDone && !underZero && (
                    <AlertTriangle className="w-4 h-4 shrink-0" style={{ color }} />
                  )}
                  <span className="text-[12px] font-semibold tabular-nums shrink-0" style={{ color }}>
                    {days}/30
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {highRisk.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <ShieldAlert className="w-4 h-4" style={{ color: "#FF453A" }} />
            <h3 className="text-[14px] font-semibold tracking-tight">High churn risk</h3>
            <span className="text-[12px] text-muted-foreground">{highRisk.length}</span>
          </div>
          <ul className="space-y-1.5">
            {highRisk.map(({ client, risk }) => (
              <li key={client.id}>
                <a
                  href={`/clients/${client.id}`}
                  className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 hover:bg-white/[0.03]"
                  style={{ background: "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-[13px] font-medium truncate">{client.name}</span>
                  <RiskPill risk={risk} />
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {followUps.length > 0 && (
        <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4" style={{ color: "#FF9F0A" }} />
            <h3 className="text-[14px] font-semibold tracking-tight">Follow-ups due</h3>
            <span className="text-[12px] text-muted-foreground">{followUps.length}</span>
          </div>
          <ul className="space-y-1.5">
            {followUps.slice(0, 6).map((l) => {
              const overdue = l.nextFollowUp < todayStr;
              return (
                <li key={l.id}>
                  <a
                    href="/leads"
                    className="flex items-center justify-between gap-2 rounded-[10px] px-3 py-2 hover:bg-white/[0.03]"
                    style={{ background: "rgba(255,255,255,0.03)" }}
                  >
                    <span className="text-[13px] font-medium truncate">{l.name}</span>
                    <span
                      className="text-[11px] tabular-nums shrink-0"
                      style={{ color: overdue ? "#FF453A" : "#FF9F0A" }}
                    >
                      {overdue ? "Overdue · " : ""}
                      {fmtDate(l.nextFollowUp)}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}