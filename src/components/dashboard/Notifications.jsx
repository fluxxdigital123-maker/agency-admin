import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Bell, Check, MessageSquare, X } from "lucide-react";

function timeAgo(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Notifications() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const rows = await base44.entities.Notification.list("-created_date", 20);
      setItems(rows || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function markRead(id) {
    try {
      await base44.entities.Notification.update(id, { read: true });
      setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    } catch {
      /* ignore */
    }
  }

  if (loading || items.length === 0) return null;

  const unread = items.filter((n) => !n.read).length;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bell className="w-[18px] h-[18px] text-muted-foreground" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full" style={{ background: "#FF453A" }} />
            )}
          </div>
          <h2 className="text-[16px] font-semibold tracking-tight">Notifications</h2>
          {unread > 0 && (
            <span className="text-[12px] text-muted-foreground">{unread} new</span>
          )}
        </div>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 6).map((n) => (
          <div
            key={n.id}
            className="flex items-start gap-2 rounded-[10px] px-3 py-2"
            style={{
              background: n.read ? "transparent" : "rgba(10,132,255,0.08)",
              border: n.read ? "0.5px solid transparent" : "0.5px solid rgba(10,132,255,0.2)",
            }}
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: n.kind === "CLIENT_APPROVAL" ? "rgba(48,209,88,0.16)" : "rgba(120,120,128,0.16)" }}>
              {n.kind === "CLIENT_APPROVAL" ? (
                <Check className="w-3.5 h-3.5" style={{ color: "#30D158" }} />
              ) : (
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[13px] font-medium leading-snug">{n.title}</div>
              {n.body && <div className="text-[12px] text-muted-foreground leading-snug line-clamp-2">{n.body}</div>}
              <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_date)}</div>
            </div>
            {!n.read && (
              <button
                onClick={() => markRead(n.id)}
                className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-foreground/5 text-muted-foreground shrink-0"
                title="Mark as read"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}