import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured } from "@/lib/aiStatus";
import AiFeatureGuard from "@/components/AiFeatureGuard";
import { Sparkles, Loader2, Check, Copy, RefreshCw } from "lucide-react";

const PLATFORMS = ["YOUTUBE_SHORTS", "TIKTOK", "INSTAGRAM_REELS", "X", "LINKEDIN"];
const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YouTube Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

export default function HooksCaptionsAssistant({ clip }) {
  const aiConfigured = useAiConfigured();
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [data, setData] = useState(null); // { hooks: [], captions: {} }
  const [used, setUsed] = useState({}); // key -> true
  const [copied, setCopied] = useState("");

  async function generate() {
    setLoading(true);
    setErr("");
    try {
      const res = await base44.functions.invoke("generateHooksCaptions", { clipId: clip.id });
      const d = res && res.data ? res.data : res;
      setData(d);
      setUsed({});
    } catch (e) {
      setErr(e.message || "Generation failed.");
    } finally {
      setLoading(false);
    }
  }

  async function markUsed(kind, platform, text) {
    const key = kind + (platform ? ":" + platform : "") + ":" + text;
    if (used[key]) return;
    try {
      await base44.entities.KnowledgeEntry.create({
        scope: "CLIENT_IDEAS",
        client: clip.client,
        userInput: text,
        learnedPrinciple:
          kind === "hook"
            ? "User marked this hook as used — preferred hook style."
            : `User marked this ${platform} caption as used — preferred caption tone.`,
        timestamp: new Date().toISOString(),
      });
      setUsed((p) => ({ ...p, [key]: true }));
    } catch {
      /* ignore */
    }
  }

  function copy(text, key) {
    navigator.clipboard?.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(""), 1400);
  }

  return (
    <AiFeatureGuard ready={aiConfigured} title="Hooks & Captions" minHeight={160}>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between gap-3 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
            <h3 className="text-[17px] font-semibold tracking-tight">Hooks & Captions</h3>
          </div>
          <button
            onClick={generate}
            disabled={loading}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {data ? "Regenerate" : "Generate"}
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground mb-4">
          AI writes 5 hook lines and 3 caption variants per platform, grounded in the source video. Mark the ones you use — the assistant learns your style.
        </p>

        {err && (
          <p className="text-[13px] mb-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>
        )}

        {loading && !data && (
          <div className="py-10 text-center text-[14px] text-muted-foreground flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Writing hooks & captions…
          </div>
        )}

        {data && (
          <div className="space-y-5">
            {/* Hooks */}
            <div>
              <h4 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Hooks</h4>
              <div className="space-y-2">
                {(data.hooks || []).map((h, i) => {
                  const key = "hook::" + h;
                  const isUsed = !!used[key];
                  return (
                    <div key={i} className="flex items-start gap-2 rounded-[10px] p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
                      <span className="text-[12px] text-muted-foreground mt-0.5 w-4 shrink-0">{i + 1}.</span>
                      <p className="text-[14px] flex-1 leading-snug">{h}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <IconBtn onClick={() => copy(h, key)} active={copied === key} title="Copy" />
                        <button
                          onClick={() => markUsed("hook", null, h)}
                          className={`inline-flex items-center gap-1 h-7 px-2 rounded-[8px] text-[12px] font-medium transition-colors ${isUsed ? "" : "hover:bg-foreground/5"}`}
                          style={isUsed ? { background: "rgba(48,209,88,0.16)", color: "#30D158" } : { color: "hsl(var(--muted-foreground))" }}
                        >
                          <Check className="w-3.5 h-3.5" /> {isUsed ? "Used" : "Mark used"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Captions per platform */}
            <div>
              <h4 className="text-[13px] font-semibold uppercase tracking-wide text-muted-foreground mb-2">Captions</h4>
              <div className="space-y-3">
                {PLATFORMS.map((p) => {
                  const list = data.captions?.[p] || [];
                  if (!list.length) return null;
                  return (
                    <div key={p}>
                      <div className="text-[12px] font-medium mb-1.5" style={{ color: "#0A84FF" }}>{PLATFORM_LABEL[p]}</div>
                      <div className="space-y-2">
                        {list.map((c, i) => {
                          const key = "caption:" + p + ":" + c;
                          const isUsed = !!used[key];
                          return (
                            <div key={i} className="flex items-start gap-2 rounded-[10px] p-2.5" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}>
                              <p className="text-[14px] flex-1 leading-snug whitespace-pre-wrap">{c}</p>
                              <div className="flex items-center gap-1 shrink-0">
                                <IconBtn onClick={() => copy(c, key)} active={copied === key} title="Copy" />
                                <button
                                  onClick={() => markUsed("caption", p, c)}
                                  className={`inline-flex items-center gap-1 h-7 px-2 rounded-[8px] text-[12px] font-medium transition-colors ${isUsed ? "" : "hover:bg-foreground/5"}`}
                                  style={isUsed ? { background: "rgba(48,209,88,0.16)", color: "#30D158" } : { color: "hsl(var(--muted-foreground))" }}
                                >
                                  <Check className="w-3.5 h-3.5" /> {isUsed ? "Used" : "Mark used"}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </AiFeatureGuard>
  );
}

function IconBtn({ onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-7 h-7 rounded-[8px] flex items-center justify-center hover:bg-foreground/5 transition-colors"
      style={active ? { color: "#30D158" } : { color: "hsl(var(--muted-foreground))" }}
    >
      {active ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
    </button>
  );
}