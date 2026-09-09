import React, { useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { fmtMoney } from "@/lib/format";
import { computeEditorPayouts, monthKey } from "@/lib/editorPayouts";
import { Wallet, History, Check } from "lucide-react";

const PAY_LABEL = {
  FIXED_MONTHLY: "Fixed / mo",
  PER_CLIP: "Per clip",
  PER_1000_VIEWS: "Per 1k views",
};

export default function EditorPayouts({ team, clips, snapshots, payouts, clientMap, onPaid }) {
  const ym = monthKey();

  const byEditor = useMemo(
    () => computeEditorPayouts(team, clips, snapshots, ym),
    [team, clips, snapshots, ym]
  );

  const payoutMap = useMemo(() => {
    const m = {};
    for (const p of payouts || []) m[`${p.teamMember}|${p.month}`] = p;
    return m;
  }, [payouts]);

  const rows = team
    .map((t) => {
      const e = byEditor[t.id] || { owed: 0, clipsCount: 0, viewsTotal: 0 };
      const rec = payoutMap[`${t.id}|${ym}`];
      const paid = !!(rec && rec.paid);
      return { t, ...e, rec, paid };
    })
    .filter((r) => r.owed > 0 || r.paid);

  const totalOwed = rows.reduce((s, r) => s + r.owed, 0);
  const totalPaid = rows.filter((r) => r.paid).reduce((s, r) => s + r.owed, 0);

  async function togglePaid(t, owed, currentlyPaid) {
    const rec = payoutMap[`${t.id}|${ym}`];
    try {
      if (rec) {
        await base44.entities.EditorPayout.update(rec.id, {
          paid: !currentlyPaid,
          paidDate: !currentlyPaid ? new Date().toISOString().slice(0, 10) : undefined,
        });
      } else {
        await base44.entities.EditorPayout.create({
          teamMember: t.id,
          client: t.client,
          month: ym,
          amount: owed,
          paid: true,
          paidDate: new Date().toISOString().slice(0, 10),
        });
      }
      onPaid && onPaid();
    } catch {
      /* ignore */
    }
  }

  // history: payouts for months before current
  const history = (payouts || [])
    .filter((p) => p.month && p.month < ym)
    .sort((a, b) => (a.month < b.month ? 1 : -1));

  const teamMap = useMemo(() => { const m = {}; for (const t of team) m[t.id] = t; return m; }, [team]);

  // group history by month
  const historyByMonth = useMemo(() => {
    const m = {};
    for (const p of history) {
      (m[p.month] = m[p.month] || []).push(p);
    }
    return Object.entries(m).sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [history]);

  const fmtMonth = (ymStr) => {
    const [y, m] = ymStr.split("-");
    return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  return (
    <div className="glass-card overflow-hidden">
      <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <div className="flex items-center gap-2">
          <Wallet className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Editor Payouts</h2>
        </div>
        <span className="text-[14px] font-medium text-muted-foreground">
          {fmtMoney(totalOwed)} owed · {fmtMoney(totalPaid)} paid
        </span>
      </div>

      {rows.length === 0 ? (
        <p className="px-6 py-8 text-[15px] text-muted-foreground">
          No editor payouts this month. Set a payment type and rate on team members, then log clips/views.
        </p>
      ) : (
        <div>
          <div
            className="grid items-center px-6 py-2.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,1.4fr) 1fr 0.8fr 0.7fr 0.9fr 0.9fr", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Editor</span>
            <span>Type</span>
            <span className="text-right">Clips</span>
            <span className="text-right">Views</span>
            <span className="text-right">Owed</span>
            <span className="text-right">Paid</span>
          </div>
          {rows.map((r) => (
            <div
              key={r.t.id}
              className="grid items-center px-6 py-3"
              style={{ gridTemplateColumns: "minmax(0,1.4fr) 1fr 0.8fr 0.7fr 0.9fr 0.9fr", borderBottom: "0.5px solid var(--border)" }}
            >
              <div className="min-w-0">
                <div className="text-[15px] font-medium truncate">{r.t.name}</div>
                <div className="text-[12px] text-muted-foreground truncate">
                  {clientMap && clientMap[r.t.client] ? clientMap[r.t.client].name : "—"}
                </div>
              </div>
              <span className="text-[13px] text-muted-foreground">{PAY_LABEL[r.t.paymentType] || "Fixed / mo"}</span>
              <span className="text-right text-[14px] tabular-nums">{r.clipsCount}</span>
              <span className="text-right text-[14px] tabular-nums text-muted-foreground">{Math.round(r.viewsTotal).toLocaleString()}</span>
              <span className="text-right text-[15px] font-medium">{fmtMoney(r.owed)}</span>
              <div className="flex justify-end">
                <button
                  onClick={() => togglePaid(r.t, r.owed, r.paid)}
                  className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold transition-colors"
                  style={
                    r.paid
                      ? { background: "rgba(48,209,88,0.16)", color: "#30D158", border: "0.5px solid rgba(48,209,88,0.3)" }
                      : { background: "rgba(255,255,255,0.04)", color: "var(--muted-foreground)", border: "0.5px solid var(--border)" }
                  }
                >
                  {r.paid ? <Check className="w-3.5 h-3.5" /> : null}
                  {r.paid ? "Paid" : "Mark paid"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* History */}
      {historyByMonth.length > 0 && (
        <div className="px-6 py-4" style={{ borderTop: "0.5px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <History className="w-[16px] h-[16px] text-muted-foreground" />
            <h3 className="text-[15px] font-semibold tracking-tight">Payout History</h3>
          </div>
          <div className="space-y-4">
            {historyByMonth.map(([month, items]) => {
              const monthTotal = items.reduce((s, p) => s + (p.amount || 0), 0);
              return (
                <div key={month}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[13px] font-medium">{fmtMonth(month)}</span>
                    <span className="text-[12px] text-muted-foreground">{fmtMoney(monthTotal)} · {items.filter((p) => p.paid).length}/{items.length} paid</span>
                  </div>
                  <div className="space-y-1">
                    {items.map((p) => {
                      const tm = teamMap[p.teamMember];
                      return (
                        <div key={p.id} className="flex items-center justify-between text-[13px] py-1">
                          <span className="truncate">
                            <span className={p.paid ? "text-muted-foreground" : ""}>{tm?.name || "Unknown"}</span>
                            {clientMap && p.client && clientMap[p.client] && (
                              <span className="text-muted-foreground"> · {clientMap[p.client].name}</span>
                            )}
                          </span>
                          <span className="flex items-center gap-2">
                            <span className="tabular-nums">{fmtMoney(p.amount)}</span>
                            {p.paid ? (
                              <span className="inline-flex items-center gap-1 text-[11px]" style={{ color: "#30D158" }}>
                                <Check className="w-3 h-3" /> {p.paidDate ? p.paidDate.slice(5) : "paid"}
                              </span>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">unpaid</span>
                            )}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}