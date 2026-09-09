import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured, analyzeChannel } from "@/lib/aiStatus";
import { PLAN_LABELS } from "@/lib/clientStages";
import { fmtMoney } from "@/lib/format";
import {
  X, Loader2, Sparkles, Minus, Plus, Trash2, AlertCircle, Link2,
} from "lucide-react";

const PLAN_TYPES = ["TEAM_ONLY", "PERSONAL_INVOLVED", "CUSTOM"];

export default function ClientFormModal({ open, onClose, onSaved, client }) {
  const isEdit = !!client;
  const aiConfigured = useAiConfigured();

  const [channelUrl, setChannelUrl] = useState("");
  const [name, setName] = useState("");
  const [planType, setPlanType] = useState("TEAM_ONLY");
  const [customLabel, setCustomLabel] = useState("");
  const [customFee, setCustomFee] = useState(0);
  const [monthlyFee, setMonthlyFee] = useState("");
  const [setupFee, setSetupFee] = useState(30000);
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState("ACTIVE");
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setError("");
    if (client) {
      setChannelUrl(client.channelUrl || "");
      setName(client.name || "");
      setPlanType(client.planType || "TEAM_ONLY");
      setCustomLabel(client.customPlanLabel || "");
      const mf = client.monthlyFee || 0;
      setCustomFee(Math.min(20000, Math.round(mf / 1000) * 1000));
      setMonthlyFee(client.monthlyFee != null ? String(client.monthlyFee) : "");
      setSetupFee(client.setupFee != null ? client.setupFee : 30000);
      setStartDate(client.startDate || "");
      setNotes(client.notes || "");
      setStatus(client.status || "ACTIVE");
    } else {
      setChannelUrl("");
      setName("");
      setPlanType("TEAM_ONLY");
      setCustomLabel("");
      setCustomFee(0);
      setMonthlyFee("");
      setSetupFee(30000);
      setStartDate("");
      setNotes("");
      setStatus("ACTIVE");
    }
  }, [open, client]);

  if (!open) return null;

  function stepCustom(delta) {
    setCustomFee((v) => Math.max(0, Math.min(20000, v + delta)));
  }

  async function handleSubmit() {
    setError("");
    if (!channelUrl.trim()) {
      setError("YouTube channel URL is required.");
      return;
    }
    setSaving(true);

    let aiData = null;
    if (!isEdit && aiConfigured) {
      setAnalyzing(true);
      try {
        aiData = await analyzeChannel(channelUrl.trim());
      } catch {
        aiData = null;
      } finally {
        setAnalyzing(false);
      }
    }

    const resolvedMonthlyFee =
      planType === "CUSTOM" ? customFee : monthlyFee === "" ? null : Number(monthlyFee);

    const payload = {
      name: name.trim() || (aiData && aiData.channelName) || channelUrl.trim(),
      channelUrl: channelUrl.trim(),
      planType,
      customPlanLabel: planType === "CUSTOM" ? customLabel.trim() : "",
      monthlyFee: resolvedMonthlyFee,
      setupFee: Number(setupFee) || 0,
      startDate: startDate || null,
      notes: notes.trim(),
      status,
    };

    if (aiData) {
      payload.channelSummary = aiData.channelSummary || "";
      payload.contentStyle = aiData.contentStyle || "";
      payload.offers = aiData.offers || "";
      payload.contentStrategy = aiData.contentStrategy
        ? JSON.stringify(aiData.contentStrategy)
        : "";
      payload.growthOpportunities = aiData.growthOpportunities
        ? aiData.growthOpportunities.join("\n")
        : "";
    }

    try {
      if (isEdit) {
        await base44.entities.Client.update(client.id, payload);
      } else {
        await base44.entities.Client.create(payload);
      }
      onSaved && onSaved();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save client.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!isEdit) return;
    if (!window.confirm(`Delete "${client.name}"? This cannot be undone.`)) return;
    setSaving(true);
    try {
      await base44.entities.Client.delete(client.id);
      onSaved && onSaved();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to delete client.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass-modal mobile-sheet w-full max-w-xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-6 py-4 sticky top-0 z-10"
          style={{ borderBottom: "0.5px solid var(--border)" }}
        >
          <h2 className="text-[20px] font-semibold tracking-tight">
            {isEdit ? "Edit Client" : "Add Client"}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-[10px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
          >
            <X className="w-[18px] h-[18px]" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Channel URL */}
          <div>
            <label className="text-[13px] font-medium text-muted-foreground">
              YouTube Channel URL
            </label>
            <div className="relative mt-1.5">
              <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
                placeholder="youtube.com/@handle"
                className="w-full rounded-[12px] bg-background/60 border border-border pl-9 pr-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            {!isEdit && (
              <p className="mt-2 text-[13px] text-muted-foreground flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#0A84FF" }} />
                {aiConfigured
                  ? "On create, AI analyzes the channel and auto-fills the summary, content style, offers, strategy, and growth opportunities."
                  : "AI analysis isn't connected — the client will be saved without an auto-analysis. You can refresh later once connected."}
              </p>
            )}
          </div>

          {/* Name (optional) */}
          <div>
            <label className="text-[13px] font-medium text-muted-foreground">
              Client name <span className="text-muted-foreground/60">(optional — auto-filled by AI)</span>
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Channel or brand name"
              className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
            />
          </div>

          {/* Plan type */}
          <div>
            <label className="text-[13px] font-medium text-muted-foreground">Plan type</label>
            <div className="mt-1.5 grid grid-cols-3 gap-2">
              {PLAN_TYPES.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPlanType(p)}
                  className="h-10 rounded-[10px] text-[13px] font-medium transition-all"
                  style={
                    planType === p
                      ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                      : { background: "rgba(255,255,255,0.05)", border: "0.5px solid var(--border)", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {PLAN_LABELS[p]}
                </button>
              ))}
            </div>
          </div>

          {/* Custom plan controls */}
          {planType === "CUSTOM" && (
            <div className="space-y-3 rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
              <div>
                <label className="text-[13px] font-medium text-muted-foreground">Custom label</label>
                <input
                  value={customLabel}
                  onChange={(e) => setCustomLabel(e.target.value)}
                  placeholder="e.g. Hybrid Growth"
                  className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
              <div>
                <label className="text-[13px] font-medium text-muted-foreground">
                  Monthly retainer — {fmtMoney(customFee)}
                </label>
                <div className="mt-1.5 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => stepCustom(-1000)}
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-secondary hover:opacity-80 transition-opacity"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={20000}
                    step={1000}
                    value={customFee}
                    onChange={(e) => setCustomFee(Number(e.target.value))}
                    className="flex-1 accent-[var(--primary)]"
                  />
                  <button
                    type="button"
                    onClick={() => stepCustom(1000)}
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center bg-secondary hover:opacity-80 transition-opacity"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="mt-1 text-[12px] text-muted-foreground">
                  Stepped in ₹1,000 increments, up to ₹20,000.
                </p>
              </div>
            </div>
          )}

          {/* Monthly fee (non-custom) */}
          {planType !== "CUSTOM" && (
            <div>
              <label className="text-[13px] font-medium text-muted-foreground">Monthly fee (USD)</label>
              <input
                type="number"
                value={monthlyFee}
                onChange={(e) => setMonthlyFee(e.target.value)}
                placeholder="0"
                className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          )}

          {/* Setup fee + start date + status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[13px] font-medium text-muted-foreground">Setup fee (USD)</label>
              <input
                type="number"
                value={setupFee}
                onChange={(e) => setSetupFee(e.target.value)}
                className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <div>
              <label className="text-[13px] font-medium text-muted-foreground">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 h-11 text-[15px] outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-muted-foreground">Status</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2">
              {["ACTIVE", "CHURNED"].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className="h-10 rounded-[10px] text-[13px] font-medium transition-all"
                  style={
                    status === s
                      ? { background: s === "ACTIVE" ? "#30D158" : "#86868b", color: "#000" }
                      : { background: "rgba(255,255,255,0.05)", border: "0.5px solid var(--border)", color: "hsl(var(--muted-foreground))" }
                  }
                >
                  {s === "ACTIVE" ? "Active" : "Churned"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[13px] font-medium text-muted-foreground">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Internal notes…"
              className="mt-1.5 w-full rounded-[12px] bg-background/60 border border-border px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-primary/40 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-[13px]" style={{ color: "#FF453A" }}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <div
          className="px-6 py-4 flex items-center justify-between sticky bottom-0"
          style={{ borderTop: "0.5px solid var(--border)" }}
        >
          {isEdit ? (
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex items-center gap-2 text-[13px] font-medium hover:opacity-80 transition-opacity"
              style={{ color: "#FF453A" }}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="h-10 px-4 rounded-[10px] text-[14px] font-medium text-muted-foreground hover:bg-foreground/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="h-10 px-5 rounded-[10px] text-[14px] font-semibold inline-flex items-center gap-2 transition-opacity disabled:opacity-60"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {(saving || analyzing) && <Loader2 className="w-4 h-4 animate-spin" />}
              {analyzing ? "Analyzing…" : isEdit ? "Save changes" : "Analyze & Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}