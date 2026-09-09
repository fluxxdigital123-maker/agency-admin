import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured } from "@/lib/aiStatus";
import AiFeatureGuard from "@/components/AiFeatureGuard";
import ChatInput from "@/components/ideation/ChatInput";
import ChatMessage from "@/components/ideation/ChatMessage";
import ThreadList from "@/components/ideation/ThreadList";
import { Sparkles, PanelRightClose, PanelRightOpen, Plus } from "lucide-react";

export default function Ideation() {
  const configured = useAiConfigured();
  const [threads, setThreads] = useState([]);
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [tagClientId, setTagClientId] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [t, c] = await Promise.all([
        base44.entities.IdeationThread.list("-createdAt", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setThreads(t || []);
      setClients(c || []);
    })();
  }, []);

  useEffect(() => {
    if (!activeThreadId) {
      setMessages([]);
      return;
    }
    base44.entities.IdeationMessage.filter({ thread: activeThreadId }, "timestamp", 500).then(
      (m) => setMessages(m || [])
    );
  }, [activeThreadId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const clientMap = {};
  for (const c of clients) clientMap[c.id] = c;
  const activeThread = threads.find((t) => t.id === activeThreadId);

  async function send(text) {
    if (!configured) return;
    let threadId = activeThreadId;
    const clientId = tagClientId || activeThread?.client || undefined;

    if (!threadId) {
      const words = text.split(/\s+/);
      const title = words.slice(0, 7).join(" ") + (words.length > 7 ? "…" : "");
      const created = await base44.entities.IdeationThread.create({
        title,
        client: clientId || undefined,
        createdAt: new Date().toISOString(),
      });
      threadId = created.id;
      setThreads((prev) => [created, ...prev]);
      setActiveThreadId(threadId);
    }

    setMessages((prev) => [
      ...prev,
      { role: "user", content: text, thread: threadId, timestamp: new Date().toISOString() },
    ]);
    setLoading(true);
    try {
      const res = await base44.functions.invoke("ideateChat", {
        threadId,
        userMessage: text,
        clientId: clientId || undefined,
      });
      const data = res && res.data ? res.data : res;
      const responseText = data?.response || "Sorry, something went wrong.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: responseText, thread: threadId, timestamp: new Date().toISOString() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
          thread: threadId,
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
      base44.entities.IdeationThread.list("-createdAt", 200).then(setThreads);
    }
  }

  function newChat() {
    setActiveThreadId(null);
    setMessages([]);
    setTagClientId("");
  }

  return (
    <AiFeatureGuard ready={configured} title="Ideation" minHeight={420}>
      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        {/* Main chat column */}
        <main className="flex-1 flex flex-col min-w-0">
          <div
            className="flex items-center justify-between px-4 py-3 shrink-0"
            style={{ borderBottom: "0.5px solid var(--border)" }}
          >
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold tracking-tight truncate">
                {activeThread ? activeThread.title : "Ideation"}
              </h1>
              {activeThread?.client && clientMap[activeThread.client] && (
                <span className="text-[12px] text-muted-foreground">
                  {clientMap[activeThread.client].name}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={newChat}
                className="h-8 px-3 rounded-[8px] text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-white/5"
              >
                <Plus className="w-4 h-4" /> New
              </button>
              <button
                onClick={() => setPanelOpen((o) => !o)}
                className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-white/5"
              >
                {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {activeThreadId ? (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {messages.map((m, i) => (
                  <ChatMessage key={i} role={m.role} content={m.content} />
                ))}
                {loading && <ChatMessage role="assistant" content="" loading />}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.18), rgba(100,210,255,0.18))" }}
                >
                  <Sparkles className="w-5 h-5" style={{ color: "hsl(var(--accent-teal))" }} />
                </div>
                <h2 className="text-[26px] font-semibold tracking-tight">What should we ideate today?</h2>
                <p className="text-[15px] text-muted-foreground mt-2 max-w-md text-center">
                  Brainstorm titles, thumbnail concepts, hooks, and growth strategies. Tag a client for tailored context, or keep it global.
                </p>
                <div className="w-full max-w-md mt-6">
                  <label className="text-[12px] text-muted-foreground mb-1.5 block">
                    Tag a client (optional)
                  </label>
                  <select
                    value={tagClientId}
                    onChange={(e) => setTagClientId(e.target.value)}
                    className="w-full h-9 rounded-[8px] px-3 text-[13px] outline-none"
                    style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
                  >
                    <option value="">No client (global)</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          <ChatInput
            onSend={send}
            loading={loading}
            placeholder={activeThreadId ? "Message Ideation…" : "Start a new ideation thread…"}
          />
        </main>

        {/* Thread list (right) */}
        {panelOpen && (
          <ThreadList
            threads={threads}
            activeThreadId={activeThreadId}
            onSelect={setActiveThreadId}
            onNew={newChat}
            search={search}
            setSearch={setSearch}
            clientMap={clientMap}
          />
        )}
      </div>
    </AiFeatureGuard>
  );
}