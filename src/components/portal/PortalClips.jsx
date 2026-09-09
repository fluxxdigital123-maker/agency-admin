import React from "react";
import { ExternalLink, Eye, ThumbsUp, MessageCircle, Film } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/platforms";

const fmt = (n) =>
  n ? Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n) : "—";

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";

export default function PortalClips({ clips = [] }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Film className="w-[18px] h-[18px] text-white/50" />
        <h2 className="text-[17px] font-semibold tracking-tight text-white">Posted clips</h2>
        <span className="text-[12px] text-white/40">{clips.length}</span>
      </div>
      {clips.length === 0 ? (
        <p className="text-[14px] text-white/40 py-8 text-center">No clips posted yet.</p>
      ) : (
        <div className="space-y-2">
          {clips.map((c) => {
            const color = PLATFORM_COLOR[c.platform] || "#8E8E93";
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-[12px] px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[14px] font-medium text-white truncate">{c.title}</span>
                    <span
                      className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-semibold shrink-0"
                      style={{ background: `${color}26`, color }}
                    >
                      {PLATFORM_LABEL[c.platform] || c.platform}
                    </span>
                  </div>
                  <div className="text-[11px] text-white/40 mt-0.5">Posted {fmtDate(c.postedDate)}</div>
                </div>
                <div className="hidden sm:flex items-center gap-4 text-[12px] tabular-nums text-white/60">
                  <span className="inline-flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{fmt(c.views)}</span>
                  <span className="inline-flex items-center gap-1"><ThumbsUp className="w-3.5 h-3.5" />{fmt(c.likes)}</span>
                  <span className="inline-flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{fmt(c.comments)}</span>
                </div>
                {c.clipUrl && (
                  <a
                    href={c.clipUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center w-8 h-8 rounded-[10px] text-white/60 hover:text-white hover:bg-white/10 shrink-0"
                    title="Watch"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}