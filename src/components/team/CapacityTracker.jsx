import React, { useMemo } from "react";
import { ROLE_LABELS, ROLE_CAPACITY } from "./ClientLane";
import { AlertTriangle, Users } from "lucide-react";

export default function CapacityTracker({ members }) {
  const people = useMemo(() => {
    const map = {};
    for (const m of members) {
      const key = m.name;
      (map[key] = map[key] || { name: m.name, roleCounts: {}, clients: new Set(), cost: 0 });
      map[key].roleCounts[m.role] = (map[key].roleCounts[m.role] || 0) + 1;
      map[key].clients.add(m.client);
      map[key].cost += m.cost || 0;
    }
    return Object.values(map).map((p) => ({
      name: p.name,
      clientCount: p.clients.size,
      cost: p.cost,
      roles: Object.entries(p.roleCounts).map(([role, count]) => {
        const cap = ROLE_CAPACITY[role] || 99;
        return { role, count, cap, overloaded: count > cap, atCap: count === cap };
      }),
    }));
  }, [members]);

  const overloadedPeople = people.filter((p) => p.roles.some((r) => r.overloaded || r.atCap));

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <Users className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[17px] font-semibold tracking-tight">Capacity Tracker</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Flagged when an editor or manager reaches or exceeds their client load.
      </p>

      {people.length === 0 ? (
        <p className="text-[14px] text-muted-foreground">No team members assigned yet.</p>
      ) : (
        <div className="space-y-2">
          {people.map((p) => {
            const flagged = p.roles.some((r) => r.overloaded);
            const atCap = p.roles.some((r) => r.atCap);
            const color = flagged ? "#FF453A" : atCap ? "#FF9F0A" : "#86868b";
            return (
              <div
                key={p.name}
                className="rounded-[12px] px-4 py-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {(flagged || atCap) && <AlertTriangle className="w-4 h-4 shrink-0" style={{ color }} />}
                    <span className="text-[14px] font-medium truncate">{p.name}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground shrink-0">{p.clientCount} client{p.clientCount === 1 ? "" : "s"}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {p.roles.map((r) => (
                    <span
                      key={r.role}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium"
                      style={{
                        background: r.overloaded
                          ? "rgba(255,69,58,0.16)"
                          : r.atCap
                          ? "rgba(255,159,10,0.16)"
                          : "rgba(255,255,255,0.05)",
                        color: r.overloaded ? "#FF453A" : r.atCap ? "#FF9F0A" : "hsl(var(--foreground))",
                        border: `0.5px solid ${r.overloaded ? "rgba(255,69,58,0.35)" : r.atCap ? "rgba(255,159,10,0.35)" : "var(--border)"}`,
                      }}
                    >
                      {ROLE_LABELS[r.role] || r.role} · {r.count}/{r.cap}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}