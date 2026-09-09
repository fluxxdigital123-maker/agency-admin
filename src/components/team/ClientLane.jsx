import React from "react";
import { fmtMoney } from "@/lib/format";

export const ROLE_LABELS = {
  CHANNEL_MANAGER: "Channel Manager",
  SHORT_FORM_EDITOR: "Short-Form Editor",
  LONG_FORM_EDITOR: "Long-Form Editor",
  THUMBNAIL_DESIGNER: "Thumbnail Designer",
};

export const ROLE_CAPACITY = {
  CHANNEL_MANAGER: 4,
  SHORT_FORM_EDITOR: 5,
  LONG_FORM_EDITOR: 4,
  THUMBNAIL_DESIGNER: 6,
};

export default function ClientLane({ client, members }) {
  const total = members.reduce((s, m) => s + (m.cost || 0), 0);
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[15px] font-semibold tracking-tight truncate">{client.name}</h3>
        <span className="text-[12px] text-muted-foreground shrink-0 ml-2">
          {members.length} {members.length === 1 ? "member" : "members"}
        </span>
      </div>
      <div className="space-y-2">
        {members.length === 0 ? (
          <p className="text-[13px] text-muted-foreground">No team assigned.</p>
        ) : (
          members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between rounded-[10px] px-3 py-2"
              style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
            >
              <div className="min-w-0">
                <div className="text-[13px] font-medium truncate">{m.name}</div>
                <div className="text-[11px] text-muted-foreground">{ROLE_LABELS[m.role] || m.role}</div>
              </div>
              <span className="text-[13px] tabular-nums shrink-0 ml-2">{fmtMoney(m.cost || 0)}</span>
            </div>
          ))
        )}
      </div>
      <div
        className="flex items-center justify-between mt-3 pt-3"
        style={{ borderTop: "0.5px solid var(--border)" }}
      >
        <span className="text-[12px] text-muted-foreground">Total cost</span>
        <span className="text-[14px] font-semibold tabular-nums">{fmtMoney(total)}</span>
      </div>
    </div>
  );
}