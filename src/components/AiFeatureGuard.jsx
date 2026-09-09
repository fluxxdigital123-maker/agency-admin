import React, { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight, Wrench } from "lucide-react";

/**
 * Wraps an AI-powered section. When `ready` is false (AI not configured or
 * a call failed), it renders the graceful-degradation placeholder instead:
 * "This tool will be available once you connect your API key" with an
 * expandable "Here's how". Apply this to every AI feature in the app.
 *
 * Props:
 *  - ready: boolean (true => render children)
 *  - title: optional section title shown in the degraded state
 *  - children: the AI-driven content
 *  - minHeight: optional min height for the degraded box
 */
export default function AiFeatureGuard({ ready, title, children, minHeight }) {
  const [open, setOpen] = useState(false);

  if (ready) return <>{children}</>;

  return (
    <div
      className="glass-card p-6 flex flex-col items-center justify-center text-center"
      style={{ minHeight: minHeight || 180 }}
    >
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4"
        style={{
          background: "rgba(255,159,10,0.12)",
          border: "0.5px solid rgba(255,159,10,0.25)",
        }}
      >
        <Sparkles className="w-5 h-5" style={{ color: "#FF9F0A" }} />
      </div>
      {title && (
        <h3 className="text-[17px] font-semibold tracking-tight mb-1">{title}</h3>
      )}
      <p className="text-[15px] text-muted-foreground max-w-sm">
        This tool will be available once you connect your API key.
      </p>
      <button
        onClick={() => setOpen((o) => !o)}
        className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:opacity-80 transition-opacity"
      >
        <Wrench className="w-3.5 h-3.5" />
        Here&apos;s how
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
      </button>
      {open && (
        <div className="mt-4 text-left text-[13px] leading-relaxed text-muted-foreground max-w-md glass-card p-4">
          <ol className="list-decimal pl-4 space-y-1.5">
            <li>Go to Settings in the sidebar.</li>
            <li>
              Open the AI &amp; Integrations section and connect your AI API
              key.
            </li>
            <li>
              Once connected, channel analysis, strategy recommendations, and
              growth opportunities will auto-populate here.
            </li>
          </ol>
          <p className="mt-3 text-muted-foreground/80">
            Tip: Paste a full YouTube channel URL (e.g.
            youtube.com/@handle) for the most accurate analysis.
          </p>
        </div>
      )}
    </div>
  );
}