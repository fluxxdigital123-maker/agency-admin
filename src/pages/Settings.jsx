import React from "react";
import IntegrationsPanel from "@/components/settings/IntegrationsPanel";
import TeamAccess from "@/components/settings/TeamAccess";
import SuperAdminSettings from "@/components/settings/SuperAdminSettings";
import AiTraining from "@/components/settings/AiTraining";
import WeeklyDigestCard from "@/components/settings/WeeklyDigestCard";
import RolesPanel from "@/components/settings/RolesPanel";

export default function Settings() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Settings</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Connect integrations, manage your team, and train the AI.
        </p>
      </div>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-1">Integrations</h2>
        <p className="text-[14px] text-muted-foreground mb-3">
          Connect the services that power analysis, thumbnails, analytics, and production tracking.
        </p>
        <IntegrationsPanel />
      </section>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-3">Team</h2>
        <TeamAccess />
      </section>

      <section>
        <SuperAdminSettings />
      </section>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-1">Weekly Digest</h2>
        <p className="text-[14px] text-muted-foreground mb-3">
          A Monday-morning email summary of your agency's week — views, output, pipeline, and what needs attention.
        </p>
        <WeeklyDigestCard />
      </section>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-1">Roles & Permissions</h2>
        <p className="text-[14px] text-muted-foreground mb-3">
          Assign Owner, Manager, or Editor roles to your team. Editors only see the Views tab and their
          assigned clients' clips; Managers see everything except Money and Settings.
        </p>
        <RolesPanel />
      </section>

      <section>
        <h2 className="text-[18px] font-semibold tracking-tight mb-1">AI Training</h2>
        <p className="text-[14px] text-muted-foreground mb-3">
          Teach the AI your agency's principles. Trained knowledge is injected into every Ideation and
          Thumbnail session.
        </p>
        <AiTraining />
      </section>
    </div>
  );
}