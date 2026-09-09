import React from "react";
import { PLAN_LABELS } from "@/lib/clientStages";
import { fmtMoney } from "@/lib/format";

const STATUS_HEX = {
  PAID: "#30D158",
  PENDING: "#FF9F0A",
  OVERDUE: "#FF453A",
};
const STATUS_LABEL = { PAID: "Paid", PENDING: "Pending", OVERDUE: "Overdue" };

function setupStatus(payments, clientId) {
  const sp = payments.find((p) => p.client === clientId && p.type === "SETUP");
  if (!sp) return { label: "Not invoiced", hex: "#86868b" };
  return { label: STATUS_LABEL[sp.status] || sp.status, hex: STATUS_HEX[sp.status] || "#86868b" };
}

export default function MrrBreakdown({ clients, payments }) {
  const sorted = [...clients].sort((a, b) => (b.monthlyFee || 0) - (a.monthlyFee || 0));
  const total = sorted.reduce((s, c) => s + (c.monthlyFee || 0), 0);

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <h2 className="text-[20px] font-semibold tracking-tight">MRR Breakdown</h2>
        <span className="text-[14px] font-medium text-muted-foreground">{fmtMoney(total)}/mo</span>
      </div>
      {sorted.length === 0 ? (
        <p className="px-6 py-8 text-[15px] text-muted-foreground">No active clients.</p>
      ) : (
        <div>
          <div
            className="grid items-center px-6 py-2.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,2fr) 1fr 1fr 1fr", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Client</span>
            <span>Plan</span>
            <span className="text-right">Monthly Fee</span>
            <span className="text-right">Setup Fee</span>
          </div>
          {sorted.map((c) => {
            const ss = setupStatus(payments, c.id);
            return (
              <div
                key={c.id}
                className="grid items-center px-6 py-3"
                style={{ gridTemplateColumns: "minmax(0,2fr) 1fr 1fr 1fr", borderBottom: "0.5px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[15px] font-medium truncate">{c.name}</div>
                </div>
                <span className="text-[14px] text-muted-foreground">
                  {c.planType === "CUSTOM" && c.customPlanLabel ? c.customPlanLabel : PLAN_LABELS[c.planType] || "—"}
                </span>
                <span className="text-right text-[15px] font-medium">{fmtMoney(c.monthlyFee)}</span>
                <span className="text-right">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
                    style={{ background: `${ss.hex}1A`, color: ss.hex, border: `0.5px solid ${ss.hex}33` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: ss.hex }} />
                    {ss.label}
                  </span>
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}