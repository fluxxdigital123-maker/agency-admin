import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "./ThemeContext";
import { base44 } from "@/api/base44Client";
import { Sun, Moon, Bell, CheckCheck, Trash2, Loader2 } from "lucide-react";
import { notifTypeMeta } from "@/lib/notifications";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function TopBar() {
  const { theme, toggle } = useTheme();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);

  async function load() {
    try {
      const rows = await base44.entities.Notification.list("-created_date", 30);
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (open) load();
  }, [open]);

  useEffect(() => {
    function onDoc(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const unread = items.filter((n) => !n.read).length;

  async function markRead(id) {
    try {
      await base44.entities.Notification.update(id, { read: true });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch { /* ignore */ }
  }

  async function openItem(n) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try { await base44.entities.Notification.update(n.id, { read: true }); } catch { /* ignore */ }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  }

  async function markAllRead() {
    setBusy(true);
    try {
      await base44.entities.Notification.updateMany({ read: false }, { $set: { read: true } });
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    } finally {
      setBusy(false);
    }
  }

  async function clearAll() {
    setBusy(true);
    try {
      await base44.entities.Notification.deleteMany({});
      setItems([]);
    } catch {
      load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <header className="glass-bar sticky top-0 z-30 h-12 flex items-center justify-end px-5 gap-1">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label="Notifications"
          className="relative w-9 h-9 rounded-[10px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
        >
          <Bell className="w-[18px] h-[18px]" />
          {unread > 0 && (
            <span
              className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center"
              style={{ background: "#FF453A", color: "#fff" }}
            >
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </button>

        {open && (
          <div
            className="absolute right-0 mt-2 w-[360px] max-w-[calc(100vw-2rem)] rounded-[16px] overflow-hidden glass-modal shadow-2xl"
            style={{ border: "0.5px solid var(--border)" }}
          >
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: "0.5px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-muted-foreground" />
                <span className="text-[14px] font-semibold tracking-tight">Notifications</span>
                {unread > 0 && <span className="text-[12px] text-muted-foreground">{unread} new</span>}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={markAllRead}
                  disabled={!unread || busy}
                  title="Mark all as read"
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 disabled:opacity-40"
                >
                  <CheckCheck className="w-4 h-4" />
                </button>
                <button
                  onClick={clearAll}
                  disabled={!items.length || busy}
                  title="Clear all"
                  className="w-7 h-7 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 disabled:opacity-40"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-y-auto">
              {loading ? (
                <div className="py-10 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : items.length === 0 ? (
                <div className="py-10 text-center text-[13px] text-muted-foreground">You're all caught up.</div>
              ) : (
                <div className="py-1">
                  {items.map((n) => {
                    const meta = notifTypeMeta(n.type || (n.kind === "CLIENT_APPROVAL" ? "CLIENT_APPROVAL" : null));
                    const Icon = meta.icon;
                    return (
                      <button
                        key={n.id}
                        onClick={() => openItem(n)}
                        className="w-full text-left flex items-start gap-2.5 px-3 py-2.5 hover:bg-foreground/5 transition-colors"
                        style={{ background: n.read ? "transparent" : "rgba(10,132,255,0.07)" }}
                      >
                        <div
                          className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                          style={{ background: `${meta.color}22` }}
                        >
                          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-[13px] leading-snug">{n.message || n.body || n.title}</div>
                          <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_date)}</div>
                        </div>
                        {!n.read && (
                          <span className="w-2 h-2 rounded-full mt-2 shrink-0" style={{ background: "#0A84FF" }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        onClick={toggle}
        aria-label="Toggle color theme"
        className="w-9 h-9 rounded-[10px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors duration-200"
      >
        {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
      </button>
    </header>
  );
}