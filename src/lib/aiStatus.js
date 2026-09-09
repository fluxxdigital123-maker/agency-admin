import { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Graceful AI degradation.
 *
 * InvokeLLM is a built-in integration that is always available, so AI is
 * considered "configured" by default. An AppSetting `ai_configured` can
 * override this (e.g. from a future Settings screen) — when set to "false"
 * every AI feature renders its degraded placeholder instead of attempting
 * a call.
 *
 * Every AI feature should read `configured` from this hook and wrap its
 * call in try/catch; on any failure it renders <AiFeatureGuard> with the
 * "connect your API key" placeholder.
 */
export function useAiConfigured() {
  const [configured, setConfigured] = useState(true);

  useEffect(() => {
    let done = false;
    base44.entities.AppSetting.list()
      .then((rows) => {
        if (done) return;
        const flag = (rows || []).find((r) => r.key === "ai_configured");
        if (flag) setConfigured(flag.value !== "false");
      })
      .catch(() => setConfigured(true));
    return () => {
      done = true;
    };
  }, []);

  return configured;
}

/**
 * Run the channel analysis backend function. Returns the structured AI
 * payload or throws — callers handle the degraded state.
 */
export async function analyzeChannel(channelUrl) {
  const res = await base44.functions.invoke("analyzeChannel", { channelUrl });
  // SDK may return an Axios-like wrapper { data } or the data directly.
  if (res && typeof res === "object" && "data" in res && res.data) return res.data;
  return res;
}