import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Eye, Plus, Upload, TrendingUp, Heart, MessageCircle, Share2 } from "lucide-react";
import ViewsCharts from "@/components/views/ViewsCharts";
import LogViewsModal from "@/components/views/LogViewsModal";
import CsvImportModal from "@/components/views/CsvImportModal";
import ClipPipeline from "@/components/views/ClipPipeline";
import { PLATFORM_LABEL } from "@/lib/viewPlatforms";

function startOf(period) {
  const d = new Date();
  if (period === "week") d.setDate(d.getDate() - 7);
  else d.setMonth(d.getMonth() - 1);
  return d;
}

function fmt(n) { return Number(n || 0).toLocaleString(); }

export default function Views() {
  const [clients, setClients] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("week");
  const [logOpen, setLogOpen] = useState(false);
  const [csvOpen, setCsvOpen] = useState(false);
  const [drillClient, setDrillClient] = useState("");
  const [tab, setTab] = useState("overview");

  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.ViewSnapshot.list("-date", 1000),
      ]);
      setClients(c || []);
      setSnapshots(s || []);
    } catch {
      setClients([]); setSnapshots([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const filtered = useMemo(
    () => (snapshots || []).filter((s) => new Date(s.date) >= startOf(period)),
    [snapshots, period]
  );

  const totals = useMemo(() => {
    let views = 0, likes = 0, comments = 0, shares = 0;
    for (const s of filtered) {
      views += Number(s.views) || 0;
      likes += Number(s.likes) || 0;
      comments += Number(s.comments) || 0;
      shares += Number(s.shares) || 0;
    }
    return { views, likes, comments, shares };
  }, [filtered]);

  const drillRows = useMemo(
    () => (drillClient ? filtered.filter((s) => s.client === drillClient) : []).sort((a, b) => (a.date < b.date ? 1 : -1)),
    [filtered, drillClient]
  );

  const drillTotals = useMemo(() => {
    let v = 0, l = 0, c = 0, sh = 0;
    for (const s of drillRows) {
      v += Number(s.views) || 0; l += Number(s.likes) || 0; c += Number(s.comments) || 0; sh += Number(s.shares) || 0;
    }
    return { views: v, likes: l, comments: c, shares: sh };
  }, [drillRows]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Views</h1>
          <p className="text-[15px] text-muted-foreground mt-1">Track views and engagement across all client clips.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full p-0.5" style={{ background: "rgba(128,128,128,0.15)" }}>
            {["overview", "pipeline"].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={"h-8 px-4 rounded-full text-[13px] font-medium " + (tab === t ? "bg-foreground text-background" : "text-muted-foreground")}
              >
                {t === "overview" ? "Overview" : "Pipeline"}
              </button>
            ))}
          </div>
          {tab === "overview" && (
            <>
              <button
                onClick={() => setCsvOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[14px] font-medium border hover:bg-foreground/5"
                style={{ borderColor: "var(--border)" }}
              >
                <Upload className="w-4 h-4" /> CSV
              </button>
              <button
                onClick={() => setLogOpen(true)}
                className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90"
              >
                <Plus className="w-4 h-4" /> Log Views
              </button>
            </>
          )}
        </div>
      </div>

      {tab === "overview" && (
      <>
      <div className="inline-flex rounded-full p-0.5" style={{ background: "rgba(128,128,128,0.15)" }}>
        {["week", "month"].map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={"h-8 px-4 rounded-full text-[13px] font-medium " + (period === p ? "bg-foreground text-background" : "text-muted-foreground")}
          >
            {p === "week" ? "This week" : "This month"}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat icon={Eye} color="#0A84FF" label={`Views this ${period}`} value={totals.views} />
        <Stat icon={Heart} color="#FF375F" label={`Likes this ${period}`} value={totals.likes} />
        <Stat icon={MessageCircle} color="#30D158" label={`Comments this ${period}`} value={totals.comments} />
        <Stat icon={Share2} color="#FF9F0A" label={`Shares this ${period}`} value={totals.shares} />
      </div>

      <ViewsCharts snapshots={filtered} clients={clients} />

      <div className="glass-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-[18px] h-[18px] text-muted-foreground" />
            <h2 className="text-[18px] font-semibold tracking-tight">Per-Client Drill-Down</h2>
          </div>
          <select
            value={drillClient}
            onChange={(e) => setDrillClient(e.target.value)}
            className="h-8 rounded-full px-3 text-[13px] outline-none bg-background/60"
            style={{ border: "0.5px solid var(--border)" }}
          >
            <option value="">Select a client</option>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        {!drillClient ? (
          <div className="py-8 text-center text-[14px] text-muted-foreground">Choose a client to see their view snapshots.</div>
        ) : drillRows.length === 0 ? (
          <div className="py-8 text-center text-[14px] text-muted-foreground">No snapshots for this client in the selected period.</div>
        ) : (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <MiniStat label="Views" value={drillTotals.views} />
              <MiniStat label="Likes" value={drillTotals.likes} />
              <MiniStat label="Comments" value={drillTotals.comments} />
              <MiniStat label="Shares" value={drillTotals.shares} />
            </div>
            <div className="overflow-x-auto -mx-2">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="text-left text-muted-foreground border-b" style={{ borderColor: "var(--border)" }}>
                    <th className="font-medium px-2 py-2">Date</th>
                    <th className="font-medium px-2 py-2">Platform</th>
                    <th className="font-medium px-2 py-2 text-right">Views</th>
                    <th className="font-medium px-2 py-2 text-right">Likes</th>
                    <th className="font-medium px-2 py-2 text-right">Comments</th>
                    <th className="font-medium px-2 py-2 text-right">Shares</th>
                  </tr>
                </thead>
                <tbody>
                  {drillRows.map((s) => (
                    <tr key={s.id} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                      <td className="px-2 py-2.5">{s.date}</td>
                      <td className="px-2 py-2.5">{PLATFORM_LABEL[s.platform] || s.platform}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(s.views)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(s.likes)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(s.comments)}</td>
                      <td className="px-2 py-2.5 text-right tabular-nums">{fmt(s.shares)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      </>
      )}
      {tab === "pipeline" && <ClipPipeline clients={clients} />}

      {logOpen && <LogViewsModal clients={clients} onClose={() => setLogOpen(false)} onSaved={() => { setLogOpen(false); load(); }} />}
      {csvOpen && <CsvImportModal clients={clients} onClose={() => setCsvOpen(false)} onSaved={() => load()} />}
    </div>
  );
}

function Stat({ icon: Icon, color, label, value }) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color }} />
        <span className="text-[12px] text-muted-foreground capitalize">{label}</span>
      </div>
      <div className="text-[26px] font-semibold tracking-tight tabular-nums">{fmt(value)}</div>
    </div>
  );
}

function MiniStat({ label, value }) {
  return (
    <div className="rounded-[12px] p-3" style={{ background: "rgba(128,128,128,0.08)" }}>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      <div className="text-[18px] font-semibold tabular-nums">{fmt(value)}</div>
    </div>
  );
}