import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, TrendingUp, TrendingDown, Minus, Pencil, Check } from "lucide-react";
import { computeGuarantee } from "@/lib/guarantee";

const STATUS_META = {
  green: { color: "#30D158", label: "On Track", bg: "rgba(48,209,88,0.12)" },
  orange: { color: "#FF9F0A", label: "Watch", bg: "rgba(255,159,10,0.12)" },
  red: { color: "#FF453A", label: "At Risk", bg: "rgba(255,69,58,0.12)" },
  none: { color: "#86868b", label: "—", bg: "rgba(128,128,128,0.12)" },
};

function fmt(n) { return Number(n || 0).toLocaleString(); }

export default function GuaranteeCard({ client, viewSnapshots, analyticsSnapshots, onSaved }) {
  const g = computeGuarantee(client, viewSnapshots, analyticsSnapshots);
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(client.baselineViews ?? "");
  const [saving, setSaving] = useState(false);

  if (!g) {
    return (
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-1">
          <ShieldCheck className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">30-Day Guarantee</h2>
        </div>
        <p className="text-[14px] text-muted-foreground">Set a start date on this client to track the guarantee.</p>
      </div>
    );
  }

  const meta = STATUS_META[g.status] || STATUS_META.none;
  const TrendIcon = g.pct === null ? Minus : g.pct > 0 ? TrendingUp : TrendingDown;

  async function saveBaseline() {
    setSaving(true);
    try {
      const n = val === "" ? null : Number(val);
      await base44.entities.Client.update(client.id, { baselineViews: n });
      setEditing(false);
      onSaved && onSaved();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-[18px] h-[18px]" style={{ color: meta.color }} />
          <h2 className="text-[20px] font-semibold tracking-tight">30-Day Guarantee</h2>
        </div>
        <span
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-full text-[12px] font-semibold"
          style={{ color: meta.color, background: meta.bg }}
        >
          {meta.label}
        </span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Metric label="Days Remaining" value={`${g.daysRemaining}/30`} color={meta.color} />
        <Metric label="Baseline Views" value={fmt(g.baseline)} sub="30 days before start" />
        <Metric label="Current Views" value={fmt(g.current)} sub="first 30 days" />
        <div>
          <div className="text-[12px] text-muted-foreground mb-1">% Change</div>
          <div className="inline-flex items-center gap-1.5 text-[24px] font-semibold tabular-nums" style={{ color: meta.color }}>
            <TrendIcon className="w-5 h-5" />
            {g.pct === null ? "—" : `${g.pct > 0 ? "+" : ""}${g.pct.toFixed(1)}%`}
          </div>
        </div>
      </div>

      <div className="mt-5 pt-4" style={{ borderTop: "0.5px solid var(--border)" }}>
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[12px] text-muted-foreground mb-0.5">Manual Baseline Override</div>
            <div className="text-[12px] text-muted-foreground/80">
              {client.baselineViews != null ? "Using manually entered baseline." : "Auto-summed from snapshots; enter a value to override."}
            </div>
          </div>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={val}
                onChange={(e) => setVal(e.target.value)}
                className="w-32 h-8 rounded-[8px] px-2 text-[13px] outline-none"
                style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
                placeholder="0"
              />
              <button onClick={saveBaseline} disabled={saving} className="h-8 w-8 rounded-[8px] flex items-center justify-center bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                <Check className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => { setVal(client.baselineViews ?? ""); setEditing(true); }}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium hover:bg-foreground/5"
              style={{ border: "0.5px solid var(--border)" }}
            >
              <Pencil className="w-3.5 h-3.5" /> {client.baselineViews != null ? "Edit" : "Set baseline"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, sub, color }) {
  return (
    <div>
      <div className="text-[12px] text-muted-foreground mb-1">{label}</div>
      <div className="text-[24px] font-semibold tabular-nums" style={color ? { color } : undefined}>{value}</div>
      {sub && <div className="text-[11px] text-muted-foreground/80 mt-0.5">{sub}</div>}
    </div>
  );
}