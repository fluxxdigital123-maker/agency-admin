import React from "react";
import { BarChart3 } from "lucide-react";
import { fmtNumber, fmtDate } from "@/lib/format";

export default function ClientAnalytics({ snapshots }) {
  const latest = snapshots && snapshots[0];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[20px] font-semibold tracking-tight">Performance</h2>
        {latest && (
          <span className="text-[13px] text-muted-foreground ml-auto">
            as of {fmtDate(latest.date)}
          </span>
        )}
      </div>

      {!latest ? (
        <p className="text-[15px] text-muted-foreground">
          No analytics snapshots yet. Snapshots will appear here once imported.
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Metric label="Views" value={fmtNumber(latest.views)} />
            <Metric label="Subscribers" value={fmtNumber(latest.subscribers)} />
            <Metric label="Watch hours" value={fmtNumber(latest.watchHours)} />
            <Metric label="Impressions CTR" value={latest.impressionsCTR != null ? `${latest.impressionsCTR}%` : "—"} />
          </div>
          {latest.topVideos && (
            <div className="mt-5">
              <div className="text-[13px] font-medium text-muted-foreground mb-1.5">Top videos</div>
              <p className="text-[14px] leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {latest.topVideos}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[20px] font-semibold tracking-tight mt-1">{value}</div>
    </div>
  );
}