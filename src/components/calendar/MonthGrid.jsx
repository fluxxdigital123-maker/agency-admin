import React from "react";
import { fmtMoney } from "@/lib/format";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function MonthGrid({ year, month, paymentsByDate, clientMap, onToggle }) {
  const startDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const today = new Date();
  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  return (
    <div className="glass-card p-4">
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
            return <div key={i} className="min-h-[80px] rounded-[10px]" style={{ background: "rgba(255,255,255,0.015)" }} />;
          }
          const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
          const dayPays = paymentsByDate[dateStr] || [];
          return (
            <div
              key={i}
              className="min-h-[80px] rounded-[10px] p-1.5 flex flex-col gap-1"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: isToday(d) ? "0.5px solid hsl(var(--primary))" : "0.5px solid var(--border)",
              }}
            >
              <span className="text-[11px] font-medium text-muted-foreground">{d}</span>
              {dayPays.map((p) => {
                const name = (clientMap[p.client] || {}).name || "—";
                const paid = p.status === "PAID";
                return (
                  <button
                    key={p.id}
                    onClick={() => onToggle(p)}
                    title={paid ? "Collected — click to undo" : "Click to mark collected"}
                    className="text-left rounded-[6px] px-1.5 py-1 text-[11px] leading-tight transition-colors w-full"
                    style={
                      paid
                        ? { background: "rgba(48,209,88,0.2)", color: "#30D158", border: "0.5px solid rgba(48,209,88,0.45)" }
                        : { background: "rgba(255,255,255,0.05)", color: "hsl(var(--foreground))", border: "0.5px solid var(--border)" }
                    }
                  >
                    <span className="font-medium truncate block">{name}</span>
                    <span className="opacity-80">{fmtMoney(p.amount)}</span>
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}