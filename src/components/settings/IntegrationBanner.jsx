import React from "react";
import { Link } from "react-router-dom";
import { useIntegrationConfigured } from "@/lib/integrations";
import { AlertTriangle } from "lucide-react";

/**
 * Non-intrusive banner shown on a tab when its integration isn't configured.
 * Renders nothing while loading or when configured.
 */
export default function IntegrationBanner({ integrationId, message }) {
  const configured = useIntegrationConfigured(integrationId);
  if (configured === null || configured === true) return null;
  return (
    <div
      className="glass-card px-4 py-2.5 mb-4 flex items-center gap-2.5"
      style={{ borderColor: "rgba(255,159,10,0.3)" }}
    >
      <AlertTriangle className="w-4 h-4 shrink-0" style={{ color: "#FF9F0A" }} />
      <span className="text-[13px] text-muted-foreground flex-1">{message}</span>
      <Link to="/settings" className="text-[13px] font-medium text-primary hover:opacity-80 shrink-0">
        Set up →
      </Link>
    </div>
  );
}