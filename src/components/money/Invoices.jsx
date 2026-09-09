import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { fmtMoney, fmtDate } from "@/lib/format";
import { buildInvoicePdf } from "@/lib/invoicePdf";
import { FileText, Download, Send, Check, Loader2, Sparkles, Link2 } from "lucide-react";

const STATUS_HEX = {
  DRAFT: "#8E8E93",
  SENT: "#0A84FF",
  PAID: "#30D158",
  OVERDUE: "#FF453A",
};

function matchPayment(invoice, payments) {
  if (!payments) return null;
  const cands = payments.filter(
    (p) => p.client === invoice.client && p.type === "MONTHLY"
  );
  // exact due-date match first
  let m = cands.find((p) => p.dueDate === invoice.dueDate);
  if (m) return m;
  // same amount, unpaid, earliest
  const unpaid = cands
    .filter((p) => p.status !== "PAID" && Number(p.amount) === Number(invoice.amount))
    .sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  if (unpaid.length) return unpaid[0];
  // any unpaid monthly for the client
  const any = cands.filter((p) => p.status !== "PAID").sort((a, b) => String(a.dueDate).localeCompare(String(b.dueDate)));
  return any[0] || null;
}

export default function Invoices({ clients, payments, clientMap, onPaid }) {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState({});
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const r = await base44.entities.Invoice.list("-issueDate", 500);
      setInvoices(r || []);
    } catch {
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const branding = useMemo(() => ({ name: "Agency Admin", logoUrl: "" }), []);

  async function generateDrafts() {
    setGenerating(true);
    setError("");
    try {
      await base44.functions.invoke("generateMonthlyInvoices", {});
      await load();
      onPaid && onPaid();
    } catch (e) {
      setError(e.message || "Failed to generate invoices.");
    } finally {
      setGenerating(false);
    }
  }

  async function downloadPdf(inv) {
    setBusy((b) => ({ ...b, [inv.id]: "pdf" }));
    try {
      let url = inv.pdfUrl;
      if (!url) {
        const client = clientMap ? clientMap[inv.client] : null;
        const blob = buildInvoicePdf({ invoice: inv, client, branding });
        const file = new File([blob], `${inv.invoiceNumber}.pdf`, { type: "application/pdf" });
        const up = await base44.integrations.Core.UploadFile({ file });
        url = up?.file_url || up?.data?.file_url || "";
        if (url) await base44.entities.Invoice.update(inv.id, { pdfUrl: url });
        await load();
      }
      if (url) window.open(url, "_blank");
    } catch (e) {
      setError(e.message || "Failed to build PDF.");
    } finally {
      setBusy((b) => ({ ...b, [inv.id]: null }));
    }
  }

  async function send(inv) {
    setBusy((b) => ({ ...b, [inv.id]: "send" }));
    try {
      await base44.entities.Invoice.update(inv.id, { status: "SENT" });
      await load();
    } catch {
      /* ignore */
    } finally {
      setBusy((b) => ({ ...b, [inv.id]: null }));
    }
  }

  async function markPaid(inv) {
    setBusy((b) => ({ ...b, [inv.id]: "paid" }));
    try {
      await base44.entities.Invoice.update(inv.id, { status: "PAID" });
      const pm = matchPayment(inv, payments);
      if (pm && pm.status !== "PAID") {
        await base44.entities.Payment.update(pm.id, {
          status: "PAID",
          paidDate: new Date().toISOString().slice(0, 10),
        });
      }
      await load();
      onPaid && onPaid();
    } catch {
      /* ignore */
    } finally {
      setBusy((b) => ({ ...b, [inv.id]: null }));
    }
  }

  const sorted = [...invoices].sort((a, b) => String(b.issueDate || "").localeCompare(String(a.issueDate || "")));

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between gap-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <FileText className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Invoices</h2>
        </div>
        <button
          onClick={generateDrafts}
          disabled={generating}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #0A84FF, #BF5AF2)" }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating…" : "Generate drafts"}
        </button>
      </div>

      {error && <p className="px-6 pt-3 text-[13px]" style={{ color: "#FF453A" }}>{error}</p>}

      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <p className="px-6 py-8 text-[15px] text-muted-foreground">
          No invoices yet. Draft invoices auto-generate on the 1st of each month, or click{" "}
          <span className="font-medium text-foreground">Generate drafts</span> now.
        </p>
      ) : (
        <div>
          <div
            className="grid items-center px-6 py-2.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,1.3fr) 1fr 0.8fr 0.8fr 0.9fr 1.4fr", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Invoice</span>
            <span>Client</span>
            <span className="text-right">Issued</span>
            <span className="text-right">Due</span>
            <span className="text-right">Amount</span>
            <span className="text-right">Status / Payment</span>
          </div>
          {sorted.map((inv) => {
            const hex = STATUS_HEX[inv.status] || "#8E8E93";
            const pm = matchPayment(inv, payments);
            const cli = clientMap && clientMap[inv.client] ? clientMap[inv.client].name : "—";
            const b = busy[inv.id];
            return (
              <div
                key={inv.id}
                className="grid items-center px-6 py-3"
                style={{ gridTemplateColumns: "minmax(0,1.3fr) 1fr 0.8fr 0.8fr 0.9fr 1.4fr", borderBottom: "0.5px solid var(--border)" }}
              >
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">{inv.invoiceNumber}</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <button
                      onClick={() => downloadPdf(inv)}
                      disabled={b === "pdf"}
                      className="inline-flex items-center gap-1 text-[12px] font-medium text-primary hover:opacity-80 disabled:opacity-50"
                    >
                      {b === "pdf" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />}
                      PDF
                    </button>
                  </div>
                </div>
                <span className="text-[14px] truncate">{cli}</span>
                <span className="text-right text-[13px] text-muted-foreground">{fmtDate(inv.issueDate)}</span>
                <span className="text-right text-[13px] text-muted-foreground">{fmtDate(inv.dueDate)}</span>
                <span className="text-right text-[15px] font-medium">{fmtMoney(inv.amount)}</span>
                <div className="flex items-center justify-end gap-2 flex-wrap">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
                    style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
                    {inv.status}
                  </span>
                  {pm && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] whitespace-nowrap"
                      style={{ background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)", border: "0.5px solid var(--border)" }}
                      title={`Linked payment · ${pm.status}`}
                    >
                      <Link2 className="w-3 h-3" /> {pm.status}
                    </span>
                  )}
                  {inv.status !== "PAID" && (
                    <div className="flex items-center gap-1">
                      {inv.status === "DRAFT" && (
                        <button
                          onClick={() => send(inv)}
                          disabled={b === "send"}
                          className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[12px] font-medium border hover:bg-foreground/5 disabled:opacity-50"
                          style={{ borderColor: "var(--border)" }}
                        >
                          {b === "send" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
                          Send
                        </button>
                      )}
                      <button
                        onClick={() => markPaid(inv)}
                        disabled={b === "paid"}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-[8px] text-[12px] font-medium text-white disabled:opacity-50"
                        style={{ background: "#30D158" }}
                      >
                        {b === "paid" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Mark paid
                      </button>
                    </div>
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