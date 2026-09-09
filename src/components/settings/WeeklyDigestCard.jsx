import React, { useState, useEffect } from "react";
import { Mail, Loader2, Check, Send } from "lucide-react";
import { upsertSetting, loadSettingsMap } from "@/lib/integrations";
import { base44 } from "@/api/base44Client";

export default function WeeklyDigestCard() {
  const [enabled, setEnabled] = useState(true);
  const [email, setEmail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);
  const [testMsg, setTestMsg] = useState("");

  useEffect(() => {
    loadSettingsMap().then((m) => {
      setEnabled(m["digest_enabled"] !== "false");
      setEmail(m["digest_email"] || "");
    });
  }, []);

  async function toggle(v) {
    setEnabled(v);
    setSaving(true);
    try {
      await upsertSetting("digest_enabled", v ? "true" : "false");
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function saveEmail() {
    setSaving(true);
    try {
      await upsertSetting("digest_email", email.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } finally {
      setSaving(false);
    }
  }

  async function sendTest() {
    setSending(true);
    setTestMsg("");
    try {
      await saveEmail();
      const res = await base44.functions.invoke("generateWeeklyDigest", { test: true });
      const data = res?.data || res;
      if (data?.error) {
        setTestMsg(`Error: ${data.error}`);
      } else {
        setTestMsg(
          `Sent to ${data.recipient} — ${data.clients} clients, ${data.totalViews || 0} views, ${data.overdue} overdue, ${data.guarantees} guarantee flags.`
        );
      }
    } catch (e) {
      setTestMsg(`Error: ${e.message || "Could not send test digest."}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Mail className="w-[18px] h-[18px]" style={{ color: "#0A84FF" }} />
        <h2 className="text-[18px] font-semibold tracking-tight">Weekly Digest</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Every Monday at 08:00, a single email summarizing per-client views, posted clips,
        pipeline status, overdue payments, and 30-day-guarantee flags. Sent to the address below.
      </p>

      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-[14px] font-medium">Weekly digest email</div>
            <div className="text-[12px] text-muted-foreground">
              {enabled ? "On — sent every Monday" : "Off — schedule paused"}
            </div>
          </div>
          <button
            onClick={() => toggle(!enabled)}
            className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
            style={{ background: enabled ? "hsl(var(--primary))" : "rgba(120,120,128,0.3)" }}
            aria-label="Toggle weekly digest"
          >
            <span
              className="inline-block h-5 w-5 rounded-full bg-white transition-transform"
              style={{ transform: enabled ? "translateX(22px)" : "translateX(2px)" }}
            />
          </button>
        </div>

        <div>
          <label className="text-[12px] text-muted-foreground">Recipient email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={saveEmail}
            placeholder="owner@agency.com"
            className="w-full h-9 rounded-[9px] px-3 text-[14px] outline-none mt-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            Leave blank to use the first admin account's email.
          </p>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={sendTest}
            disabled={sending}
            className="h-9 px-4 rounded-[9px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}{" "}
            {sending ? "Sending…" : "Send test digest"}
          </button>
          {saving && <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Saving…</span>}
          {saved && !sending && <span className="text-[12px] inline-flex items-center gap-1" style={{ color: "#30D158" }}><Check className="w-3.5 h-3.5" /> Saved</span>}
        </div>

        {testMsg && (
          <div
            className="text-[12px] rounded-[9px] px-3 py-2"
            style={
              testMsg.startsWith("Error")
                ? { background: "rgba(255,69,58,0.12)", color: "#FF453A" }
                : { background: "rgba(48,209,88,0.12)", color: "#30D158" }
            }
          >
            {testMsg}
          </div>
        )}
      </div>
    </div>
  );
}