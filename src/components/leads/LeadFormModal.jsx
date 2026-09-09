import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X } from "lucide-react";
import { STATUS_LABELS, STATUS_ORDER } from "./LeadCard";
import { computeLeadScore, scoreTone } from "@/lib/leadScore";

export default function LeadFormModal({ lead, onClose, onSaved }) {
  const editing = !!lead;
  const [form, setForm] = useState({
    name: "",
    channelUrl: "",
    status: "TO_CONTACT",
    upfrontCash: "",
    monthlyRecurring: "",
    subscribers: "",
    avgViews: "",
    niche: "",
    lastContactDate: "",
    nextFollowUp: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (lead) {
      setForm({
        name: lead.name || "",
        channelUrl: lead.channelUrl || "",
        status: lead.status || "TO_CONTACT",
        upfrontCash: lead.upfrontCash ?? "",
        monthlyRecurring: lead.monthlyRecurring ?? "",
        subscribers: lead.subscribers ?? "",
        avgViews: lead.avgViews ?? "",
        niche: lead.niche || "",
        lastContactDate: lead.lastContactDate || "",
        nextFollowUp: lead.nextFollowUp || "",
        notes: lead.notes || "",
      });
    }
  }, [lead]);

  function set(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (saving) return;
    setSaving(true);
    setErr("");
    try {
      const num = (v) => (v === "" ? null : Number(v));
      const payload = {
        name: form.name.trim(),
        channelUrl: form.channelUrl.trim() || null,
        status: form.status,
        upfrontCash: num(form.upfrontCash),
        monthlyRecurring: num(form.monthlyRecurring),
        subscribers: num(form.subscribers),
        avgViews: num(form.avgViews),
        niche: form.niche.trim() || null,
        lastContactDate: form.lastContactDate || null,
        nextFollowUp: form.nextFollowUp || null,
        notes: form.notes.trim() || null,
      };
      payload.score = computeLeadScore(payload);
      if (editing) await base44.entities.Lead.update(lead.id, payload);
      else {
        await base44.entities.Lead.create(payload);
        try {
          await base44.entities.Notification.create({
            type: "NEW_LEAD",
            message: `New lead added: ${payload.name}`,
            link: "/leads",
            read: false,
          });
        } catch { /* notification optional */ }
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to save lead.");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!editing) return;
    try {
      await base44.entities.Lead.delete(lead.id);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e.message || "Failed to delete lead.");
    }
  }

  const inputCls = "w-full h-10 rounded-[10px] px-3 text-[14px] outline-none";
  const inputStyle = { background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-lg p-5" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[16px] font-semibold">{editing ? "Edit lead" : "New lead"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:opacity-70"><X className="w-4 h-4" /></button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Name</span>
            <input value={form.name} onChange={(e) => set("name", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="Prospect name" />
          </label>
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Channel URL</span>
            <input value={form.channelUrl} onChange={(e) => set("channelUrl", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="youtube.com/@handle" />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Status</span>
            <select value={form.status} onChange={(e) => set("status", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle}>
              {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Upfront cash ($)</span>
            <input type="number" value={form.upfrontCash} onChange={(e) => set("upfrontCash", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="0" />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Monthly recurring ($)</span>
            <input type="number" value={form.monthlyRecurring} onChange={(e) => set("monthlyRecurring", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="0" />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Subscribers</span>
            <input type="number" value={form.subscribers} onChange={(e) => set("subscribers", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="0" />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Avg views / video</span>
            <input type="number" value={form.avgViews} onChange={(e) => set("avgViews", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="0" />
          </label>
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Niche</span>
            <input value={form.niche} onChange={(e) => set("niche", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} placeholder="e.g. Fitness, Finance, Tech" />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Last contact</span>
            <input type="date" value={form.lastContactDate} onChange={(e) => set("lastContactDate", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} />
          </label>
          <label className="block">
            <span className="text-[13px] text-muted-foreground">Next follow-up</span>
            <input type="date" value={form.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} className={`mt-1 ${inputCls}`} style={inputStyle} />
          </label>
          <label className="block col-span-2">
            <span className="text-[13px] text-muted-foreground">Notes</span>
            <textarea value={form.notes} onChange={(e) => set("notes", e.target.value)} rows={2} className={`mt-1 w-full rounded-[10px] px-3 py-2 text-[14px] outline-none`} style={inputStyle} />
          </label>
        </div>

        <div className="mt-3 flex items-center gap-2 text-[13px]">
          <span className="text-muted-foreground">Lead score</span>
          <span className="font-semibold tabular-nums" style={{ color: scoreTone(computeLeadScore({ ...form, upfrontCash: form.upfrontCash === "" ? 0 : Number(form.upfrontCash), monthlyRecurring: form.monthlyRecurring === "" ? 0 : Number(form.monthlyRecurring), subscribers: form.subscribers === "" ? 0 : Number(form.subscribers), avgViews: form.avgViews === "" ? 0 : Number(form.avgViews) })) }}>
            {computeLeadScore({ ...form, upfrontCash: form.upfrontCash === "" ? 0 : Number(form.upfrontCash), monthlyRecurring: form.monthlyRecurring === "" ? 0 : Number(form.monthlyRecurring), subscribers: form.subscribers === "" ? 0 : Number(form.subscribers), avgViews: form.avgViews === "" ? 0 : Number(form.avgViews) })}/100
          </span>
        </div>

        {err && <p className="text-[13px] text-destructive mt-3">{err}</p>}

        <div className="flex justify-between mt-5">
          <div>
            {editing && (
              <button onClick={remove} className="h-9 px-4 rounded-[8px] text-[13px] font-medium" style={{ color: "#FF453A", border: "0.5px solid rgba(255,69,58,0.3)" }}>
                Delete
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="h-9 px-4 rounded-[8px] text-[13px] font-medium hover:bg-white/10">Cancel</button>
            <button onClick={save} disabled={saving || !form.name.trim()} className="h-9 px-4 rounded-[8px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {editing ? "Save changes" : "Add lead"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}