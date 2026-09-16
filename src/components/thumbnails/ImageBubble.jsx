import React, { useState } from "react";
import { Loader2, RefreshCw, Layers, Download, Star, Type, ChevronLeft, ChevronRight, Wrench, Sparkles } from "lucide-react";

const STATUS = {
  PAID: "#30D158",
  PENDING: "#FF9F0A",
  OVERDUE: "#FF453A",
};

export default function ImageBubble({ message, shimmer, busy, onRegenerate, onVariations, onRate, onTextOverlay }) {
  const variations = message?.variations && message.variations.length
    ? message.variations
    : message?.imageUrl
    ? [message.imageUrl]
    : [];
  const [active, setActive] = useState(0);
  const [hoverStar, setHoverStar] = useState(0);

  // Shimmer placeholder while generating
  if (shimmer) {
    return (
      <div className="flex gap-3">
        <Avatar />
        <div
          className="rounded-2xl overflow-hidden"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)", width: 320, height: 180 }}
        >
          <div className="w-full h-full shimmer-bg" />
        </div>
      </div>
    );
  }

  // Degraded state — Higgsfield not connected
  if (variations.length === 0) {
    return (
      <div className="flex gap-3">
        <Avatar />
        <div
          className="rounded-2xl px-4 py-3 max-w-[360px]"
          style={{ background: "rgba(255,159,10,0.08)", border: "0.5px solid rgba(255,159,10,0.25)" }}
        >
          <div className="flex items-center gap-2 mb-1">
            <Wrench className="w-3.5 h-3.5" style={{ color: "#FF9F0A" }} />
            <span className="text-[14px] font-medium">Connect Higgsfield to generate images</span>
          </div>
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            Image generation uses the Higgsfield API (nano-banana-pro, 16:9, 4K). Add your API key + secret in Settings to start generating thumbnails. The chat works without it.
          </p>
          {onRegenerate && (
            <button
              onClick={() => onRegenerate(message)}
              disabled={busy}
              className="mt-3 inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[12px] font-medium transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ background: "rgba(255,159,10,0.16)", color: "#FF9F0A" }}
            >
              {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  const url = variations[Math.min(active, variations.length - 1)];
  const rating = message?.rating || 0;

  return (
    <div className="flex gap-3">
      <Avatar />
      <div className="max-w-[420px]">
        <div className="relative rounded-2xl overflow-hidden" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <img src={url} alt="thumbnail" className="block w-full h-auto" />
          {busy && (
            <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            </div>
          )}
          {variations.length > 1 && (
            <>
              <button
                onClick={() => setActive((a) => (a - 1 + variations.length) % variations.length)}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={() => setActive((a) => (a + 1) % variations.length)}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full flex items-center justify-center"
                style={{ background: "rgba(0,0,0,0.45)" }}
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
              <span className="absolute bottom-2 right-2 text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>
                {active + 1}/{variations.length}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <ActionBtn icon={RefreshCw} label="Regenerate" onClick={() => onRegenerate && onRegenerate(message, active)} disabled={busy} />
          <ActionBtn icon={Layers} label="3 variations" onClick={() => onVariations && onVariations(message)} disabled={busy} />
          <ActionBtn icon={Download} label="Download" onClick={() => downloadUrl(url)} />
          <ActionBtn icon={Type} label="Add text" onClick={() => onTextOverlay && onTextOverlay(message, active)} />

          {/* Rating */}
          <div className="flex items-center gap-0.5 ml-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onMouseEnter={() => setHoverStar(n)}
                onMouseLeave={() => setHoverStar(0)}
                onClick={() => onRate && onRate(message, n)}
                className="p-0.5"
              >
                <Star
                  className="w-4 h-4 transition-colors"
                  style={{ color: (hoverStar || rating) >= n ? "#FF9F0A" : "rgba(128,128,128,0.4)" }}
                  fill={(hoverStar || rating) >= n ? "#FF9F0A" : "transparent"}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function Avatar() {
  return (
    <div
      className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
      style={{ background: "linear-gradient(135deg, rgba(191,90,242,0.2), rgba(10,132,255,0.2))" }}
    >
      <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-purple))" }} />
    </div>
  );
}

function ActionBtn({ icon: Icon, label, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-[8px] text-[12px] font-medium transition-colors hover:bg-white/10 disabled:opacity-50"
      style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

async function downloadUrl(url) {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const u = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = u;
    a.download = `thumbnail-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(u);
  } catch {
    window.open(url, "_blank");
  }
}