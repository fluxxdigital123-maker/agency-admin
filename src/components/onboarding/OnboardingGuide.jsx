import React from "react";
import {
  Search,
  FileSignature,
  Users,
  Rocket,
  TrendingUp,
  Film,
  BarChart3,
} from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Discovery & Analysis",
    body: "Add the prospect as a Lead, then create a Client with their channel URL and run channel analysis to capture niche, style, offers, and growth opportunities.",
  },
  {
    icon: FileSignature,
    title: "Contract & Fees",
    body: "Set the setup fee, monthly recurring, and start date on the client. Download the agreement below, get it signed, and collect the setup payment.",
  },
  {
    icon: Users,
    title: "Team Assignment",
    body: "In the Team tab, assign a channel manager, short-form editor, long-form editor, and thumbnail designer. Watch the capacity tracker for overloaded roles.",
  },
  {
    icon: Rocket,
    title: "Kickoff & Goals",
    body: "Confirm the 30-day views guarantee objective appears on the Dashboard. Share Discord server access and the Google account email tied to the channel.",
  },
  {
    icon: Film,
    title: "Pipeline Setup",
    body: "Set the client's first production stage in the pipeline tracker (Waiting for Footage) so progress is visible across the agency.",
  },
  {
    icon: TrendingUp,
    title: "First Publish",
    body: "Produce the first batch of content, design scroll-stopping thumbnails in the Thumbnails tab, and publish. Mark the stage Published.",
  },
  {
    icon: BarChart3,
    title: "Analytics Baseline",
    body: "Pull the first analytics snapshot in the Analytics tab to establish the baseline the 30-day views guarantee is measured against.",
  },
];

export default function OnboardingGuide() {
  return (
    <div className="glass-card p-6">
      <h2 className="text-[20px] font-semibold tracking-tight mb-1">Onboarding a new client</h2>
      <p className="text-[14px] text-muted-foreground mb-5">
        A repeatable path from first contact to a published, measured first batch.
      </p>
      <ol className="space-y-3">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="flex gap-3 rounded-[12px] p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
            >
              <div className="flex flex-col items-center shrink-0">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(10,132,255,0.14)" }}
                >
                  <Icon className="w-4 h-4" style={{ color: "#0A84FF" }} />
                </div>
                <span className="text-[11px] font-mono text-muted-foreground mt-1">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <div className="min-w-0 pt-1">
                <h3 className="text-[15px] font-semibold tracking-tight">{s.title}</h3>
                <p className="text-[13px] text-muted-foreground mt-1 leading-relaxed">{s.body}</p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}