import React from "react";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Circle,
  Clock,
  Settings2,
  PlugZap,
  Unplug,
} from "lucide-react";

function StatusBadge({ status }) {
  if (!status) return null;
  const { configured, error } = status;
  let color = "#86868b";
  let label = "Not configured";
  let Icon = Circle;
  if (configured) {
    color = "#30D158";
    label = "Connected";
    Icon = CheckCircle2;
  } else if (error) {
    color = "#FF453A";
    label = "Error";
    Icon = XCircle;
  }
  return (
    <span className="inline-flex items-center gap-1 text-[12px] font-medium" style={{ color }}>
      <Icon className="w-3.5 h-3.5" /> {label}
    </span>
  );
}

function timeAgo(iso) {
  if (!iso) return "Never tested";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return "Just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return d.toLocaleDateString();
}

export default function IntegrationCard({
  integration,
  status,
  onSetup,
  onTest,
  onDisconnect,
  testing,
}) {
  const Icon = integration.icon;
  return (
    <div className="glass-card p-5 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
          style={{ background: `${integration.color}22`, border: `0.5px solid ${integration.color}55` }}
        >
          <Icon className="w-5 h-5" style={{ color: integration.color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-[15px] font-semibold tracking-tight truncate">{integration.name}</h3>
            {integration.badge && (
              <span
                className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
                style={{ background: `${integration.color}22`, color: integration.color }}
              >
                {integration.badge}
              </span>
            )}
            {integration.optional && (
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-white/5 text-muted-foreground">
                Optional
              </span>
            )}
          </div>
          <div className="mt-0.5">
            <StatusBadge status={status} />
          </div>
        </div>
      </div>

      <p className="text-[13px] text-muted-foreground leading-relaxed mb-3 flex-1">
        {integration.description}
      </p>

      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mb-3">
        <Clock className="w-3 h-3" /> Last tested: {status ? timeAgo(status.lastTested) : "Never tested"}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onSetup(integration.id)}
          className="flex-1 h-8 rounded-[9px] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 hover:bg-white/5 transition-colors"
          style={{ border: "0.5px solid var(--border)" }}
        >
          <Settings2 className="w-3.5 h-3.5" /> Setup Guide
        </button>
        <button
          onClick={() => onTest(integration.id)}
          disabled={testing}
          className="flex-1 h-8 rounded-[9px] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40 transition-opacity"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {testing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlugZap className="w-3.5 h-3.5" />} Test
        </button>
        <button
          onClick={() => onDisconnect(integration.id)}
          disabled={!status?.configured}
          className="h-8 px-2.5 rounded-[9px] text-[13px] font-medium inline-flex items-center justify-center hover:bg-white/5 disabled:opacity-30 transition-colors"
          style={{ border: "0.5px solid var(--border)" }}
          title="Disconnect"
        >
          <Unplug className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}