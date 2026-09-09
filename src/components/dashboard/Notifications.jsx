import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Bell, X } from "lucide-react";
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

export default function Notifications() {
  const navigate = useNavigate();
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

  useEffect(() => { load(); }, []);

  async function openItem(n) {
    if (!n.read) {
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try { await base44.entities.Notification.update(n.id, { read: true }); } catch { /* ignore */ }
    }
    if (n.link) navigate(n.link);
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
          {unread > 0 && <span className="text-[12px] text-muted-foreground">{unread} new</span>}
        </div>
      </div>
      <div className="space-y-1.5">
        {items.slice(0, 6).map((n) => {
          const meta = notifTypeMeta(n.type || (n.kind === "CLIENT_APPROVAL" ? "CLIENT_APPROVAL" : null));
          const Icon = meta.icon;
          return (
            <div
              key={n.id}
              className="flex items-start gap-2 rounded-[10px] px-3 py-2 cursor-pointer"
              onClick={() => openItem(n)}
              style={{
                background: n.read ? "transparent" : `${meta.color}14`,
                border: n.read ? "0.5px solid transparent" : `0.5px solid ${meta.color}33`,
              }}
            >
              <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ background: `${meta.color}22` }}>
                <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium leading-snug">{n.message || n.title}</div>
                <div className="text-[11px] text-muted-foreground mt-0.5">{timeAgo(n.created_date)}</div>
              </div>
              {!n.read && (
                <button
                  onClick={(e) => { e.stopPropagation(); openItem(n); }}
                  className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-foreground/5 text-muted-foreground shrink-0"
                  title="Mark as read"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}