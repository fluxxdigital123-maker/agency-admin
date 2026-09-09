import React, { useMemo } from "react";
import { CalendarClock, ExternalLink } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/platforms";

const fmtDate = (s) =>
  s ? new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "—";

const STATUS_LABEL = {
  QUEUED: "Queued",
  EDITING: "Editing",
  REVIEW: "In review",
  APPROVED: "Approved",
  POSTED: "Posted",
};

export default function PortalSchedule({ clips = [] }) {
  const upcoming = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return clips
      .filter((c) => c.scheduledDate && c.scheduledDate >= today && c.status !== "POSTED")
      .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate));
  }, [clips]);

  const inProgress = useMemo(
    () => clips.filter((c) => !c.scheduledDate && ["QUEUED", "EDITING", "REVIEW"].includes(c.status)),
    [clips]
  );

  const rows = [...upcoming, ...inProgress].slice(0, 8);

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock className="w-[18px] h-[18px] text-white/50" />
        <h2 className="text-[17px] font-semibold tracking-tight text-white">Upcoming content</h2>
      </div>
      {rows.length === 0 ? (
        <p className="text-[14px] text-white/40 py-8 text-center">Nothing scheduled right now.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((c) => {
            const color = PLATFORM_COLOR[c.platform] || "#8E8E93";
            return (
              <div
                key={c.id}
                className="flex items-center gap-3 rounded-[12px] px-3 py-2.5"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.06)" }}
              >
                <div className="text-center shrink-0 w-12">
                  <div className="text-[13px] font-semibold text-white">{c.scheduledDate ? fmtDate(c.scheduledDate).split(" ")[1] : "—"}</div>
                  <div className="text-[10px] text-white/40">{c.scheduledDate ? fmtDate(c.scheduledDate).split(" ")[0] : STATUS_LABEL[c.status]}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium text-white truncate">{c.title}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] font-semibold" style={{ color }}>{PLATFORM_LABEL[c.platform] || c.platform}</span>
                    <span className="text-[11px] text-white/40">· {STATUS_LABEL[c.status]}</span>
                  </div>
                </div>
                {c.clipUrl && (
                  <a href={c.clipUrl} target="_blank" rel="noreferrer" className="text-white/50 hover:text-white shrink-0">
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