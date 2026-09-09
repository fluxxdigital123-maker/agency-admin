import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { fmtMoney, fmtDate } from "@/lib/format";
import { Check, Loader2 } from "lucide-react";

const STATUS_HEX = { PAID: "#30D158", PENDING: "#FF9F0A", OVERDUE: "#FF453A" };
const STATUS_LABEL = { PAID: "Paid", PENDING: "Pending", OVERDUE: "Overdue" };
const TYPE_LABEL = { SETUP: "Setup", MONTHLY: "Monthly" };

const FILTERS = ["ALL", "PENDING", "OVERDUE", "PAID"];

export default function PaymentTracker({ payments, clientMap, onPaid }) {
  const [filter, setFilter] = useState("ALL");
  const [payingId, setPayingId] = useState(null);

  const sorted = [...payments].sort(
    (a, b) => new Date(a.dueDate || 0) - new Date(b.dueDate || 0)
  );
  const filtered = sorted.filter((p) => filter === "ALL" || p.status === filter);

  async function markPaid(p) {
    setPayingId(p.id);
    try {
      await base44.entities.Payment.update(p.id, {
        status: "PAID",
        paidDate: new Date().toISOString().split("T")[0],
      });
      onPaid && onPaid();
    } finally {
      setPayingId(null);
    }
  }

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between gap-3 flex-wrap" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <h2 className="text-[20px] font-semibold tracking-tight">Payment Tracker</h2>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="h-8 px-3 rounded-[8px] text-[12px] font-medium capitalize transition-colors"
              style={
                filter === f
                  ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                  : { background: "rgba(255,255,255,0.05)", color: "hsl(var(--muted-foreground))" }
              }
            >
              {f.toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="px-6 py-8 text-[15px] text-muted-foreground">No payments {filter !== "ALL" ? `with status "${filter.toLowerCase()}"` : "recorded"}.</p>
      ) : (
        <div>
          <div
            className="grid items-center px-6 py-2.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,1.6fr) 0.8fr 1fr 1fr 120px", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Client</span>
            <span>Type</span>
            <span>Due</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status</span>
          </div>
          {filtered.map((p) => {
            const hex = STATUS_HEX[p.status] || "#86868b";
            const client = clientMap[p.client];
            return (
              <div
                key={p.id}
                className="grid items-center px-6 py-3"
                style={{ gridTemplateColumns: "minmax(0,1.6fr) 0.8fr 1fr 1fr 120px", borderBottom: "0.5px solid var(--border)" }}
              >
                <span className="text-[15px] font-medium truncate">{client?.name || "—"}</span>
                <span className="text-[14px] text-muted-foreground">{TYPE_LABEL[p.type] || p.type}</span>
                <span className="text-[14px] text-muted-foreground">
                  {p.status === "PAID" ? `Paid ${fmtDate(p.paidDate)}` : fmtDate(p.dueDate)}
                </span>
                <span className="text-right text-[15px] font-medium">{fmtMoney(p.amount)}</span>
                <div className="flex items-center justify-end gap-2">
                  {p.status !== "PAID" ? (
                    <button
                      onClick={() => markPaid(p)}
                      disabled={payingId === p.id}
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-opacity hover:opacity-85 disabled:opacity-60"
                      style={{ background: "#30D158", color: "#000" }}
                    >
                      {payingId === p.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      Mark paid
                    </button>
                  ) : (
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium"
                      style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
                      {STATUS_LABEL[p.status]}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}