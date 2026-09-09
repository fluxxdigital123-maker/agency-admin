import React, { useMemo } from "react";
import { ListVideo, ExternalLink } from "lucide-react";
import { fmtNumber } from "@/lib/format";

export default function TopVideos({ latest }) {
  const videos = useMemo(() => {
    try {
      return JSON.parse(latest?.topVideos || "[]");
    } catch {
      return [];
    }
  }, [latest]);

  if (!videos.length) return null;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <ListVideo className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[17px] font-semibold tracking-tight">Top Videos</h2>
        <span className="text-[12px] text-muted-foreground ml-1">by view count</span>
      </div>
      <ol className="space-y-0">
        {videos.map((v, i) => (
          <li
            key={i}
            className="flex items-center gap-3 py-2.5"
            style={i ? { borderTop: "0.5px solid var(--border)" } : undefined}
          >
            <span className="text-[12px] font-mono text-muted-foreground w-5 shrink-0">{i + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium truncate">{v.title}</p>
              <p className="text-[12px] text-muted-foreground">{fmtNumber(v.views || 0)} views</p>
            </div>
            {v.url && (
              <a
                href={v.url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:opacity-70 shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}