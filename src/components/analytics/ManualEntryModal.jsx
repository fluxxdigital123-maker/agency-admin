import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";

const FIELD = (label, placeholder) => ({ label, placeholder });

export default function ManualEntryModal({ clientId, onClose, onSaved }) {
  const [form, setForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    subscribers: "",
    views: "",
    watchHours: "",
    impressionsCTR: "",
    topVideos: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setErr("");
    try {
      await base44.entities.AnalyticsSnapshot.create({
        client: clientId,
        date: form.date,
        subscribers: form.subscribers === "" ? null : Number(form.subscribers),
        views: form.views === "" ? null : Number(form.views),
        watchHours: form.watchHours === "" ? null : Number(form.watchHours),
        impressionsCTR: form.impressionsCTR === "" ? null : Number(form.impressionsCTR),
        topVideos: form.topVideos.trim() || null,
      });
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save snapshot.");
    } finally {
      setSaving(false);
    }
  }

  const numField = (name, label, ph) => (
    <label key={name} className="block">
      <span className="text-[13px] text-muted-foreground">{label}</span>
      <input
        type="number"
        value={form[name]}
        onChange={(e) => set(name, e.target.value)}
        placeholder={ph}
        className="mt-1 w-full h-10 rounded-[10px] px-3 text-[14px] outline-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
      />
    </label>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)" }}
      onClick={onClose}
    >
      <div
        className="glass-modal w-full max-w-lg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold">Add analytics snapshot</h3>
          <button onClick={onClose} className="text-muted-foreground hover:opacity-70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Date</span>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="mt-1 w-full h-10 rounded-[10px] px-3 text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
            />
          </label>
          {numField("subscribers", "Subscribers", "e.g. 124500")}
          {numField("views", "Total views", "e.g. 8200000")}
          {numField("watchHours", "Watch hours", "e.g. 4320")}
          {numField("impressionsCTR", "CTR (%)", "e.g. 4.2")}
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Top videos (optional, JSON or text)</span>
            <textarea
              value={form.topVideos}
              onChange={(e) => set("topVideos", e.target.value)}
              rows={3}
              placeholder='[{"title":"...","url":"...","views":12000}]'
              className="mt-1 w-full rounded-[10px] px-3 py-2 text-[13px] outline-none font-mono"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
            />
          </label>
        </div>

        {err && <p className="text-[13px] text-destructive mt-3">{err}</p>}

        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onClose}
            className="h-9 px-4 rounded-[8px] text-[13px] font-medium hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="h-9 px-4 rounded-[8px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save snapshot
          </button>
        </div>
      </div>
    </div>
  );
}