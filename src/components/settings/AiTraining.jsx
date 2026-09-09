import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import ReactMarkdown from "react-markdown";
import { Sparkles, BookOpen, Trash2, Loader2, Send, Eye } from "lucide-react";
import ChatMessage from "@/components/ideation/ChatMessage";

const SCOPES = [
  { key: "THUMBNAIL_GLOBAL", label: "Thumbnail Training", desc: "Train the AI on thumbnail design principles, styles, and CTR rules." },
  { key: "VIDEO_GLOBAL", label: "Video & Ideation Training", desc: "Train the AI on titles, hooks, content strategy, and growth." },
];

export default function AiTraining() {
  const [scope, setScope] = useState("THUMBNAIL_GLOBAL");
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [summary, setSummary] = useState({ open: false, loading: false, text: "", count: 0 });
  const [resetOpen, setResetOpen] = useState(false);
  const scrollRef = useRef(null);
  const taRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    base44.entities.KnowledgeEntry.filter({ scope }, "-timestamp", 500)
      .then((e) => setEntries(e || []))
      .finally(() => setLoading(false));
  }, [scope]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [entries, sending]);

  useEffect(() => {
    const el = taRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 400) + "px";
  }, [input]);

  async function send() {
    const v = input.trim();
    if (!v || sending) return;
    setSending(true);
    setInput("");
    try {
      const res = await base44.functions.invoke("trainKnowledge", { scope, userInput: v });
      const data = res && res.data ? res.data : res;
      const learned = data?.learnedPrinciple || "Principle recorded.";
      setEntries((prev) => [
        ...prev,
        { id: data?.id || `e-${Date.now()}`, scope, userInput: v, learnedPrinciple: learned, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setEntries((prev) => [
        ...prev,
        { id: `err-${Date.now()}`, scope, userInput: v, learnedPrinciple: "Sorry, something went wrong while recording.", timestamp: new Date().toISOString() },
      ]);
    } finally {
      setSending(false);
    }
  }

  async function viewKnowledge() {
    setSummary({ open: true, loading: true, text: "", count: 0 });
    try {
      const res = await base44.functions.invoke("summarizeKnowledge", { scope });
      const data = res && res.data ? res.data : res;
      setSummary({ open: true, loading: false, text: data?.summary || "No summary available.", count: data?.count || 0 });
    } catch {
      setSummary({ open: true, loading: false, text: "Failed to load summary.", count: 0 });
    }
  }

  async function resetKnowledge() {
    try {
      await base44.entities.KnowledgeEntry.deleteMany({ scope });
      setEntries([]);
    } catch {
      /* ignore */
    }
    setResetOpen(false);
  }

  const active = SCOPES.find((s) => s.key === scope);

  return (
    <div className="glass-card overflow-hidden">
      {/* tabs */}
      <div className="flex items-center gap-1 p-2" style={{ borderBottom: "0.5px solid var(--border)" }}>
        {SCOPES.map((s) => (
          <button
            key={s.key}
            onClick={() => setScope(s.key)}
            className="px-4 py-2 rounded-[10px] text-[14px] font-medium transition-colors"
            style={s.key === scope ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" } : { color: "var(--muted-foreground)" }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* action bar */}
      <div className="flex items-center justify-between px-4 py-3 gap-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <p className="text-[13px] text-muted-foreground min-w-0 truncate">{active.desc}</p>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={viewKnowledge} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium hover:bg-white/10" style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}>
            <Eye className="w-3.5 h-3.5" /> View current knowledge
          </button>
          <button onClick={() => setResetOpen(true)} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium" style={{ border: "0.5px solid rgba(255,69,58,0.3)", background: "rgba(255,69,58,0.08)", color: "#FF453A" }}>
            <Trash2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>

      {/* chat */}
      <div ref={scrollRef} className="h-[460px] overflow-y-auto px-4 py-5 space-y-4">
        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3" style={{ background: "rgba(191,90,242,0.12)" }}>
              <Sparkles className="w-5 h-5" style={{ color: "hsl(var(--accent-purple))" }} />
            </div>
            <p className="text-[15px] font-medium">No training yet</p>
            <p className="text-[13px] text-muted-foreground mt-1 max-w-xs">Paste examples, principles, or guidelines below. The AI will confirm and restate the extracted principle.</p>
          </div>
        ) : (
          entries.map((e) => (
            <div key={e.id || e.timestamp} className="space-y-3">
              <ChatMessage role="user" content={e.userInput} />
              <ChatMessage role="assistant" content={e.learnedPrinciple} />
            </div>
          ))
        )}
        {sending && <ChatMessage role="assistant" content="" loading />}
      </div>

      {/* input — large, auto-expanding for big pastes */}
      <div className="p-3" style={{ borderTop: "0.5px solid var(--border)" }}>
        <div className="rounded-[16px] p-2" style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.10)" }}>
          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); send(); } }}
            placeholder="Paste examples, principles, or guidelines… (Ctrl/Cmd+Enter to train)"
            rows={4}
            className="w-full bg-transparent resize-none outline-none px-2 py-1.5 text-[14px] leading-relaxed placeholder:text-muted-foreground/60"
            style={{ maxHeight: 400 }}
          />
          <div className="flex items-center justify-between px-1 pt-1">
            <span className="text-[11px] text-muted-foreground/60">{input.length.toLocaleString()} chars</span>
            <button onClick={send} disabled={!input.trim() || sending} className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium transition-opacity disabled:opacity-40" style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}>
              {sending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />} Train
            </button>
          </div>
        </div>
      </div>

      {/* summary modal */}
      {summary.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setSummary((s) => ({ ...s, open: false }))}>
          <div className="glass-modal w-full max-w-2xl p-5 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[16px] font-semibold flex items-center gap-2"><BookOpen className="w-4 h-4" /> Current knowledge — {active.label}</h3>
              <button onClick={() => setSummary((s) => ({ ...s, open: false }))} className="text-[13px] text-muted-foreground hover:opacity-70">Close</button>
            </div>
            <div className="overflow-y-auto flex-1">
              {summary.loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin" /></div>
              ) : summary.count === 0 ? (
                <p className="text-[14px] text-muted-foreground">No knowledge entries yet for this scope.</p>
              ) : (
                <>
                  <p className="text-[12px] text-muted-foreground mb-3">{summary.count} entries</p>
                  <div className="chat-md"><ReactMarkdown>{summary.text}</ReactMarkdown></div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* reset confirmation */}
      {resetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)" }} onClick={() => setResetOpen(false)}>
          <div className="glass-modal w-full max-w-sm p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="w-5 h-5" style={{ color: "#FF453A" }} />
              <h3 className="text-[16px] font-semibold">Reset {active.label}?</h3>
            </div>
            <p className="text-[14px] text-muted-foreground mb-4">This permanently deletes all {entries.length} knowledge entr{entries.length === 1 ? "y" : "ies"} for this scope. The AI will no longer apply them.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setResetOpen(false)} className="h-9 px-4 rounded-[8px] text-[13px] font-medium hover:bg-white/10">Cancel</button>
              <button onClick={resetKnowledge} className="h-9 px-4 rounded-[8px] text-[13px] font-medium" style={{ background: "#FF453A", color: "#fff" }}>Delete all</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}