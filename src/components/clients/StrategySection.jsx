import React, { useState } from "react";
import { Loader2, Target, ChevronDown, ChevronRight } from "lucide-react";
import AiFeatureGuard from "@/components/AiFeatureGuard";

function parseStrategy(json) {
  if (!json) return [];
  try {
    const v = JSON.parse(json);
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}

export default function StrategySection({ strategyJson, aiConfigured, refreshing }) {
  const items = parseStrategy(strategyJson);

  if (!aiConfigured) {
    return (
      <div>
        <SectionTitle />
        <AiFeatureGuard ready={false} title="Content Strategy" minHeight={180} />
      </div>
    );
  }

  if (refreshing) {
    return (
      <div className="glass-card p-6">
        <SectionTitle />
        <div className="text-[15px] text-muted-foreground flex items-center gap-2 mt-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Analyzing latest uploads…
        </div>
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="glass-card p-6">
        <SectionTitle />
        <p className="text-[15px] text-muted-foreground mt-2">
          No strategy recommendations yet. Click <span className="font-medium text-foreground">Refresh Analysis</span> to generate.
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <SectionTitle />
      <div className="mt-3 space-y-2">
        {items.map((it, i) => (
          <StrategyItem key={i} index={i} item={it} />
        ))}
      </div>
    </div>
  );
}

function SectionTitle() {
  return (
    <div className="flex items-center gap-2">
      <Target className="w-[18px] h-[18px]" style={{ color: "#BF5AF2" }} />
      <h2 className="text-[20px] font-semibold tracking-tight">Content Strategy</h2>
    </div>
  );
}

function StrategyItem({ index, item }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-[12px] overflow-hidden"
      style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-foreground/[0.03] transition-colors"
      >
        {open ? (
          <ChevronDown className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-muted-foreground" />
        )}
        <span className="text-[15px] font-medium leading-snug">
          <span className="text-muted-foreground mr-1.5">{index + 1}.</span>
          {item.change}
        </span>
      </button>
      {open && item.reasoning && (
        <div className="px-4 pb-4 pl-11">
          <p className="text-[14px] leading-relaxed text-muted-foreground">{item.reasoning}</p>
        </div>
      )}
    </div>
  );
}