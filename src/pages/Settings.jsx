import React from "react";
import AiTraining from "@/components/settings/AiTraining";

export default function Settings() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Train the AI, manage integrations, and configure app-wide preferences.
        </p>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-1">AI Training</h2>
        <p className="text-[14px] text-muted-foreground mb-3">
          Teach the AI your agency's principles. Trained knowledge is injected into every Ideation and Thumbnail session.
        </p>
        <AiTraining />
      </section>
    </div>
  );
}