import React from "react";
import { ShieldAlert } from "lucide-react";
import { RISK_COLOR, RISK_LABEL } from "@/lib/churnRisk";

export default function RiskPill({ risk, size = "sm" }) {
  if (!risk) return null;
  const hex = RISK_COLOR[risk.level] || "#86868b";
  const h = size === "sm" ? "h-5 text-[11px] px-2" : "h-6 text-[12px] px-2.5";
  return (
    <div className="relative group inline-flex shrink-0">
      <span
        className={`inline-flex items-center gap-1 rounded-full font-medium ${h}`}
        style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
      >
        <ShieldAlert className="w-3 h-3" />
        {RISK_LABEL[risk.level]} · {risk.score}
      </span>
      <div
        className="absolute z-50 top-full mt-1 left-0 w-56 rounded-[10px] p-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition pointer-events-none"
        style={{ background: "rgba(20,20,22,0.96)", border: "0.5px solid rgba(255,255,255,0.12)" }}
      >
        <div className="text-[12px] font-semibold mb-1" style={{ color: hex }}>
          {RISK_LABEL[risk.level]} churn risk · {risk.score}/100
        </div>
        <ul className="space-y-1">
          {risk.factors.map((f, i) => (
            <li key={i} className="text-[11px] text-white/70 leading-snug">• {f}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}