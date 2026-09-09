import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, MessageSquarePlus } from "lucide-react";

/**
 * Critique box shown under each client AI tool. Saves the user's feedback as a
 * KnowledgeEntry scoped to the client (CLIENT_TITLES or CLIENT_IDEAS) so the AI
 * applies it on the next Regenerate.
 */
export default function CritiqueBox({ clientId, scope, label }) {
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [count, setCount] = useState(0);

  async function submit() {
    const v = text.trim();
    if (!v || saving) return;
    setSaving(true);
    try {
      await base44.entities.KnowledgeEntry.create({
        scope,
        client: clientId,
        userInput: v,
        learnedPrinciple: v,
        timestamp: new Date().toISOString(),
      });
      setCount((c) => c + 1);
      setSaved(true);
      setText("");
      setTimeout(() => setSaved(false), 1800);
    } catch {
      /* ignore */
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="mt-4 rounded-[12px] p-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <MessageSquarePlus className="w-3.5 h-3.5 text-muted-foreground" />
        <span className="text-[13px] font-medium">{label || "Critique & feedback"}</span>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={2}
        placeholder="Tell the AI what worked or what to fix — it'll apply your feedback next time…"
        className="w-full resize-none outline-none px-2 py-1.5 text-[13px] leading-relaxed rounded-[8px] bg-transparent"
        style={{ background: "rgba(255,255,255,0.03)" }}
      />
      <div className="flex items-center justify-between mt-2">
        <span className="text-[11px] text-muted-foreground/70">
          {count > 0 ? `${count} feedback note${count > 1 ? "s" : ""} saved` : "Saved as client knowledge"}
        </span>
        <button
          onClick={submit}
          disabled={!text.trim() || saving}
          className="inline-flex items-center gap-1.5 h-7 px-3 rounded-[8px] text-[12px] font-medium transition-opacity disabled:opacity-40"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : saved ? <Check className="w-3 h-3" /> : null}
          {saved ? "Saved" : "Save feedback"}
        </button>
      </div>
    </div>
  );
}