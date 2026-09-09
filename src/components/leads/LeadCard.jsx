import React from "react";
import { fmtMoney } from "@/lib/format";
import { ExternalLink, Pencil } from "lucide-react";

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
      </div>

      {lead.channelUrl && (
        <a
          href={lead.channelUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-[11px] text-primary mt-0.5 hover:opacity-70"
        >
          <ExternalLink className="w-3 h-3" /> channel
        </a>
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