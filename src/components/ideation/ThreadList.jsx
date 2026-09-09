import React from "react";
import { Plus, Search, MessageSquare } from "lucide-react";

export default function ThreadList({ threads, activeThreadId, onSelect, onNew, search, setSearch, clientMap }) {
  const filtered = threads.filter((t) =>
    (t.title || "New thread").toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <aside
      className="w-[280px] shrink-0 flex flex-col"
      style={{ borderLeft: "0.5px solid var(--border)", background: "rgba(255,255,255,0.02)" }}
    >
      <div className="p-3 shrink-0" style={{ borderBottom: "0.5px solid var(--border)" }}>
        <button
          onClick={onNew}
          className="w-full h-9 rounded-[10px] text-[14px] font-medium inline-flex items-center justify-center gap-1.5 mb-3 transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          <Plus className="w-4 h-4" /> New thread
        </button>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search threads…"
            className="w-full h-8 rounded-[8px] pl-8 pr-2 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/60"
            style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-1">
        {filtered.length === 0 ? (
          <p className="px-3 py-6 text-[13px] text-muted-foreground text-center">No threads yet.</p>
        ) : (
          filtered.map((t) => {
            const isActive = t.id === activeThreadId;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="w-full text-left px-3 py-2.5 rounded-[8px] transition-colors hover:bg-white/5"
                style={isActive ? { background: "rgba(255,255,255,0.06)" } : {}}
              >
                <div className="flex items-start gap-2">
                  <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="min-w-0">
                    <div className="text-[14px] font-medium truncate">{t.title || "New thread"}</div>
                    {t.client && clientMap[t.client] && (
                      <div className="text-[11px] text-muted-foreground truncate">
                        {clientMap[t.client].name}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}