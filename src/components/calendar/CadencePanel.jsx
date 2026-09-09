import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { PLATFORMS, PLATFORM_LABEL, PLATFORM_COLOR, inThisWeek } from "@/lib/platforms";
import { Trash2, Plus, Target } from "lucide-react";

export default function CadencePanel({ clients, cadence, clips, onSaved }) {
  const activeClients = clients.filter((c) => c.status === "ACTIVE");
  const cadenceByClient = {};
  for (const cd of cadence) {
    (cadenceByClient[cd.client] = cadenceByClient[cd.client] || []).push(cd);
  }

  if (activeClients.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-[14px] text-muted-foreground">
        No active clients to track posting cadence.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[18px] font-semibold tracking-tight">Weekly Posting Cadence</h2>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {activeClients.map((c) => (
          <ClientCadenceCard
            key={c.id}
            client={c}
            rows={cadenceByClient[c.id] || []}
            clips={clips.filter((cl) => cl.client === c.id)}
            onSaved={onSaved}
          />
        ))}
      </div>
    </div>
  );
}

function ClientCadenceCard({ client, rows, clips, onSaved }) {
  const usedPlatforms = new Set(rows.map((r) => r.platform));
  const available = PLATFORMS.filter((p) => !usedPlatforms.has(p));
  const [addPlatform, setAddPlatform] = useState("");

  function countThisWeek(platform) {
    return clips.filter(
      (c) => c.platform === platform && (inThisWeek(c.scheduledDate) || inThisWeek(c.postedDate))
    ).length;
  }

  async function addTarget(platform) {
    if (!platform) return;
    try {
      await base44.entities.PostingCadence.create({ client: client.id, platform, weeklyTarget: 3 });
      setAddPlatform("");
      onSaved();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight truncate">{client.name}</h3>
        <span className="text-[12px] text-muted-foreground">This week</span>
      </div>

      {rows.length === 0 && available.length > 0 && (
        <p className="text-[13px] text-muted-foreground mb-3">No cadence set yet. Add a platform below.</p>
      )}

      <div className="space-y-3">
        {rows.map((r) => (
          <CadenceRow key={r.id} cadence={r} count={countThisWeek(r.platform)} onSaved={onSaved} />
        ))}
      </div>

      {available.length > 0 && (
        <div className="flex items-center gap-2 mt-4 pt-3" style={{ borderTop: "0.5px solid var(--border)" }}>
          <select
            value={addPlatform}
            onChange={(e) => setAddPlatform(e.target.value)}
            className="h-8 rounded-[8px] px-2 text-[12px] bg-background/60 flex-1"
            style={{ border: "0.5px solid var(--border)" }}
          >
            <option value="">+ Add platform</option>
            {available.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
          </select>
          <button
            onClick={() => addTarget(addPlatform)}
            disabled={!addPlatform}
            className="inline-flex items-center gap-1 h-8 px-2.5 rounded-[8px] text-[12px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            <Plus className="w-3.5 h-3.5" /> Add
          </button>
        </div>
      )}
    </div>
  );
}

function CadenceRow({ cadence, count, onSaved }) {
  const color = PLATFORM_COLOR[cadence.platform] || "#8E8E93";
  const target = cadence.weeklyTarget || 0;
  const pct = target > 0 ? Math.min(count / target, 1) * 100 : 0;
  const met = target > 0 && count >= target;
  const [val, setVal] = useState(String(target));

  async function commit() {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) { setVal(String(target)); return; }
    if (n === 0) {
      try { await base44.entities.PostingCadence.delete(cadence.id); onSaved(); } catch { /* ignore */ }
      return;
    }
    if (n !== target) {
      try { await base44.entities.PostingCadence.update(cadence.id, { weeklyTarget: n }); onSaved(); } catch { /* ignore */ }
    }
  }

  return (
    <div className="rounded-[10px] p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="inline-flex items-center gap-2 text-[13px] font-medium">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {PLATFORM_LABEL[cadence.platform] || cadence.platform}
        </span>
        <div className="inline-flex items-center gap-1.5">
          <span className="text-[13px] tabular-nums">
            <span className="font-semibold" style={{ color: met ? "#30D158" : "hsl(var(--foreground))" }}>{count}</span>
            <span className="text-muted-foreground"> / {target}</span>
          </span>
          <input
            type="number"
            min="0"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onBlur={commit}
            className="w-12 h-7 rounded-[6px] px-1.5 text-[12px] text-center bg-background/60"
            style={{ border: "0.5px solid var(--border)" }}
            title="Weekly target (0 removes)"
          />
          <button
            onClick={async () => { try { await base44.entities.PostingCadence.delete(cadence.id); onSaved(); } catch { /* ignore */ } }}
            className="w-7 h-7 rounded-[6px] flex items-center justify-center hover:bg-foreground/5 text-muted-foreground"
            title="Remove cadence"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="h-2 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: met ? "#30D158" : color }}
        />
      </div>
    </div>
  );
}