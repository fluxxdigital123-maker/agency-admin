import React, { useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured } from "@/lib/aiStatus";
import AiFeatureGuard from "@/components/AiFeatureGuard";
import CritiqueBox from "@/components/clients/CritiqueBox";
import { RefreshCw, Loader2, Lightbulb } from "lucide-react";

function parseJson(str) {
  try {
    return JSON.parse(str || "[]");
  } catch {
    return [];
  }
}

export default function SuggestedIdeas({ client }) {
  const configured = useAiConfigured();
  const initial = useMemo(() => parseJson(client.suggestedIdeas), [client.suggestedIdeas]);
  const [ideas, setIdeas] = useState(initial);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const updatedAt = client.suggestedIdeasAt;

  async function regenerate() {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateClientContent", { clientId: client.id, type: "IDEAS" });
      const data = res && res.data ? res.data : res;
      setIdeas(data?.items || []);
    } catch (e) {
      setError(e.message || "Failed to generate ideas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AiFeatureGuard ready={configured} title="Suggested Ideas" minHeight={200}>
      <div className="glass-card p-6">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="w-[18px] h-[18px] text-muted-foreground" />
            <h2 className="text-[20px] font-semibold tracking-tight">Suggested Ideas</h2>
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
          Fresh long-form video ideas tailored to this client.
          {updatedAt ? ` Last generated ${new Date(updatedAt).toLocaleDateString()}.` : ""}
        </p>

        {error && <p className="text-[13px] text-destructive mb-3">{error}</p>}

        {loading && ideas.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : ideas.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[14px] text-muted-foreground">
              No ideas generated yet. Click Regenerate to brainstorm fresh long-form ideas for this client.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map((idea, i) => (
              <div
                key={i}
                className="rounded-[12px] p-3"
                style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
              >
                <p className="text-[14px] font-medium leading-snug">{idea.title}</p>
                {idea.angle && (
                  <p className="text-[13px] text-muted-foreground mt-1">
                    <span className="font-medium text-foreground/70">Angle:</span> {idea.angle}
                  </p>
                )}
                {idea.hook && (
                  <p className="text-[13px] text-muted-foreground mt-0.5">
                    <span className="font-medium text-foreground/70">Hook:</span> {idea.hook}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <CritiqueBox clientId={client.id} scope="CLIENT_IDEAS" label="Critique these ideas" />
      </div>
    </AiFeatureGuard>
  );
}