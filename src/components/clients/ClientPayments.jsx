import React from "react";
import { Wallet } from "lucide-react";
import { fmtMoney, fmtDate } from "@/lib/format";

const STATUS_HEX = {
  PAID: "#30D158",
  PENDING: "#FF9F0A",
  OVERDUE: "#FF453A",
};

const TYPE_LABELS = {
  SETUP: "Setup",
  MONTHLY: "Monthly",
};

export default function ClientPayments({ payments }) {
  const upcoming = payments.filter((p) => p.status !== "PAID");
  const history = payments.filter((p) => p.status === "PAID");

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[20px] font-semibold tracking-tight">Payments</h2>
      </div>

      {payments.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">No payments recorded yet.</p>
      ) : (
        <div className="space-y-5">
          {upcoming.length > 0 && (
            <div>
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Upcoming
              </div>
              <div className="space-y-2">
                {upcoming.map((p) => (
                  <PaymentRow key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}
          {history.length > 0 && (
            <div>
              <div className="text-[12px] font-medium uppercase tracking-wider text-muted-foreground mb-2">
                History
              </div>
              <div className="space-y-2">
                {history.map((p) => (
                  <PaymentRow key={p.id} p={p} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PaymentRow({ p }) {
  const hex = STATUS_HEX[p.status] || "#86868b";
  return (
    <div
      className="flex items-center justify-between rounded-[12px] px-4 py-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
    >
      <div className="min-w-0">
        <div className="text-[15px] font-medium">
          {TYPE_LABELS[p.type] || p.type} · {fmtMoney(p.amount)}
        </div>
        <div className="text-[13px] text-muted-foreground">
          {p.status === "PAID" ? `Paid ${fmtDate(p.paidDate)}` : `Due ${fmtDate(p.dueDate)}`}
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium shrink-0 ml-3"
        style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
      >
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
        {p.status === "PAID" ? "Paid" : p.status === "OVERDUE" ? "Overdue" : "Pending"}
      </span>
    </div>
  );
}