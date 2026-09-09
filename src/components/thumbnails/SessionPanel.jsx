import React, { useState } from "react";
import { Plus, Search, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";

export default function SessionPanel({ sessions, activeSessionId, onSelect, onNew, search, setSearch, clientMap }) {
  const filtered = sessions.filter((s) =>
    (s.title || "New session").toLowerCase().includes((search || "").toLowerCase())
  );

  const groups = {};
  for (const s of filtered) {
    const key = s.client && clientMap[s.client] ? clientMap[s.client].name : "Unassigned";
    if (!groups[key]) groups[key] = [];
    groups[key].push(s);
  }

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
          <Plus className="w-4 h-4" /> New session
        </button>
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search sessions…"
            className="w-full h-8 rounded-[8px] pl-8 pr-2 text-[13px] bg-transparent outline-none placeholder:text-muted-foreground/60"
            style={{ border: "0.5px solid var(--border)", background: "rgba(255,255,255,0.04)" }}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-2 px-1">
        {Object.keys(groups).length === 0 ? (
          <p className="px-3 py-6 text-[13px] text-muted-foreground text-center">No sessions yet.</p>
        ) : (
          Object.entries(groups).map(([group, items]) => (
            <Group key={group} name={group} items={items} activeSessionId={activeSessionId} onSelect={onSelect} />
          ))
        )}
      </div>
    </aside>
  );
}

function Group({ name, items, activeSessionId, onSelect }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-1 px-3 py-1.5 text-[12px] font-medium uppercase tracking-wider text-muted-foreground hover:bg-white/5"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        {name} · {items.length}
      </button>
      {open &&
        items.map((s) => {
          const isActive = s.id === activeSessionId;
          return (
            <button
              key={s.id}
              onClick={() => onSelect(s.id)}
              className="w-full text-left px-3 py-2.5 rounded-[8px] transition-colors hover:bg-white/5"
              style={isActive ? { background: "rgba(255,255,255,0.06)" } : {}}
            >
              <div className="flex items-start gap-2">
                <MessageSquare className="w-3.5 h-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span className="text-[14px] font-medium truncate block">{s.title || "New session"}</span>
              </div>
            </button>
          );
        })}
    </div>
  );
}