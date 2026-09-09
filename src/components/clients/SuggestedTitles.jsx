import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured } from "@/lib/aiStatus";
import AiFeatureGuard from "@/components/AiFeatureGuard";
import CritiqueBox from "@/components/clients/CritiqueBox";
import { RefreshCw, Loader2, ListVideo, ExternalLink } from "lucide-react";

function parseJson(str) {
  try {
    return JSON.parse(str || "[]");
  } catch {
    return [];
  }
}

export default function SuggestedTitles({ client }) {
  const configured = useAiConfigured();
  const initial = useMemo(() => parseJson(client.suggestedTitles), [client.suggestedTitles]);
  const [videos, setVideos] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const updatedAt = client.suggestedTitlesAt;

  async function regenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateClientContent", { clientId: client.id, type: "TITLES" });
      const data = res && res.data ? res.data : res;
      setVideos(data?.items || []);
    } catch (e) {
      setError(e.message || "Failed to generate titles.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AiFeatureGuard ready={configured} title="Suggested Titles" minHeight={200}>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <ListVideo className="w-[18px] h-[18px] text-muted-foreground" />
            <h2 className="text-[20px] font-semibold tracking-tight">Suggested Titles</h2>
          </div>
          <button
            onClick={regenerate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium border hover:bg-foreground/5 transition-colors disabled:opacity-50"
            style={{ borderColor: "var(--border)" }}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Regenerate
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground mb-4">
          3 alternative titles for each of the last 5 long-form uploads (≥ 4 min).
          {updatedAt ? ` Last generated ${new Date(updatedAt).toLocaleDateString()}.` : ""}
        </p>

        {error && <p className="text-[13px] text-destructive mb-3">{error}</p>}

        {loading && videos.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[14px] text-muted-foreground">
              No titles generated yet. Click Regenerate to analyze this client&apos;s recent long-form uploads.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {videos.map((v, i) => (
              <div
                key={i}
                className="rounded-[12px] p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
              >
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[11px] font-mono text-muted-foreground shrink-0 mt-0.5">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium leading-snug">{v.originalTitle}</p>
                    {v.videoUrl && (
                      <a
                        href={v.videoUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[11px] text-primary mt-0.5"
                      >
                        <ExternalLink className="w-3 h-3" /> original
                      </a>
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5 pl-6">
                  {(v.alternatives || []).map((alt, j) => (
                    <li key={j} className="text-[13px] leading-snug flex gap-2">
                      <span className="text-muted-foreground">→</span>
                      <span>{alt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        <CritiqueBox clientId={client.id} scope="CLIENT_TITLES" label="Critique these titles" />
      </div>
    </AiFeatureGuard>
  );
}