import React from "react";
import { INTEGRATIONS } from "@/lib/integrations";
import { Rocket, X } from "lucide-react";

export default function WelcomeModal({ onGetStarted, onSkip }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}
    >
      <div className="glass-modal w-full max-w-lg p-8 relative">
        <button
          onClick={onSkip}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.2), rgba(100,210,255,0.2))" }}
        >
          <Rocket className="w-6 h-6" style={{ color: "#0A84FF" }} />
        </div>
        <h1 className="text-[26px] font-semibold tracking-tight">Welcome to Agency Admin</h1>
        <p className="text-[15px] text-muted-foreground mt-2 mb-6">
          Connect your integrations to unlock AI analysis, thumbnail generation, analytics, and automatic
          production tracking. Recommended order:
        </p>
        <ol className="space-y-2 mb-6">
          {INTEGRATIONS.map((it, i) => {
            const Icon = it.icon;
            return (
              <li key={it.id} className="flex items-center gap-3 glass-card p-3">
                <span
                  className="w-6 h-6 rounded-full text-[12px] font-semibold flex items-center justify-center shrink-0"
                  style={{ background: `${it.color}22`, color: it.color }}
                >
                  {i + 1}
                </span>
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: `${it.color}1a` }}
                >
                  <Icon className="w-4 h-4" style={{ color: it.color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[14px] font-medium">
                    {it.name}{" "}
                    {it.badge && <span className="text-[11px] text-muted-foreground">· {it.badge}</span>}
                  </div>
                  <div className="text-[12px] text-muted-foreground">
                    ~{it.estMinutes} min{it.optional ? " · optional" : ""}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="flex items-center justify-between">
          <button
            onClick={onSkip}
            className="text-[13px] font-medium text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </button>
          <button
            onClick={onGetStarted}
            className="h-10 px-5 rounded-[10px] text-[14px] font-medium"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            Get Started
          </button>
        </div>
      </div>
    </div>
  );
}