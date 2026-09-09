import React, { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Trophy, Eye, Flame, Users, MonitorPlay, ExternalLink, Loader2 } from "lucide-react";
import { PLATFORM_LABEL, PLATFORM_COLOR } from "@/lib/viewPlatforms";

function startOf(period) {
  if (period === "all") return new Date(0);
  const d = new Date();
  if (period === "week") d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d;
}

function fmt(n) { return Number(n || 0).toLocaleString(); }
function pct(rate) { return rate > 0 ? `${(rate * 100).toFixed(1)}%` : "0%"; }

export default function Leaderboard({ clients, snapshots }) {
  const [clips, setClips] = useState([]);
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");

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
  const clipMap = useMemo(() => { const m = {}; for (const c of clips) m[c.id] = c; return m; }, [clips]);
  const editorMap = useMemo(() => { const m = {}; for (const t of team) m[t.id] = t; return m; }, [team]);

  // latest snapshot per clip within the selected period
  const latestByClip = useMemo(() => {
    const cutoff = startOf(period);
    const m = {};
    for (const s of snapshots || []) {
      if (!s.clip) continue;
      if (new Date(s.date) < cutoff) continue;
      const cur = m[s.clip];
      if (!cur || new Date(s.date) > new Date(cur.date)) m[s.clip] = s;
    }
    return m;
  }, [snapshots, period]);

  const clipRows = useMemo(() => {
    const rows = Object.values(latestByClip).map((s) => {
      const views = Number(s.views) || 0;
      const eng = Number(s.likes) + Number(s.comments) + Number(s.shares);
      const rate = views > 0 ? eng / views : 0;
      const clip = clipMap[s.clip];
      return {
        clipId: s.clip,
        title: clip?.title || "Untitled clip",
        clipUrl: clip?.clipUrl || "",
        clientId: s.client,
        clientName: clientMap[s.client]?.name || "—",
        platform: s.platform,
        views,
        rate,
      };
    });
    return rows;
  }, [latestByClip, clipMap, clientMap]);

  const clipByViews = useMemo(
    () => [...clipRows].sort((a, b) => b.views - a.views).slice(0, 10),
    [clipRows]
  );
  const clipByEngagement = useMemo(
    () => [...clipRows].sort((a, b) => b.rate - a.rate).slice(0, 10),
    [clipRows]
  );

  const editorRows = useMemo(() => {
    const m = {};
    for (const s of Object.values(latestByClip)) {
      const clip = clipMap[s.clip];
      const ed = clip?.editor;
      if (!ed) continue;
      if (!m[ed]) m[ed] = { editorId: ed, views: 0, clips: 0 };
      m[ed].views += Number(s.views) || 0;
      m[ed].clips += 1;
    }
    return Object.values(m).sort((a, b) => b.views - a.views).slice(0, 10);
  }, [latestByClip, clipMap]);

  const platformRows = useMemo(() => {
    const m = {};
    for (const s of Object.values(latestByClip)) {
      const p = s.platform;
      if (!p) continue;
      if (!m[p]) m[p] = { platform: p, views: 0, clips: 0 };
      m[p].views += Number(s.views) || 0;
      m[p].clips += 1;
    }
    return Object.values(m).sort((a, b) => b.views - a.views);
  }, [latestByClip]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const hasData = Object.keys(latestByClip).length > 0;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Trophy className="w-[18px] h-[18px]" style={{ color: "#FFD60A" }} />
          <h2 className="text-[18px] font-semibold tracking-tight">Performance Leaderboard</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full p-0.5" style={{ background: "rgba(128,128,128,0.15)" }}>
            {["week", "month", "all"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={"h-8 px-4 rounded-full text-[13px] font-medium " + (period === p ? "bg-foreground text-background" : "text-muted-foreground")}
              >
                {p === "week" ? "This week" : p === "month" ? "This month" : "All-time"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!hasData ? (
        <div className="glass-card p-10 text-center text-[14px] text-muted-foreground">
          No view snapshots logged in this period yet.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <ClipLeaderboard
              title="Top Clips by Views"
              icon={Eye}
              iconColor="#0A84FF"
              rows={clipByViews}
            />
            <ClipLeaderboard
              title="Top Clips by Engagement"
              icon={Flame}
              iconColor="#FF9F0A"
              rows={clipByEngagement}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <EditorLeaderboard rows={editorRows} editorMap={editorMap} />
            <PlatformLeaderboard rows={platformRows} />
          </div>
        </>
      )}
    </div>
  );
}

function Rank({ i }) {
  const medal = ["#FFD60A", "#C0C0C0", "#CD7F32"][i];
  return (
    <span
      className="inline-flex items-center justify-center w-6 h-6 rounded-full text-[12px] font-semibold shrink-0"
      style={{ background: i < 3 ? `${medal}22` : "rgba(128,128,128,0.14)", color: i < 3 ? medal : "var(--muted-foreground)" }}
    >
      {i + 1}
    </span>
  );
}

function ClipLeaderboard({ title, icon: Icon, iconColor, rows }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: iconColor }} />
        <h3 className="text-[15px] font-semibold tracking-tight">{title}</h3>
      </div>
      <div className="space-y-1">
        {rows.length === 0 && <div className="py-6 text-center text-[13px] text-muted-foreground">No clips yet.</div>}
        {rows.map((r, i) => {
          const color = PLATFORM_COLOR[r.platform] || "#8E8E93";
          return (
            <div
              key={r.clipId}
              className="flex items-center gap-3 rounded-[10px] px-2.5 py-2 hover:bg-foreground/5 transition-colors"
            >
              <Rank i={i} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  {r.clipUrl ? (
                    <a href={r.clipUrl} target="_blank" rel="noreferrer" className="text-[13px] font-medium truncate hover:underline inline-flex items-center gap-1">
                      <span className="truncate">{r.title}</span>
                      <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                    </a>
                  ) : (
                    <span className="text-[13px] font-medium truncate">{r.title}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="inline-flex items-center px-1.5 py-0 rounded text-[10px] font-semibold" style={{ background: `${color}22`, color }}>
                    {PLATFORM_LABEL[r.platform] || r.platform}
                  </span>
                  <Link to={`/clients/${r.clientId}`} className="text-[11px] text-muted-foreground hover:text-foreground truncate">
                    {r.clientName}
                  </Link>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-[14px] font-semibold tabular-nums">{fmt(r.views)}</div>
                <div className="text-[11px] text-muted-foreground tabular-nums">{pct(r.rate)} eng.</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EditorLeaderboard({ rows, editorMap }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Users className="w-4 h-4" style={{ color: "#BF5AF2" }} />
        <h3 className="text-[15px] font-semibold tracking-tight">Top Editors by Views</h3>
      </div>
      <div className="space-y-1">
        {rows.length === 0 && <div className="py-6 text-center text-[13px] text-muted-foreground">No editor-tagged clips yet.</div>}
        {rows.map((r, i) => {
          const name = editorMap[r.editorId]?.name || "Unassigned";
          return (
            <div key={r.editorId} className="flex items-center gap-3 rounded-[10px] px-2.5 py-2">
              <Rank i={i} />
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{name}</div>
                <div className="text-[11px] text-muted-foreground">{r.clips} clip{r.clips === 1 ? "" : "s"}</div>
              </div>
              <div className="text-[14px] font-semibold tabular-nums shrink-0">{fmt(r.views)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PlatformLeaderboard({ rows }) {
  const max = rows.length ? rows[0].views : 0;
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <MonitorPlay className="w-4 h-4" style={{ color: "#64D2FF" }} />
        <h3 className="text-[15px] font-semibold tracking-tight">Top Platforms by Views</h3>
      </div>
      <div className="space-y-2">
        {rows.length === 0 && <div className="py-6 text-center text-[13px] text-muted-foreground">No platform data yet.</div>}
        {rows.map((r, i) => {
          const color = PLATFORM_COLOR[r.platform] || "#8E8E93";
          const pctW = max > 0 ? Math.max(6, (r.views / max) * 100) : 0;
          return (
            <div key={r.platform} className="flex items-center gap-3">
              <Rank i={i} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[13px] font-medium">{PLATFORM_LABEL[r.platform] || r.platform}</span>
                  <span className="text-[13px] font-semibold tabular-nums">{fmt(r.views)}</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(128,128,128,0.15)" }}>
                  <div className="h-full rounded-full" style={{ width: `${pctW}%`, background: color }} />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}