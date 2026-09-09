import React from "react";
import { STAGES, STAGE_COLOR_HEX, stageIndex } from "@/lib/clientStages";
import { Check } from "lucide-react";

export default function PipelineTracker({ currentStage, onSetStage }) {
  const idx = stageIndex(currentStage);

  return (
    <div className="glass-card p-6">
      <h2 className="text-[20px] font-semibold tracking-tight mb-5">Production Pipeline</h2>
      <div className="flex items-start overflow-x-auto pb-2 -mx-1 px-1">
        {STAGES.map((s, i) => {
          const hex = STAGE_COLOR_HEX[s.color];
          const done = i < idx;
          const current = i === idx;
          return (
            <React.Fragment key={s.key}>
              <button
                onClick={() => onSetStage && onSetStage(s.key)}
                disabled={!onSetStage}
                className="flex flex-col items-center gap-2 shrink-0 w-24 group disabled:cursor-default"
              >
                <span
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-semibold transition-all"
                  style={
                    done || current
                      ? { background: hex, color: "#000", boxShadow: current ? `0 0 0 4px ${hex}33` : "none" }
                      : { background: "rgba(255,255,255,0.06)", color: "hsl(var(--muted-foreground))", border: "0.5px solid var(--border)" }
                  }
                >
                  {done ? <Check className="w-4 h-4" /> : i + 1}
                </span>
                <span
                  className="text-[11px] font-medium text-center leading-tight"
                  style={current ? { color: hex } : done ? { color: "hsl(var(--foreground))" } : { color: "hsl(var(--muted-foreground))" }}
                >
                  {s.label}
                </span>
              </button>
              {i < STAGES.length - 1 && (
                <div
                  className="flex-1 h-[2px] mt-[15px] min-w-[8px] rounded-full"
                  style={{ background: i < idx ? hex : "var(--border)" }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <p className="text-[13px] text-muted-foreground mt-3">
        {onSetStage ? "Click a stage to update progress." : "Current stage shown above."}
      </p>
    </div>
  );
}