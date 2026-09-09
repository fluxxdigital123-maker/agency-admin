import React from "react";
import {
  RefreshCw, Loader2, ExternalLink, Sparkles, Tag, TrendingUp,
} from "lucide-react";
import { PLAN_LABELS } from "@/lib/clientStages";
import { fmtMoney, fmtDate } from "@/lib/format";
import AiFeatureGuard from "@/components/AiFeatureGuard";

export default function ClientOverview({ client, aiConfigured, refreshing, onRefresh, refreshError }) {
  const growth = (client.growthOpportunities || "")
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  const hasAnalysis = !!(client.channelSummary || client.contentStyle || client.offers || growth.length);

  return (
    <div className="glass-card p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div
            className="w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-[20px] font-semibold"
            style={{
              background: client.channelThumbnail ? "transparent" : "rgba(255,255,255,0.06)",
              backgroundImage: client.channelThumbnail ? `url(${client.channelThumbnail})` : undefined,
              backgroundSize: "cover",
              backgroundPosition: "center",
              border: "0.5px solid var(--border)",
            }}
          >
            {!client.channelThumbnail && (client.name || "?").charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-[22px] font-semibold tracking-tight truncate">{client.name}</h2>
              <StatusBadge status={client.status} />
            </div>
            {client.channelUrl && (
              <a
                href={client.channelUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[13px] text-primary hover:opacity-80 mt-0.5"
              >
                {client.channelUrl}
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
        <button
          onClick={onRefresh}
          disabled={!aiConfigured || refreshing}
          title={!aiConfigured ? "AI not connected" : "Re-analyze using latest uploads"}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-medium border transition-colors hover:bg-foreground/5 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          style={{ borderColor: "var(--border)" }}
        >
          {refreshing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh Analysis
        </button>
      </div>

      {/* Stat strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
        <Stat label="Plan" value={client.planType === "CUSTOM" && client.customPlanLabel ? client.customPlanLabel : PLAN_LABELS[client.planType] || "—"} />
        <Stat label="Setup fee" value={fmtMoney(client.setupFee)} />
        <Stat label="Monthly fee" value={fmtMoney(client.monthlyFee)} />
        <Stat label="Start date" value={fmtDate(client.startDate)} />
      </div>

      {/* AI analysis */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4" style={{ color: "#0A84FF" }} />
          <h3 className="text-[17px] font-semibold tracking-tight">Channel Analysis</h3>
        </div>

        {!aiConfigured ? (
          <AiFeatureGuard ready={false} title="Channel Analysis" minHeight={180} />
        ) : refreshing ? (
          <div className="rounded-[12px] p-5 text-[15px] text-muted-foreground flex items-center gap-2" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
            <Loader2 className="w-4 h-4 animate-spin" /> Analyzing latest uploads…
          </div>
        ) : !hasAnalysis ? (
          <div className="rounded-[12px] p-5 text-[15px] text-muted-foreground" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
            No analysis yet. Click <span className="font-medium text-foreground">Refresh Analysis</span> to generate.
          </div>
        ) : (
          <div className="space-y-4">
            {client.channelSummary && (
              <Field label="Summary">{client.channelSummary}</Field>
            )}
            {client.contentStyle && (
              <Field label="Content style" icon={Tag}>{client.contentStyle}</Field>
            )}
            {client.offers && (
              <Field label="Offers">{client.offers}</Field>
            )}
            {growth.length > 0 && (
              <div>
                <div className="text-[13px] font-medium text-muted-foreground mb-1.5 flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" /> Growth opportunities
                </div>
                <ul className="space-y-1">
                  {growth.map((g, i) => (
                    <li key={i} className="text-[15px] flex gap-2">
                      <span className="text-muted-foreground">•</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {refreshError && (
          <p className="mt-3 text-[13px]" style={{ color: "#FF453A" }}>{refreshError}</p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-[12px] p-3" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
      <div className="text-[12px] text-muted-foreground">{label}</div>
      <div className="text-[15px] font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}

function Field({ label, icon, children }) {
  return (
    <div>
      <div className="text-[13px] font-medium text-muted-foreground mb-1 flex items-center gap-1.5">
        {icon && React.createElement(icon, { className: "w-3.5 h-3.5" })}
        {label}
      </div>
      <p className="text-[15px] leading-relaxed">{children}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const active = status !== "CHURNED";
  const hex = active ? "#30D158" : "#86868b";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium"
      style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
      {active ? "Active" : "Churned"}
    </span>
  );
}