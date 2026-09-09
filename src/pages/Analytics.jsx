import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useYoutubeConfigured } from "@/lib/youtubeStatus";
import { fmtNumber, fmtDate } from "@/lib/format";
import ConnectKeyBanner from "@/components/analytics/ConnectKeyBanner";
import AnalyticsStats from "@/components/analytics/AnalyticsStats";
import PerClientCharts from "@/components/analytics/PerClientCharts";
import ComparisonChart from "@/components/analytics/ComparisonChart";
import TopVideos from "@/components/analytics/TopVideos";
import ManualEntryModal from "@/components/analytics/ManualEntryModal";
import { RefreshCw, Loader2, Plus, BarChart3 } from "lucide-react";

// snapshots sorted asc by date → keep latest per date
function dedupeByDate(snaps) {
  const map = {};
  for (const s of snaps) map[s.date] = s;
  return Object.values(map).sort((a, b) => (a.date < b.date ? -1 : 1));
}

export default function Analytics() {
  const { configured, loaded } = useYoutubeConfigured();
  const [clients, setClients] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pulling, setPulling] = useState(null);
  const [pullError, setPullError] = useState("");
  const [manualOpen, setManualOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [c, s] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.AnalyticsSnapshot.list("-date", 1000),
      ]);
      setClients(c || []);
      setSnapshots(s || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const clientMap = useMemo(() => {
    const m = {};
    for (const c of clients) m[c.id] = c;
    return m;
  }, [clients]);

  const snapsByClient = useMemo(() => {
    const m = {};
    for (const s of snapshots) (m[s.client] = m[s.client] || []).push(s);
    for (const k of Object.keys(m)) m[k].sort((a, b) => (a.date < b.date ? -1 : 1));
    return m;
  }, [snapshots]);

  const latestByClient = useMemo(() => {
    const m = {};
    for (const k of Object.keys(snapsByClient)) {
      const arr = snapsByClient[k];
      m[k] = arr[arr.length - 1];
    }
    return m;
  }, [snapsByClient]);

  async function pull(clientId) {
    setPulling(clientId);
    setPullError("");
    try {
      const res = await base44.functions.invoke("pullYoutubeAnalytics", { clientId });
      const data = res && res.data ? res.data : res;
      if (data && data.configured === false) {
        setPullError("No YouTube API key configured. Add one in Settings, or enter a snapshot manually.");
      } else if (data && data.error) {
        setPullError(data.error);
      }
      await load();
    } catch (e) {
      const msg = e?.response?.data?.error || e.message || "Pull failed.";
      setPullError(msg);
    } finally {
      setPulling(null);
    }
  }

  async function pullAll() {
    setPulling("all");
    setPullError("");
    try {
      await Promise.all(
        clients
          .filter((c) => c.channelUrl)
          .map((c) =>
            base44.functions.invoke("pullYoutubeAnalytics", { clientId: c.id }).catch(() => null)
          )
      );
      await load();
    } catch (e) {
      setPullError(e.message || "Some pulls failed.");
    } finally {
      setPulling(null);
    }
  }

  if (loading || !loaded) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const selectedClient = selectedId ? clientMap[selectedId] : null;
  const selectedSnaps = selectedId ? dedupeByDate(snapsByClient[selectedId] || []) : [];
  const selectedLatest = selectedSnaps.length ? selectedSnaps[selectedSnaps.length - 1] : null;
  const comparisonRows = clients
    .map((c) => ({ client: c, latest: latestByClient[c.id] }))
    .filter((r) => r.latest);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Analytics</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            YouTube performance across every client channel.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedId && (
            <button
              onClick={() => setManualOpen(true)}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium border hover:bg-foreground/5"
              style={{ borderColor: "var(--border)" }}
            >
              <Plus className="w-4 h-4" /> Manual entry
            </button>
          )}
          {selectedId ? (
            <button
              onClick={() => pull(selectedId)}
              disabled={pulling === selectedId}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium disabled:opacity-50"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {pulling === selectedId ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Pull from YouTube
            </button>
          ) : (
            <button
              onClick={pullAll}
              disabled={pulling === "all"}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium disabled:opacity-50"
              style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
            >
              {pulling === "all" ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              Pull all
            </button>
          )}
        </div>
      </div>

      {!configured && <ConnectKeyBanner />}

      {pullError && (
        <div className="glass-card p-3 text-[13px] text-destructive">{pullError}</div>
      )}

      {/* view switcher */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={selectedId || ""}
            onChange={(e) => setSelectedId(e.target.value || null)}
            className="h-9 rounded-[10px] pl-9 pr-8 text-[14px] font-medium outline-none appearance-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
          >
            <option value="">All clients (comparison)</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <BarChart3 className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>
      </div>

      {selectedId ? (
        selectedClient ? (
          <>
            <AnalyticsStats latest={selectedLatest} snapshots={selectedSnaps} />
            <PerClientCharts snapshots={selectedSnaps} />
            <TopVideos latest={selectedLatest} />
            {manualOpen && (
              <ManualEntryModal
                clientId={selectedId}
                onClose={() => setManualOpen(false)}
                onSaved={load}
              />
            )}
          </>
        ) : null
      ) : (
        <>
          <ComparisonChart rows={comparisonRows} />

          <div className="glass-card overflow-hidden">
            <div
              className="flex items-center gap-2 px-6 py-4"
              style={{ borderBottom: "0.5px solid var(--border)" }}
            >
              <h2 className="text-[17px] font-semibold tracking-tight">Client Comparison</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr
                    className="text-left text-[12px] text-muted-foreground"
                    style={{ borderBottom: "0.5px solid var(--border)" }}
                  >
                    <th className="px-6 py-2 font-medium">Client</th>
                    <th className="px-4 py-2 font-medium text-right">Subscribers</th>
                    <th className="px-4 py-2 font-medium text-right">Total Views</th>
                    <th className="px-4 py-2 font-medium text-right">Avg CTR</th>
                    <th className="px-4 py-2 font-medium text-right">Watch Hours</th>
                    <th className="px-4 py-2 font-medium">Last Pull</th>
                    <th className="px-4 py-2 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map((c) => {
                    const snaps = dedupeByDate(snapsByClient[c.id] || []);
                    const latest = snaps.length ? snaps[snaps.length - 1] : null;
                    const ctrs = snaps
                      .map((s) => s.impressionsCTR)
                      .filter((v) => v != null && !isNaN(Number(v)));
                    const avgCtr = ctrs.length
                      ? ctrs.reduce((a, b) => a + Number(b), 0) / ctrs.length
                      : null;
                    return (
                      <tr
                        key={c.id}
                        style={{ borderBottom: "0.5px solid var(--border)" }}
                      >
                        <td className="px-6 py-3 font-medium">{c.name}</td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {latest?.subscribers != null ? fmtNumber(latest.subscribers) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {latest?.views != null ? fmtNumber(latest.views) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {avgCtr != null ? `${avgCtr.toFixed(1)}%` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums">
                          {latest?.watchHours != null ? fmtNumber(latest.watchHours) : "—"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {latest ? fmtDate(latest.date) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="inline-flex items-center gap-3">
                            <button
                              onClick={() => setSelectedId(c.id)}
                              className="text-[12px] font-medium text-primary hover:opacity-70"
                            >
                              View
                            </button>
                            {c.channelUrl && (
                              <button
                                onClick={() => pull(c.id)}
                                disabled={pulling === c.id}
                                className="text-[12px] font-medium text-primary hover:opacity-70 disabled:opacity-40"
                              >
                                {pulling === c.id ? "…" : "Pull"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}