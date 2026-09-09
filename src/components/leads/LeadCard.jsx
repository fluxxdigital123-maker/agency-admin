import React from "react";
import { fmtMoney } from "@/lib/format";
import { ExternalLink, Pencil, CalendarClock } from "lucide-react";
import { computeLeadScore, scoreTone } from "@/lib/leadScore";

export const STATUS_LABELS = {
  TO_CONTACT: "To Contact",
  CONTACTED: "Contacted",
  IN_TALKS: "In Talks",
  CLOSED: "Closed",
  LOST: "Lost",
};

export const STATUS_ORDER = ["TO_CONTACT", "CONTACTED", "IN_TALKS", "CLOSED", "LOST"];

export const STATUS_HEX = {
  TO_CONTACT: "#86868b",
  CONTACTED: "#0A84FF",
  IN_TALKS: "#FF9F0A",
  CLOSED: "#30D158",
  LOST: "#FF453A",
};

export default function LeadCard({ lead, onMove, onEdit }) {
  const hex = STATUS_HEX[lead.status] || "#86868b";
  const score = computeLeadScore(lead);
  const tone = scoreTone(score);
  const todayStr = new Date().toISOString().slice(0, 10);
  const followUpDue = lead.nextFollowUp && lead.status !== "CLOSED" && lead.status !== "LOST" && lead.nextFollowUp <= todayStr;
  return (
    <div
      className="rounded-[12px] p-3"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
    >
      <div className="flex items-start justify-between gap-2">
        <button onClick={() => onEdit(lead)} className="text-left min-w-0 flex-1 group">
          <div className="text-[14px] font-medium truncate group-hover:opacity-80 flex items-center gap-1">
            {lead.name}
            <Pencil className="w-3 h-3 opacity-0 group-hover:opacity-60" />
          </div>
        </button>
        <span
          className="shrink-0 inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded-full text-[11px] font-semibold tabular-nums"
          style={{ background: `${tone}22`, color: tone }}
          title="Lead score"
        >
          {score}
        </span>
      </div>

      <div className="flex items-center gap-2 mt-0.5">
        {lead.channelUrl && (
          <a
            href={lead.channelUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-primary hover:opacity-70"
          >
            <ExternalLink className="w-3 h-3" /> channel
          </a>
        )}
        {lead.niche && (
          <span className="text-[11px] text-muted-foreground truncate">{lead.niche}</span>
        )}
      </div>

      {followUpDue && (
        <div className="mt-1.5 inline-flex items-center gap-1 text-[11px]" style={{ color: "#FF9F0A" }}>
          <CalendarClock className="w-3 h-3" />
          {lead.nextFollowUp < todayStr ? "Overdue follow-up" : "Follow-up due"}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Upfront</div>
          <div className="text-[13px] font-medium tabular-nums">{fmtMoney(lead.upfrontCash || 0)}</div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Monthly</div>
          <div className="text-[13px] font-medium tabular-nums">{fmtMoney(lead.monthlyRecurring || 0)}</div>
        </div>
      </div>

      {(lead.subscribers || lead.avgViews) && (
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Subs</div>
            <div className="text-[12px] font-medium tabular-nums">{lead.subscribers ? Intl.NumberFormat("en", { notation: "compact" }).format(lead.subscribers) : "—"}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Avg views</div>
            <div className="text-[12px] font-medium tabular-nums">{lead.avgViews ? Intl.NumberFormat("en", { notation: "compact" }).format(lead.avgViews) : "—"}</div>
          </div>
        </div>
      )}

      {lead.notes && <p className="text-[12px] text-muted-foreground mt-2 line-clamp-2">{lead.notes}</p>}

      <select
        value={lead.status}
        onChange={(e) => onMove(lead.id, e.target.value)}
        className="mt-3 w-full h-8 rounded-[8px] px-2 text-[12px] font-medium outline-none appearance-none"
        style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)", color: hex }}
      >
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>
    </div>
  );
}