import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Loader2, Search, ShieldCheck } from "lucide-react";

const ENTITIES = ["Client", "Payment", "Clip", "TeamMember", "Invoice"];
const ACTIONS = ["create", "update", "delete"];
const ACTION_HEX = { create: "#30D158", update: "#0A84FF", delete: "#FF453A" };

function fmtTime(iso) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function diffPreview(beforeStr, afterStr) {
  let b = null, a = null;
  try { b = beforeStr ? JSON.parse(beforeStr) : null; } catch { /* ignore */ }
  try { a = afterStr ? JSON.parse(afterStr) : null; } catch { /* ignore */ }
  if (!b && !a) return null;
  const keys = Array.from(new Set([...Object.keys(b || {}), ...Object.keys(a || {})]));
  const changes = keys
    .filter((k) => k !== "updated_date")
    .map((k) => {
      const bv = b ? b[k] : undefined;
      const av = a ? a[k] : undefined;
      if (JSON.stringify(bv) === JSON.stringify(av)) return null;
      return { field: k, before: bv, after: av };
    })
    .filter(Boolean);
  return changes;
}

export default function AuditLog() {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [email, setEmail] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const query = {};
      if (entity) query.entityName = entity;
      if (action) query.action = action;
      const rows = await base44.entities.AuditEvent.filter(query, "-timestamp", 500);
      setEvents(rows || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [entity, action]);

  const filtered = useMemo(() => {
    if (!email.trim()) return events;
    const q = email.trim().toLowerCase();
    return events.filter((e) => (e.userEmail || "").toLowerCase().includes(q));
  }, [events, email]);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/settings")}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Settings
        </button>
        <span className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <ShieldCheck className="w-4 h-4" /> Owner-only
        </span>
      </div>

      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Audit Log</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Every create, update, and delete on clients, payments, clips, team members, and invoices.
        </p>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        <select
          value={entity}
          onChange={(e) => setEntity(e.target.value)}
          className="h-9 px-3 rounded-[8px] bg-background/60 border border-border text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All entities</option>
          {ENTITIES.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select
          value={action}
          onChange={(e) => setAction(e.target.value)}
          className="h-9 px-3 rounded-[8px] bg-background/60 border border-border text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
        >
          <option value="">All actions</option>
          {ACTIONS.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Filter by user email…"
            className="w-full h-9 pl-9 pr-3 rounded-[8px] bg-background/60 border border-border text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-10 text-center text-[15px] text-muted-foreground">
          No audit events match these filters.
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ev) => {
            const changes = diffPreview(ev.before, ev.after);
            const isOpen = expanded === ev.id;
            return (
              <div key={ev.id} className="glass-card overflow-hidden">
                <button
                  onClick={() => setExpanded(isOpen ? null : ev.id)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-foreground/5 transition-colors"
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: ACTION_HEX[ev.action] || "#888" }}
                  />
                  <span className="text-[13px] font-medium uppercase tracking-wide w-14 shrink-0" style={{ color: ACTION_HEX[ev.action] }}>
                    {ev.action}
                  </span>
                  <span className="text-[14px] font-medium w-32 shrink-0">{ev.entityName}</span>
                  <span className="text-[13px] text-muted-foreground truncate flex-1">
                    {ev.recordId ? ev.recordId.slice(-8) : "—"}
                    {changes && changes.length > 0 && (
                      <span className="ml-2 text-muted-foreground/70">· {changes.length} field{changes.length > 1 ? "s" : ""} changed</span>
                    )}
                  </span>
                  <span className="text-[12px] text-muted-foreground shrink-0 hidden sm:block">{ev.userEmail}</span>
                  <span className="text-[12px] text-muted-foreground shrink-0 w-36 text-right">{fmtTime(ev.timestamp)}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 pt-1 space-y-2 border-t" style={{ borderColor: "var(--border)" }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[12px] mt-2">
                      <div><span className="text-muted-foreground">User:</span> {ev.userEmail}</div>
                      <div><span className="text-muted-foreground">Record ID:</span> {ev.recordId || "—"}</div>
                    </div>
                    {changes && changes.length > 0 ? (
                      <div className="space-y-1.5 mt-2">
                        {changes.map((c) => (
                          <div key={c.field} className="grid grid-cols-[120px_1fr] gap-2 text-[13px] py-1">
                            <span className="text-muted-foreground font-medium">{c.field}</span>
                            <span className="font-mono break-all">
                              <span style={{ color: "#FF453A" }}>{c.before === undefined ? "∅" : JSON.stringify(c.before)}</span>
                              <span className="text-muted-foreground mx-1">→</span>
                              <span style={{ color: "#30D158" }}>{c.after === undefined ? "∅" : JSON.stringify(c.after)}</span>
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[13px] text-muted-foreground mt-2">No field-level diff available.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}