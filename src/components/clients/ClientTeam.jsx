import React from "react";
import { UsersRound } from "lucide-react";
import { fmtMoney } from "@/lib/format";

const ROLE_LABELS = {
  CHANNEL_MANAGER: "Channel Manager",
  SHORT_FORM_EDITOR: "Short-Form Editor",
  LONG_FORM_EDITOR: "Long-Form Editor",
  THUMBNAIL_DESIGNER: "Thumbnail Designer",
};

const ROLE_COLORS = {
  CHANNEL_MANAGER: "#0A84FF",
  SHORT_FORM_EDITOR: "#64D2FF",
  LONG_FORM_EDITOR: "#BF5AF2",
  THUMBNAIL_DESIGNER: "#FF9F0A",
};

export default function ClientTeam({ team }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <UsersRound className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[20px] font-semibold tracking-tight">Assigned Team</h2>
      </div>
      {team.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">No team members assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {team.map((m) => {
            const hex = ROLE_COLORS[m.role] || "#86868b";
            return (
              <div
                key={m.id}
                className="flex items-center justify-between rounded-[12px] px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-[13px] font-semibold"
                    style={{ background: `${hex}1A`, color: hex }}
                  >
                    {(m.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium truncate">{m.name}</div>
                    <span
                      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ background: `${hex}1A`, color: hex }}
                    >
                      {ROLE_LABELS[m.role] || m.role}
                    </span>
                  </div>
                </div>
                <div className="text-[14px] font-medium text-muted-foreground shrink-0 ml-3">
                  {fmtMoney(m.cost)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}