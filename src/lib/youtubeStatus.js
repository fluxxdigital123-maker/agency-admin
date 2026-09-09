import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

/**
 * Whether a YouTube Data API v3 key has been saved in Settings.
 * Reads only the boolean flag — the key itself is never read client-side.
 */
export function useYoutubeConfigured() {
  const [configured, setConfigured] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let done = false;
    base44.entities.AppSetting.list()
      .then((rows) => {
        if (done) return;
        const flag = (rows || []).find((r) => r.key === "youtube_key_configured");
        setConfigured(!!(flag && flag.value === "true"));
      })
      .catch(() => setConfigured(false))
      .finally(() => {
        if (!done) setLoaded(true);
      });
    return () => {
      done = true;
    };
  }, []);

  return { configured, loaded };
}