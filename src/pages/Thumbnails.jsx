import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { useAiConfigured } from "@/lib/aiStatus";
import AiFeatureGuard from "@/components/AiFeatureGuard";
import ChatInput from "@/components/ideation/ChatInput";
import ChatMessage from "@/components/ideation/ChatMessage";
import ImageBubble from "@/components/thumbnails/ImageBubble";
import SessionPanel from "@/components/thumbnails/SessionPanel";
import TextOverlayEditor from "@/components/thumbnails/TextOverlayEditor";
import IntegrationBanner from "@/components/settings/IntegrationBanner";
import { Sparkles, PanelRightClose, PanelRightOpen, Plus } from "lucide-react";

const now = () => new Date().toISOString();
const titleFrom = (t) => {
  const w = t.split(/\s+/);
  return w.slice(0, 7).join(" ") + (w.length > 7 ? "…" : "");
};

export default function Thumbnails() {
  const configured = useAiConfigured();
  const [sessions, setSessions] = useState([]);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [clients, setClients] = useState([]);
  const [panelOpen, setPanelOpen] = useState(true);
  const [search, setSearch] = useState("");
  const [tagClientId, setTagClientId] = useState("");
  const [busy, setBusy] = useState({});
  const [overlay, setOverlay] = useState(null); // { imageUrl }
  const scrollRef = useRef(null);

  useEffect(() => {
    (async () => {
      const [s, c] = await Promise.all([
        base44.entities.ThumbnailSession.list("-createdAt", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setSessions(s || []);
      setClients(c || []);
    })();
  }, []);

  useEffect(() => {
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    base44.entities.ThumbnailMessage.filter({ session: activeSessionId }, "timestamp", 500).then(
      (m) => setMessages(m || [])
    );
  }, [activeSessionId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const clientMap = {};
  for (const c of clients) clientMap[c.id] = c;
  const activeSession = sessions.find((s) => s.id === activeSessionId);

  async function send(text) {
    if (!configured) return;
    let sessionId = activeSessionId;
    const clientId = tagClientId || activeSession?.client || undefined;

    if (!sessionId) {
      const s = await base44.entities.ThumbnailSession.create({
        title: titleFrom(text),
        client: clientId || undefined,
        createdAt: now(),
      });
      sessionId = s.id;
      setSessions((prev) => [s, ...prev]);
      setActiveSessionId(sessionId);
    }

    const userMsg = await base44.entities.ThumbnailMessage.create({
      session: sessionId, role: "user", kind: "TEXT", content: text, timestamp: now(),
    });
    const textId = `t-${Date.now()}`;
    const imgId = `i-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: textId, role: "assistant", kind: "TEXT", content: "", _loading: true, session: sessionId },
      { id: imgId, role: "assistant", kind: "IMAGE", content: text, variations: [], _shimmer: true, session: sessionId },
    ]);

    // 1. Chat: creative direction + optimized nano-banana-pro image prompt
    let chatData;
    try {
      const res = await base44.functions.invoke("thumbnailChat", { sessionId, userMessage: text, clientId: clientId || undefined });
      chatData = res && res.data ? res.data : res;
    } catch {
      chatData = { response: "Sorry, something went wrong." };
    }
    const direction = chatData?.response || "Sorry, something went wrong.";
    const imagePrompt = chatData?.imagePrompt || text;
    const textSaved = await base44.entities.ThumbnailMessage.create({
      session: sessionId, role: "assistant", kind: "TEXT", content: direction, timestamp: now(),
    });
    setMessages((prev) => prev.map((m) => (m.id === textId ? textSaved : m)));

    // 2. Image generation using the AI-optimized prompt
    let imgData;
    try {
      const res = await base44.functions.invoke("generateThumbnailImage", { prompt: imagePrompt, sessionId, clientId: clientId || undefined });
      imgData = res && res.data ? res.data : res;
    } catch {
      imgData = { configured: false };
    }
    if (imgData && imgData.configured && imgData.imageUrl) {
      const saved = await base44.entities.ThumbnailMessage.create({
        session: sessionId, role: "assistant", kind: "IMAGE", content: imagePrompt,
        imageUrl: imgData.imageUrl, variations: [imgData.imageUrl], timestamp: now(),
      });
      setMessages((prev) => prev.map((m) => (m.id === imgId ? saved : m)));
    } else {
      const saved = await base44.entities.ThumbnailMessage.create({
        session: sessionId, role: "assistant", kind: "IMAGE", content: imagePrompt,
        variations: [], timestamp: now(),
      });
      setMessages((prev) => prev.map((m) => (m.id === imgId ? saved : m)));
    }

    base44.entities.ThumbnailSession.list("-createdAt", 200).then(setSessions);
  }

  async function regenerate(msg, index) {
    setBusy((b) => ({ ...b, [msg.id]: true }));
    try {
      const res = await base44.functions.invoke("generateThumbnailImage", {
        prompt: msg.content, sessionId: activeSessionId, clientId: activeSession?.client || undefined,
      });
      const data = res && res.data ? res.data : res;
      if (data && data.configured && data.imageUrl) {
        const variations = [...(msg.variations || [msg.imageUrl])];
        variations[Math.min(index, variations.length - 1)] = data.imageUrl;
        const updated = await base44.entities.ThumbnailMessage.update(msg.id, {
          variations, imageUrl: variations[0],
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...updated } : m)));
      }
    } finally {
      setBusy((b) => ({ ...b, [msg.id]: false }));
    }
  }

  async function tryVariations(msg) {
    setBusy((b) => ({ ...b, [msg.id]: true }));
    try {
      const calls = await Promise.all(
        [0, 1, 2].map(() =>
          base44.functions.invoke("generateThumbnailImage", {
            prompt: msg.content, sessionId: activeSessionId, clientId: activeSession?.client || undefined,
          }).then((r) => (r && r.data ? r.data : r))
        )
      );
      const urls = calls.filter((d) => d && d.configured && d.imageUrl).map((d) => d.imageUrl);
      if (urls.length) {
        const updated = await base44.entities.ThumbnailMessage.update(msg.id, {
          variations: urls, imageUrl: urls[0],
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...updated } : m)));
      }
    } finally {
      setBusy((b) => ({ ...b, [msg.id]: false }));
    }
  }

  async function rate(msg, n) {
    const updated = await base44.entities.ThumbnailMessage.update(msg.id, { rating: n });
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, ...updated } : m)));
  }

  function openTextOverlay(msg, index) {
    const variations = msg.variations && msg.variations.length ? msg.variations : msg.imageUrl ? [msg.imageUrl] : [];
    const url = variations[Math.min(index, variations.length - 1)];
    setOverlay({ imageUrl: url });
  }

  function newSession() {
    setActiveSessionId(null);
    setMessages([]);
    setTagClientId("");
  }

  return (
    <AiFeatureGuard ready={configured} title="Thumbnails" minHeight={420}>
      <IntegrationBanner
        integrationId="higgsfield"
        message="Connect Higgsfield to generate thumbnail images."
      />
      <div className="flex h-[calc(100vh-7.5rem)] overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0">
          {/* header with client selector pill (top-right) */}
          <div className="flex items-center justify-between px-4 py-3 shrink-0 gap-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
            <div className="min-w-0">
              <h1 className="text-[17px] font-semibold tracking-tight truncate">
                {activeSession ? activeSession.title : "Thumbnails"}
              </h1>
              {activeSession?.client && clientMap[activeSession.client] && (
                <span className="text-[12px] text-muted-foreground">{clientMap[activeSession.client].name}</span>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <select
                value={tagClientId}
                onChange={(e) => setTagClientId(e.target.value)}
                className="h-8 rounded-full px-3 text-[12px] font-medium outline-none"
                style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
              >
                <option value="">No client</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button onClick={newSession} className="h-8 px-3 rounded-[8px] text-[13px] font-medium inline-flex items-center gap-1.5 hover:bg-white/5">
                <Plus className="w-4 h-4" /> New
              </button>
              <button onClick={() => setPanelOpen((o) => !o)} className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-white/5">
                {panelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto">
            {activeSessionId ? (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
                {messages.map((m) => {
                  if (m._loading) return <ChatMessage key={m.id || m.content} role="assistant" content="" loading />;
                  if (m._shimmer || m.kind === "IMAGE") {
                    return (
                      <ImageBubble
                        key={m.id}
                        message={m}
                        shimmer={m._shimmer}
                        busy={busy[m.id]}
                        onRegenerate={regenerate}
                        onVariations={tryVariations}
                        onRate={rate}
                        onTextOverlay={openTextOverlay}
                      />
                    );
                  }
                  return <ChatMessage key={m.id} role={m.role} content={m.content} />;
                })}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center px-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-5"
                  style={{ background: "linear-gradient(135deg, rgba(191,90,242,0.18), rgba(10,132,255,0.18))" }}>
                  <Sparkles className="w-5 h-5" style={{ color: "hsl(var(--accent-purple))" }} />
                </div>
                <h2 className="text-[26px] font-semibold tracking-tight">Design scroll-stopping thumbnails</h2>
                <p className="text-[15px] text-muted-foreground mt-2 max-w-md text-center">
                  Describe a thumbnail or paste a video topic. Get a creative direction and a generated 16:9 thumbnail you can rate, refine, and overlay text on.
                </p>
              </div>
            )}
          </div>

          <ChatInput onSend={send} loading={false} placeholder="Describe a thumbnail or paste a video topic..." />
        </main>

        {panelOpen && (
          <SessionPanel
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onNew={newSession}
            search={search}
            setSearch={setSearch}
            clientMap={clientMap}
          />
        )}

        {overlay && <TextOverlayEditor imageUrl={overlay.imageUrl} onClose={() => setOverlay(null)} />}
      </div>
    </AiFeatureGuard>
  );
}