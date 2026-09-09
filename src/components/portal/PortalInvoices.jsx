import React from "react";
import { Download, FileText } from "lucide-react";
import { buildInvoicePdf } from "@/lib/invoicePdf";

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

const STATUS_COLOR = {
  DRAFT: "#8E8E93",
  SENT: "#0A84FF",
  PAID: "#30D158",
  OVERDUE: "#FF453A",
};

export default function PortalInvoices({ invoices = [], client }) {
  const download = (inv) => {
    const doc = buildInvoicePdf({ invoice: inv, client, branding: { name: "Agency Admin" } });
    const url = URL.createObjectURL(doc);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${inv.invoiceNumber || "invoice"}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="w-[18px] h-[18px] text-white/50" />
        <h2 className="text-[17px] font-semibold tracking-tight text-white">Invoices</h2>
      </div>
      {invoices.length === 0 ? (
        <p className="text-[14px] text-white/40 py-8 text-center">No invoices yet.</p>
      ) : (
        <div className="space-y-2">
          {invoices.map((inv) => {
            const sc = STATUS_COLOR[inv.status] || "#8E8E93";
            return (
              <div
                key={inv.id}
                className="flex items-center gap-3 rounded-[12px] px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white">{inv.invoiceNumber || "—"}</span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: `${sc}26`, color: sc }}
                    >
                      {inv.status}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">
                    Issued {fmtDate(inv.issueDate)} · Due {fmtDate(inv.dueDate)}
                  </div>
                </div>
                <div className="text-[14px] font-semibold tabular-nums text-white shrink-0">{fmtMoney(inv.amount)}</div>
                <button
                  onClick={() => download(inv)}
                  className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[12px] font-medium text-white/80 hover:text-white hover:bg-white/10 shrink-0"
                  style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
                >
                  <Download className="w-3.5 h-3.5" /> PDF
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}