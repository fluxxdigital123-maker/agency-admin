import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Pencil, Users, TrendingUp } from "lucide-react";
import { PLAN_LABELS } from "@/lib/clientStages";
import { fmtMoney } from "@/lib/format";
import StagePill from "@/components/clients/StagePill";
import ClientFormModal from "@/components/clients/ClientFormModal";

export default function Clients() {
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [progress, setProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [planFilter, setPlanFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const [c, p] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.ClientProgress.list("-updatedAt", 500),
      ]);
      setClients(c || []);
      setProgress(p || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const latestStageByClient = useMemo(() => {
    const map = {};
    for (const pr of progress) {
      const cid = pr.client;
      if (!cid) continue;
      if (
        !map[cid] ||
        new Date(pr.updatedAt || pr.updated_date || pr.created_date) >
          new Date(map[cid].updatedAt || map[cid].updated_date || map[cid].created_date)
      ) {
        map[cid] = pr;
      }
    }
    return map;
  }, [progress]);

  const filtered = clients
    .filter((c) => {
      if (search && !(c.name || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter !== "ALL" && c.status !== statusFilter) return false;
      if (planFilter !== "ALL" && c.planType !== planFilter) return false;
      return true;
    })
    .sort((a, b) => {
      if (sortBy === "NAME") return (a.name || "").localeCompare(b.name || "");
      if (sortBy === "MRR") return (b.monthlyFee || 0) - (a.monthlyFee || 0);
      return new Date(b.created_date || 0) - new Date(a.created_date || 0);
    });

  const totalMRR = clients
    .filter((c) => c.status === "ACTIVE")
    .reduce((s, c) => s + (c.monthlyFee || 0), 0);

  const activeCount = clients.filter((c) => c.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Clients</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            {activeCount} active · {fmtMoney(totalMRR)} total MRR
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="inline-flex items-center gap-2 h-10 px-5 rounded-[10px] text-[14px] font-semibold transition-opacity hover:opacity-90"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          <Plus className="w-4 h-4" /> Add Client
        </button>
      </div>

      {/* Filters */}
      <div className="glass-card p-4 flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search clients…"
            className="w-full rounded-[10px] bg-background/60 border border-border pl-9 pr-3 h-10 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <div className="flex gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-[10px] bg-background/60 border border-border px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="CHURNED">Churned</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="h-10 rounded-[10px] bg-background/60 border border-border px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="ALL">All plans</option>
            <option value="TEAM_ONLY">Team Only</option>
            <option value="PERSONAL_INVOLVED">Personal Involved</option>
            <option value="CUSTOM">Custom</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="h-10 rounded-[10px] bg-background/60 border-border px-3 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
          >
            <option value="NEWEST">Newest</option>
            <option value="NAME">Name (A–Z)</option>
            <option value="MRR">MRR (high→low)</option>
          </select>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="glass-card p-10 text-center text-[15px] text-muted-foreground">
          Loading clients…
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
          <h3 className="text-[17px] font-semibold tracking-tight">No clients yet</h3>
          <p className="text-[15px] text-muted-foreground mt-1">
            Add your first client by pasting a YouTube channel URL.
          </p>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div
            className="grid items-center px-5 py-3 text-[12px] font-medium uppercase tracking-wider text-muted-foreground"
            style={{ gridTemplateColumns: "minmax(0,2fr) 1fr 1.2fr 1fr 44px", borderBottom: "0.5px solid var(--border)" }}
          >
            <span>Client</span>
            <span>Plan</span>
            <span>Stage</span>
            <span className="text-right">MRR</span>
            <span />
          </div>
          {filtered.map((c) => {
            const stage = latestStageByClient[c.id]?.stage;
            return (
              <div
                key={c.id}
                className="grid items-center px-5 py-3 cursor-pointer transition-colors hover:bg-foreground/[0.03]"
                style={{ gridTemplateColumns: "minmax(0,2fr) 1fr 1.2fr 1fr 44px", borderBottom: "0.5px solid var(--border)" }}
                onClick={() => navigate(`/clients/${c.id}`)}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center text-[14px] font-semibold"
                    style={{
                      background: c.channelThumbnail ? "transparent" : "rgba(255,255,255,0.06)",
                      color: "hsl(var(--foreground))",
                      backgroundImage: c.channelThumbnail ? `url(${c.channelThumbnail})` : undefined,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                    }}
                  >
                    {!c.channelThumbnail && (c.name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-[15px] font-medium truncate">{c.name}</div>
                    <div className="text-[13px] text-muted-foreground truncate">
                      {c.channelUrl || "—"}
                    </div>
                  </div>
                </div>
                <div>
                  <PlanBadge type={c.planType} label={c.customPlanLabel} />
                </div>
                <div>
                  {stage ? <StagePill stage={stage} /> : <span className="text-[13px] text-muted-foreground">No progress</span>}
                </div>
                <div className="text-right text-[15px] font-medium flex items-center justify-end gap-1">
                  {c.status === "CHURNED" ? (
                    <span className="text-[13px] text-muted-foreground">Churned</span>
                  ) : (
                    <span className="inline-flex items-center gap-1">
                      <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                      {fmtMoney(c.monthlyFee || 0)}
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditing(c);
                      setModalOpen(true);
                    }}
                    className="w-8 h-8 rounded-[8px] flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ClientFormModal
        open={modalOpen}
        client={editing}
        onClose={() => setModalOpen(false)}
        onSaved={load}
      />
    </div>
  );
}

function PlanBadge({ type, label }) {
  const colors = {
    TEAM_ONLY: "#0A84FF",
    PERSONAL_INVOLVED: "#BF5AF2",
    CUSTOM: "#FF9F0A",
  };
  const hex = colors[type] || "#86868b";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-medium whitespace-nowrap"
      style={{ background: `${hex}1A`, color: hex, border: `0.5px solid ${hex}33` }}
    >
      {type === "CUSTOM" && label ? label : PLAN_LABELS[type] || type}
    </span>
  );
}