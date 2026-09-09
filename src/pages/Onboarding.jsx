import React from "react";
import OnboardingGuide from "@/components/onboarding/OnboardingGuide";
import AgreementDownload from "@/components/onboarding/AgreementDownload";

export default function Onboarding() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Onboarding</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          Guide new clients from kickoff through setup, team assignment, and first publish.
        </p>
      </div>

      <OnboardingGuide />
      <AgreementDownload />
    </div>
  );
}