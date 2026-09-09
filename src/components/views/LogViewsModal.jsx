import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { X } from "lucide-react";
import { PLATFORMS, PLATFORM_LABEL } from "@/lib/viewPlatforms";

export default function LogViewsModal({ clients, onClose, onSaved }) {
  const [form, setForm] = useState({
    client: "",
    clip: "",
    date: new Date().toISOString().slice(0, 10),
    platform: "YOUTUBE_SHORTS",
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });
  const [clips, setClips] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!form.client) { setClips([]); return; }
    base44.entities.Clip.filter({ client: form.client }, "-created_date", 200)
      .then((r) => setClips(r || []))
      .catch(() => setClips([]));
  }, [form.client]);

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.client) { setErr("Client is required."); return; }
    if (!form.date) { setErr("Date is required."); return; }
    setSaving(true); setErr("");
    try {
      await base44.entities.ViewSnapshot.create({
        client: form.client,
        clip: form.clip || undefined,
        date: form.date,
        platform: form.platform,
        views: form.views === "" ? undefined : Number(form.views),
        likes: form.likes === "" ? undefined : Number(form.likes),
        comments: form.comments === "" ? undefined : Number(form.comments),
        shares: form.shares === "" ? undefined : Number(form.shares),
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "Could not save.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-tight">Log Views</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <Field label="Client *">
            <select value={form.client} onChange={(e) => set("client", e.target.value)} className="inp">
              <option value="">Select client</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date *">
              <input type="date" value={form.date} onChange={(e) => set("date", e.target.value)} className="inp" />
            </Field>
            <Field label="Platform">
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className="inp">
                {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Clip (optional)">
            <select value={form.clip} onChange={(e) => set("clip", e.target.value)} className="inp">
              <option value="">None</option>
              {clips.map((cl) => <option key={cl.id} value={cl.id}>{cl.title}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Views"><input type="number" value={form.views} onChange={(e) => set("views", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Likes"><input type="number" value={form.likes} onChange={(e) => set("likes", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Comments"><input type="number" value={form.comments} onChange={(e) => set("comments", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Shares"><input type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)} className="inp" placeholder="0" /></Field>
          </div>
        </div>
        {err && <p className="text-[13px] mt-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium hover:bg-foreground/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
        <style>{`.inp{width:100%;height:38px;border-radius:10px;border:0.5px solid var(--border);background:rgba(255,255,255,0.04);padding:0 10px;font-size:14px;outline:none}.inp:focus{box-shadow:0 0 0 2px hsl(var(--ring)/0.4)}`}</style>
      </div>
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