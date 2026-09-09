import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Link2, Copy, Check, RefreshCw, Loader2 } from "lucide-react";

export default function ClientReviewCard({ client, onSaved }) {
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const link = client.reviewToken ? `${origin}/review/${client.reviewToken}` : "";

  async function generate() {
    setBusy(true);
    try {
      const tok =
        (typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2)) +
        Date.now().toString(36);
      await base44.entities.Client.update(client.id, { reviewToken: tok });
      onSaved();
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[20px] font-semibold tracking-tight">Client Review Link</h2>
      </div>
      <p className="text-[14px] text-muted-foreground mb-4">
        Send this private link to the client. They'll see clips currently in Review and can approve or request changes — approvals show up on the dashboard.
      </p>

      {link ? (
        <div className="flex items-center gap-2">
          <input
            readOnly
            value={link}
            className="flex-1 h-9 rounded-[10px] px-3 text-[13px] bg-background/60 outline-none truncate"
            style={{ border: "0.5px solid var(--border)" }}
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
          <button
            onClick={generate}
            disabled={busy}
            title="Regenerate link (old link stops working)"
            className="inline-flex items-center justify-center w-9 h-9 rounded-[10px] hover:bg-foreground/5 disabled:opacity-50"
            style={{ border: "0.5px solid var(--border)" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          </button>
        </div>
      ) : (
        <button
          onClick={generate}
          disabled={busy}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
          Generate review link
        </button>
      )}
    </div>
  );
}