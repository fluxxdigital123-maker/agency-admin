import React, { useState, useEffect, useMemo } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { base44 } from "@/api/base44Client";
import { Clock, AlertCircle, Loader2 } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/viewPlatforms";

const COLUMNS = ["QUEUED", "EDITING", "REVIEW", "APPROVED", "POSTED"];
const COL_COLOR = {
  QUEUED: "#98989F",
  EDITING: "#0A84FF",
  REVIEW: "#FF9F0A",
  APPROVED: "#BF5AF2",
  POSTED: "#30D158",
};

function colTimestamp(clip) {
  return clip.statusChangedAt ? new Date(clip.statusChangedAt) : new Date(clip.created_date);
}

function ageInColumn(clip) {
  const ms = Date.now() - colTimestamp(clip).getTime();
  const hrs = ms / 3600000;
  if (hrs < 1) return `${Math.max(1, Math.round(ms / 60000))}m`;
  if (hrs < 24) return `${Math.round(hrs)}h`;
  return `${Math.round(hrs / 24)}d`;
}

function reviewStale(clip) {
  if (clip.status !== "REVIEW") return false;
  return Date.now() - colTimestamp(clip).getTime() > 48 * 3600000;
}

export default function ClipPipeline({ clients, allowedClientIds }) {
  const [clips, setClips] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [cl, tm] = await Promise.all([
        base44.entities.Clip.list("-created_date", 1000),
        base44.entities.TeamMember.list("-created_date", 500),
      ]);
      setClips(cl || []);
      setTeam(tm || []);
    } catch {
      setClips([]); setTeam([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const clientMap = useMemo(() => { const m = {}; for (const c of clients || []) m[c.id] = c; return m; }, [clients]);
  const editorMap = useMemo(() => { const m = {}; for (const t of team) m[t.id] = t; return m; }, [team]);

  const visibleClips = useMemo(() => {
    if (!allowedClientIds) return clips;
    return clips.filter((c) => allowedClientIds.includes(c.client));
  }, [clips, allowedClientIds]);

  const byStatus = useMemo(() => {
    const m = {};
    for (const s of COLUMNS) m[s] = [];
    for (const c of visibleClips) { if (m[c.status]) m[c.status].push(c); }
    return m;
  }, [visibleClips]);

  async function onDragEnd(res) {
    if (!res.destination || res.destination.droppableId === res.source.droppableId) return;
    const newStatus = res.destination.droppableId;
    const clipId = res.draggableId;
    const nowIso = new Date().toISOString();
    setClips((prev) => prev.map((c) => (c.id === clipId ? { ...c, status: newStatus, statusChangedAt: nowIso } : c)));
    try {
      await base44.entities.Clip.update(clipId, { status: newStatus, statusChangedAt: nowIso });
    } catch {
      load();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const staleCount = visibleClips.filter(reviewStale).length;

  return (
    <div className="space-y-4">
      {staleCount > 0 && (
        <div
          className="flex items-center gap-2 rounded-[12px] px-4 py-3 text-[13px]"
          style={{ background: "rgba(255,69,58,0.10)", color: "#FF453A", border: "0.5px solid rgba(255,69,58,0.3)" }}
        >
          <AlertCircle className="w-4 h-4 shrink-0" />
          {staleCount} clip{staleCount > 1 ? "s" : ""} in REVIEW longer than 48 hours.
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: 420 }}>
          {COLUMNS.map((status) => {
            const items = byStatus[status];
            const color = COL_COLOR[status];
            return (
              <div key={status} className="shrink-0 w-[280px]">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                    <span className="text-[13px] font-semibold">{status}</span>
                  </div>
                  <span className="text-[12px] text-muted-foreground tabular-nums">{items.length}</span>
                </div>
                <Droppable droppableId={status}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-2 min-h-[140px] rounded-[14px] p-2 transition-colors"
                      style={{
                        background: snapshot.isDraggingOver ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
                        border: "0.5px solid var(--border)",
                      }}
                    >
                      {items.map((clip, index) => {
                        const client = clientMap[clip.client];
                        const stale = reviewStale(clip);
                        const editor = clip.editor ? (editorMap[clip.editor]?.name || "Unassigned") : "Unassigned";
                        return (
                          <Draggable key={clip.id} draggableId={clip.id} index={index}>
                            {(p) => (
                              <div
                                ref={p.innerRef}
                                {...p.draggableProps}
                                {...p.dragHandleProps}
                                style={p.draggableProps.style}
                                className="rounded-[12px] p-1.5 cursor-grab active:cursor-grabbing"
                              >
                                <div
                                  className="rounded-[10px] p-3"
                                  style={{
                                    background: "rgba(255,255,255,0.04)",
                                    border: stale ? "0.5px solid rgba(255,69,58,0.55)" : "0.5px solid var(--border)",
                                  }}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0" style={{ background: "rgba(128,128,128,0.2)" }}>
                                      {client?.channelThumbnail ? (
                                        <img src={client.channelThumbnail} className="w-full h-full object-cover" alt="" />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-[12px] font-semibold text-muted-foreground">
                                          {(client?.name || "?").slice(0, 1)}
                                        </div>
                                      )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="text-[13px] font-medium leading-snug truncate">{clip.title}</div>
                                      <div className="text-[11px] text-muted-foreground truncate">{client?.name || "—"}</div>
                                    </div>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-2.5">
                                    <span
                                      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold"
                                      style={{ background: `${PLATFORM_COLOR[clip.platform]}22`, color: PLATFORM_COLOR[clip.platform] }}
                                    >
                                      {PLATFORM_LABEL[clip.platform] || clip.platform}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground truncate">{editor}</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-2 mt-1.5">
                                    <span className={"inline-flex items-center gap-1 text-[11px] " + (stale ? "text-[#FF453A]" : "text-muted-foreground")}>
                                      <Clock className="w-3 h-3" /> {ageInColumn(clip)}
                                    </span>
                                    {stale && <span className="text-[10px] font-semibold text-[#FF453A]">STALE</span>}
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        );
                      })}
                      {provided.placeholder}
                      {items.length === 0 && (
                        <div className="text-[12px] text-muted-foreground/60 text-center py-6">Drop here</div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </DragDropContext>
    </div>
  );
}