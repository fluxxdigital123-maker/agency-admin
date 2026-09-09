import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  INTEGRATIONS,
  loadSettingsMap,
  parseStatus,
  saveCredentials,
  setClaudeEnabled,
  testIntegrationConnection,
  upsertSetting,
  writeStatus,
} from "@/lib/integrations";
import IntegrationCard from "./IntegrationCard";
import SetupGuide from "./SetupGuide";
import WelcomeModal from "./WelcomeModal";
import { Loader2 } from "lucide-react";

export default function IntegrationsPanel() {
  const [map, setMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [guideId, setGuideId] = useState(null);
  const [testing, setTesting] = useState(null);
  const [welcome, setWelcome] = useState(false);

  async function refresh() {
    const m = await loadSettingsMap();
    setMap(m);
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!loading && map["onboarding_completed"] !== "true") setWelcome(true);
  }, [loading, map]);

  async function onTest(id) {
    setTesting(id);
    try {
      await testIntegrationConnection(id);
      await refresh();
    } finally {
      setTesting(null);
    }
  }

  async function onDisconnect(id) {
    const integration = INTEGRATIONS.find((i) => i.id === id);
    if (!window.confirm(`Disconnect ${integration.name}? You can reconnect anytime.`)) return;
    if (id === "claude") {
      await setClaudeEnabled(false);
    } else {
      await saveCredentials(
        integration,
        Object.fromEntries(integration.credentialKeys.map((f) => [f.id, ""]))
      );
    }
    await writeStatus(integration.statusKey, { configured: false, lastTested: null, error: null });
    await refresh();
  }

  async function skipWelcome() {
    await upsertSetting("onboarding_completed", "true");
    setWelcome(false);
    await refresh();
  }

  async function getStarted() {
    await upsertSetting("onboarding_completed", "true");
    setWelcome(false);
    setGuideId("claude");
    await refresh();
  }

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {INTEGRATIONS.map((it) => (
          <IntegrationCard
            key={it.id}
            integration={it}
            status={parseStatus(it, map)}
            onSetup={setGuideId}
            onTest={onTest}
            onDisconnect={onDisconnect}
            testing={testing === it.id}
          />
        ))}
      </div>

      <SetupGuide
        integrationId={guideId}
        open={!!guideId}
        onClose={() => setGuideId(null)}
        onTested={refresh}
      />

      {welcome && <WelcomeModal onGetStarted={getStarted} onSkip={skipWelcome} />}
    </>
  );
}