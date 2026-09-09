import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Check, MessageSquare, Loader2, AlertCircle, Film, ExternalLink } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/platforms";

function ytEmbed(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function Review() {
  const { token } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedback, setFeedback] = useState({});
  const [submitting, setSubmitting] = useState({});
  const [done, setDone] = useState({});

  async function load() {
    setLoading(true);
    setError("");
    try {
      const res = await base44.functions.invoke("getClientReview", { token });
      if (res.data?.error) {
        setError(res.data.error);
      } else {
        setData(res.data);
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not load review.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (token) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  async function submit(clipId, decision) {
    setSubmitting((s) => ({ ...s, [clipId]: true }));
    setError("");
    try {
      const res = await base44.functions.invoke("submitClipReview", {
        token,
        clipId,
        decision,
        comment: feedback[clipId] || "",
      });
      if (res.data?.ok) {
        setDone((d) => ({ ...d, [clipId]: decision }));
      } else {
        setError(res.data?.error || "Could not submit.");
      }
    } catch (e) {
      setError(e.response?.data?.error || e.message || "Could not submit.");
    } finally {
      setSubmitting((s) => ({ ...s, [clipId]: false }));
    }
  }

  return (
    <div className="min-h-screen w-full" style={{ background: "radial-gradient(1200px 600px at 50% -10%, rgba(10,132,255,0.10), transparent), #0a0a0b" }}>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: "rgba(10,132,255,0.16)" }}>
            <Film className="w-5 h-5" style={{ color: "#0A84FF" }} />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold tracking-tight text-white">Clip Review</h1>
            <p className="text-[13px] text-white/50">
              {data?.client ? `for ${data.client.name}` : "Review your clips and approve or request changes."}
            </p>
          </div>
        </div>

        {loading && (
          <div className="glass-card p-10 flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your review…
          </div>
        )}

        {!loading && error && (
          <div className="glass-card p-8 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#FF453A" }} />
            <p className="text-[15px] text-white">{error}</p>
          </div>
        )}

        {!loading && !error && data && data.clips.length === 0 && (
          <div className="glass-card p-8 text-center text-white/60 text-[15px]">
            No clips are waiting for your review right now. Check back soon.
          </div>
        )}

        {!loading && !error && data && data.clips.length > 0 && (
          <div className="space-y-5">
            {data.clips.map((c) => {
              const embed = ytEmbed(c.clipUrl);
              const isDone = done[c.id];
              const color = PLATFORM_COLOR[c.platform] || "#8E8E93";
              return (
                <div key={c.id} className="glass-card p-5">
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <h2 className="text-[16px] font-semibold text-white tracking-tight truncate">{c.title}</h2>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0"
                      style={{ background: `${color}26`, color }}
                    >
                      {PLATFORM_LABEL[c.platform] || c.platform}
                    </span>
                  </div>

                  {embed ? (
                    <div className="rounded-[12px] overflow-hidden mb-4" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                      <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                        <iframe
                          src={embed}
                          title={c.title}
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  ) : c.clipUrl ? (
                    <a
                      href={c.clipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[13px] text-white/80 underline mb-4"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open clip to watch
                    </a>
                  ) : (
                    <p className="text-[13px] text-white/40 mb-4">No video link attached.</p>
                  )}

                  {isDone ? (
                    <div
                      className="rounded-[12px] px-4 py-3 text-[14px] font-medium flex items-center gap-2"
                      style={{
                        background: isDone === "APPROVED" ? "rgba(48,209,88,0.16)" : "rgba(255,159,10,0.16)",
                        color: isDone === "APPROVED" ? "#30D158" : "#FF9F0A",
                      }}
                    >
                      {isDone === "APPROVED" ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                      {isDone === "APPROVED" ? "Approved — thank you!" : "Changes requested. The team will follow up."}
                    </div>
                  ) : (
                    <>
                      <label className="block text-[12px] font-medium text-white/50 mb-1">Feedback (optional for changes)</label>
                      <textarea
                        value={feedback[c.id] || ""}
                        onChange={(e) => setFeedback((f) => ({ ...f, [c.id]: e.target.value }))}
                        rows={3}
                        placeholder="Note any changes you'd like…"
                        className="w-full rounded-[10px] bg-white/5 px-3 py-2 text-[14px] text-white outline-none resize-none mb-3"
                        style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => submit(c.id, "APPROVED")}
                          disabled={submitting[c.id]}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[14px] font-medium disabled:opacity-50"
                          style={{ background: "#30D158", color: "#042b0f" }}
                        >
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button
                          onClick={() => submit(c.id, "CHANGES_REQUESTED")}
                          disabled={submitting[c.id]}
                          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[14px] font-medium bg-white/10 text-white hover:bg-white/15 disabled:opacity-50"
                          style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
                        >
                          <MessageSquare className="w-4 h-4" /> Request changes
                        </button>
                        {submitting[c.id] && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {error && !loading && (
          <p className="text-center text-[12px] text-white/30 mt-8">If this link doesn't work, ask your account manager for a new one.</p>
        )}
      </div>
    </div>
  );
}