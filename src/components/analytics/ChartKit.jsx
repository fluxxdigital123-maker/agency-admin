import React from "react";

export const AXIS = "#86868b";
export const GRID = "rgba(128,128,128,0.15)";
export const TOOLTIP_STYLE = {
  background: "rgba(20,20,22,0.92)",
  border: "0.5px solid rgba(255,255,255,0.1)",
  borderRadius: 12,
  color: "#f5f5f7",
  fontSize: 13,
};

export function ChartCard({ icon: Icon, color, title, children, emptyLabel, hasData }) {
  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-[18px] h-[18px]" style={{ color }} />
        <h2 className="text-[17px] font-semibold tracking-tight">{title}</h2>
      </div>
      {hasData ? (
        <div style={{ height: 240 }}>{children}</div>
      ) : (
        <div
          className="flex items-center justify-center text-[14px] text-muted-foreground text-center px-4"
          style={{ height: 240 }}
        >
          {emptyLabel}
        </div>
      )}
    </div>
  );
}

export const yCompact = (v) =>
  v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`;