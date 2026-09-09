import React, { useState } from "react";
import { CheckCircle2, Circle, AlertTriangle } from "lucide-react";

const DAY_MS = 86400000;

export default function DailyObjectives({ activeClients }) {
  const [done, setDone] = useState({});
  const today = new Date();

  const items = activeClients
    .filter((c) => c.startDate)
    .map((c) => {
      const start = new Date(c.startDate);
      const days = Math.floor((today - start) / DAY_MS) + 1;
      return { client: c, days };
    })
    .filter((it) => it.days <= 30 && it.days >= 1);

  function toggle(id) {
    setDone((d) => ({ ...d, [id]: !d[id] }));
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <CheckCircle2 className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
        <h2 className="text-[20px] font-semibold tracking-tight">Daily Objectives</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Agency rule: full refund if a client doesn&apos;t see a views increase in their first 30 days.
        Track each client&apos;s countdown and flag anyone approaching it.
      </p>

      {items.length === 0 ? (
        <p className="text-[14px] text-muted-foreground py-2">
          No active clients within their first 30 days right now.
        </p>
      ) : (
        <ul className="space-y-2">
          {items.map(({ client, days }) => {
            const approaching = days >= 25;
            const color = approaching ? "#FF9F0A" : "#30D158";
            const isDone = !!done[client.id];
            return (
              <li key={client.id}>
                <button
                  onClick={() => toggle(client.id)}
                  className="w-full flex items-center gap-3 rounded-[12px] px-4 py-3 text-left transition-colors hover:bg-white/[0.03]"
                  style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
                >
                  {isDone ? (
                    <CheckCircle2 className="w-5 h-5 shrink-0" style={{ color: "#30D158" }} />
                  ) : (
                    <Circle className="w-5 h-5 shrink-0 text-muted-foreground" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[14px] font-medium truncate"
                      style={isDone ? { opacity: 0.5, textDecoration: "line-through" } : undefined}
                    >
                      {client.name}
                    </div>
                    <div className="text-[12px] text-muted-foreground">
                      Ensure a views increase — day {days}/30
                    </div>
                  </div>
                  {approaching && !isDone && (
                    <AlertTriangle className="w-4 h-4 shrink-0" style={{ color }} />
                  )}
                  <span className="text-[12px] font-semibold tabular-nums shrink-0" style={{ color }}>
                    {days}/30
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}