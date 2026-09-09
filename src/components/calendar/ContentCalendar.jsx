import React from "react";
import { Plus, Clock, Check } from "lucide-react";
import { PLATFORMS, PLATFORM_COLOR, PLATFORM_LABEL } from "@/lib/platforms";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function ContentCalendar({ year, month, clips, clientMap, onSchedule }) {
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const byDate = {};
  for (const c of clips) {
    const raw = c.postedDate || c.scheduledDate;
    if (!raw) continue;
    const key = String(raw).slice(0, 10);
    (byDate[key] = byDate[key] || []).push(c);
  }

  return (
    <div className="glass-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          {PLATFORMS.map((p) => (
            <span key={p} className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: PLATFORM_COLOR[p] }} />
              {PLATFORM_LABEL[p]}
            </span>
          ))}
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground ml-1">
            <Clock className="w-3 h-3" /> Scheduled
          </span>
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Check className="w-3 h-3" /> Posted
          </span>
        </div>
        <button
          onClick={onSchedule}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Schedule Clip
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w) => (
          <div key={w} className="text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground py-1">
            {w}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((d, i) => {
          if (d === null) {
            return <div key={i} className="min-h-[88px] rounded-[10px]" style={{ background: "rgba(255,255,255,0.015)" }} />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayClips = byDate[dateStr] || [];
          const visible = dayClips.slice(0, 3);
          const extra = dayClips.length - visible.length;
          return (
            <div
              key={i}
              className="min-h-[88px] rounded-[10px] p-1.5 flex flex-col gap-1"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: isToday(d) ? "0.5px solid hsl(var(--primary))" : "0.5px solid var(--border)",
              }}
            >
              <span className="text-[11px] font-medium text-muted-foreground">{d}</span>
              {visible.map((c) => {
                const name = (clientMap[c.client] || {}).name || "—";
                const posted = c.status === "POSTED" && c.postedDate;
                const color = PLATFORM_COLOR[c.platform] || "#8E8E93";
                return (
                  <div
                    key={c.id}
                    title={`${c.title} · ${PLATFORM_LABEL[c.platform] || c.platform}`}
                    className="text-left rounded-[6px] px-1.5 py-1 text-[11px] leading-tight flex items-center gap-1"
                    style={{ background: `${color}1F`, color: "hsl(var(--foreground))", border: `0.5px solid ${color}55`, borderLeft: `2px solid ${color}` }}
                  >
                    <span className="font-medium truncate flex-1">{name}</span>
                    {posted ? (
                      <Check className="w-3 h-3 shrink-0" style={{ color }} />
                    ) : (
                      <Clock className="w-3 h-3 shrink-0 opacity-60" />
                    )}
                  </div>
                );
              })}
              {extra > 0 && (
                <span className="text-[10px] text-muted-foreground px-1">+{extra} more</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}