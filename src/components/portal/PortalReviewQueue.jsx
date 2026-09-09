import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Check, MessageSquare, Loader2, ExternalLink, ClipboardCheck } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/platforms";

function ytEmbed(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

export default function PortalReviewQueue({ clips = [], onReviewed }) {
  const [feedback, setFeedback] = useState({});
  const [busy, setBusy] = useState({});
  const [done, setDone] = useState({});

  async function submit(clip, decision) {
    setBusy((s) => ({ ...s, [clip.id]: true }));
    try {
      const updated = await base44.entities.Clip.update(clip.id, {
        clientApproval: decision,
        clientFeedback: feedback[clip.id] || "",
      });
      setDone((d) => ({ ...d, [clip.id]: decision }));
      onReviewed?.(updated);
    } catch {
      /* ignore */
    } finally {
      setBusy((s) => ({ ...s, [clip.id]: false }));
    }
  }

  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <ClipboardCheck className="w-[18px] h-[18px] text-white/50" />
        <h2 className="text-[17px] font-semibold tracking-tight text-white">Review queue</h2>
        {clips.length > 0 && <span className="text-[12px] text-white/40">{clips.length} waiting</span>}
      </div>

      {clips.length === 0 ? (
        <p className="text-[14px] text-white/40 py-8 text-center">Nothing waiting for your approval right now.</p>
      ) : (
        <div className="space-y-4">
          {clips.map((c) => {
            const embed = ytEmbed(c.clipUrl);
            const color = PLATFORM_COLOR[c.platform] || "#8E8E93";
            const isDone = done[c.id];
            return (
              <div key={c.id} className="rounded-[12px] p-4" style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid rgba(255,255,255,0.08)" }}>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="text-[15px] font-semibold text-white tracking-tight truncate">{c.title}</h3>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold shrink-0" style={{ background: `${color}26`, color }}>
                    {PLATFORM_LABEL[c.platform] || c.platform}
                  </span>
                </div>

                {embed ? (
                  <div className="rounded-[10px] overflow-hidden mb-3" style={{ border: "0.5px solid rgba(255,255,255,0.1)" }}>
                    <div className="relative w-full" style={{ paddingTop: "56.25%" }}>
                      <iframe src={embed} title={c.title} className="absolute inset-0 w-full h-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                    </div>
                  </div>
                ) : c.clipUrl ? (
                  <a href={c.clipUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-[13px] text-white/80 underline mb-3">
                    <ExternalLink className="w-3.5 h-3.5" /> Open clip to watch
                  </a>
                ) : (
                  <p className="text-[13px] text-white/40 mb-3">No video link attached yet.</p>
                )}

                {isDone ? (
                  <div
                    className="rounded-[10px] px-3 py-2.5 text-[13px] font-medium flex items-center gap-2"
                    style={{ background: isDone === "APPROVED" ? "rgba(48,209,88,0.16)" : "rgba(255,159,10,0.16)", color: isDone === "APPROVED" ? "#30D158" : "#FF9F0A" }}
                  >
                    {isDone === "APPROVED" ? <Check className="w-4 h-4" /> : <MessageSquare className="w-4 h-4" />}
                    {isDone === "APPROVED" ? "Approved — thank you!" : "Changes requested. The team will follow up."}
                  </div>
                ) : (
                  <>
                    <label className="block text-[11px] font-medium text-white/50 mb-1">Feedback (optional for changes)</label>
                    <textarea
                      value={feedback[c.id] || ""}
                      onChange={(e) => setFeedback((f) => ({ ...f, [c.id]: e.target.value }))}
                      rows={2}
                      placeholder="Note any changes you'd like…"
                      className="w-full rounded-[10px] bg-white/5 px-3 py-2 text-[13px] text-white outline-none resize-none mb-3"
                      style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
                    />
                    <div className="flex items-center gap-2">
                      <button onClick={() => submit(c, "APPROVED")} disabled={busy[c.id]} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[13px] font-medium disabled:opacity-50" style={{ background: "#30D158", color: "#042b0f" }}>
                        <Check className="w-4 h-4" /> Approve
                      </button>
                      <button onClick={() => submit(c, "CHANGES_REQUESTED")} disabled={busy[c.id]} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[9px] text-[13px] font-medium bg-white/10 text-white hover:bg-white/15 disabled:opacity-50" style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}>
                        <MessageSquare className="w-4 h-4" /> Request changes
                      </button>
                      {busy[c.id] && <Loader2 className="w-4 h-4 animate-spin text-white/60" />}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}