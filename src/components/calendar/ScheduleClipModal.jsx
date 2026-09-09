import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X, Loader2 } from "lucide-react";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/platforms";

export default function ScheduleClipModal({ open, clients, onClose, onSaved }) {
  const [mode, setMode] = useState("new");
  const [clientId, setClientId] = useState("");
  const [platform, setPlatform] = useState("YOUTUBE_SHORTS");
  const [title, setTitle] = useState("");
  const [clipId, setClipId] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [existing, setExisting] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!open) return;
    setErr("");
    if (clients.length && !clientId) setClientId(clients[0].id);
  }, [open, clients, clientId]);

  useEffect(() => {
    if (!open) return;
    if (mode === "existing" && clientId) {
      base44.entities.Clip
        .filter({ client: clientId }, "-created_date", 200)
        .then((rows) => setExisting(rows || []))
        .catch(() => setExisting([]));
      setClipId("");
    } else {
      setExisting([]);
      setClipId("");
    }
  }, [mode, clientId, open]);

  if (!open) return null;

  function reset() {
    setTitle("");
    setClipId("");
    setScheduledDate("");
    setErr("");
    setMode("new");
  }

  async function submit() {
    if (!scheduledDate) { setErr("Pick a scheduled date."); return; }
    setSaving(true); setErr("");
    try {
      if (mode === "new") {
        if (!clientId) { setErr("Choose a client."); return; }
        if (!title.trim()) { setErr("Title is required."); return; }
        await base44.entities.Clip.create({
          client: clientId,
          title: title.trim(),
          platform,
          scheduledDate,
          status: "QUEUED",
        });
      } else {
        if (!clipId) { setErr("Choose a clip to schedule."); return; }
        await base44.entities.Clip.update(clipId, { scheduledDate });
      }
      onSaved();
      reset();
    } catch (e) {
      setErr(e.message || "Could not schedule clip.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-tight">Schedule Clip</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="inline-flex rounded-[10px] p-0.5 mb-4" style={{ background: "rgba(255,255,255,0.05)" }}>
          {["new", "existing"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className="px-3 h-8 rounded-[8px] text-[13px] font-medium transition-colors"
              style={mode === m ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { color: "hsl(var(--muted-foreground))" }}
            >
              {m === "new" ? "New clip" : "Existing clip"}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <Field label="Client">
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} className="inp">
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>

          {mode === "new" ? (
            <>
              <Field label="Title">
                <input value={title} onChange={(e) => setTitle(e.target.value)} className="inp" placeholder="Clip title" />
              </Field>
              <Field label="Platform">
                <select value={platform} onChange={(e) => setPlatform(e.target.value)} className="inp">
                  {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
                </select>
              </Field>
            </>
          ) : (
            <Field label="Clip">
              <select value={clipId} onChange={(e) => setClipId(e.target.value)} className="inp">
                <option value="">Select a clip</option>
                {existing.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title} {c.scheduledDate ? `(scheduled ${c.scheduledDate})` : "(unscheduled)"}
                  </option>
                ))}
              </select>
            </Field>
          )}

          <Field label="Scheduled date">
            <input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} className="inp" />
          </Field>
        </div>

        {err && <p className="text-[13px] mt-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium hover:bg-foreground/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            {saving ? "Scheduling…" : "Schedule"}
          </button>
        </div>
      </div>
      <style>{`.inp{width:100%;height:38px;border-radius:10px;border:0.5px solid var(--border);background:rgba(255,255,255,0.04);padding:0 10px;font-size:14px;outline:none;color:hsl(var(--foreground))}.inp:focus{box-shadow:0 0 0 2px hsl(var(--ring)/0.4)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}