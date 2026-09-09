import React from "react";
import { STAGE_MAP, STAGE_COLOR_HEX } from "@/lib/clientStages";

export default function StagePill({ stage, size }) {
  const s = STAGE_MAP[stage] || STAGE_MAP.WAITING_FOR_FOOTAGE;
  const hex = STAGE_COLOR_HEX[s.color] || STAGE_COLOR_HEX.muted;
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-[12px]";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium whitespace-nowrap ${pad}`}
      style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
      {s.label}
    </span>
  );
}