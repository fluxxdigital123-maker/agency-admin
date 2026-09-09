import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAiConfigured, analyzeChannel } from "@/lib/aiStatus";
import {
  ArrowLeft, Pencil, Loader2, StickyNote, Check,
} from "lucide-react";
import ClientOverview from "@/components/clients/ClientOverview";
import StrategySection from "@/components/clients/StrategySection";
import PipelineTracker from "@/components/clients/PipelineTracker";
import ClientTeam from "@/components/clients/ClientTeam";
import ClientPayments from "@/components/clients/ClientPayments";
import ClientAnalytics from "@/components/clients/ClientAnalytics";
import ClientFormModal from "@/components/clients/ClientFormModal";

export default function ClientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const aiConfigured = useAiConfigured();

  const [client, setClient] = useState(null);
  const [progress, setProgress] = useState([]);
  const [team, setTeam] = useState([]);
  const [payments, setPayments] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshError, setRefreshError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesDirty, setNotesDirty] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  async function load() {
    try {
      const c = await base44.entities.Client.get(id);
      setClient(c);
      setNotes(c.notes || "");
      setNotesDirty(false);
      const [pr, tm, pm, an] = await Promise.all([
        base44.entities.ClientProgress.filter({ client: id }, "-updatedAt", 100),
        base44.entities.TeamMember.filter({ client: id }, "-created_date", 100),
        base44.entities.Payment.filter({ client: id }, "-dueDate", 100),
        base44.entities.AnalyticsSnapshot.filter({ client: id }, "-date", 50),
      ]);
      setProgress(pr || []);
      setTeam(tm || []);
      setPayments(pm || []);
      setSnapshots(an || []);
    } catch {
      setClient(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleRefresh() {
    if (!client || !client.channelUrl) {
      setRefreshError("This client has no channel URL to analyze.");
      return;
    }
    setRefreshing(true);
    setRefreshError("");
    try {
      const ai = await analyzeChannel(client.channelUrl);
      await base44.entities.Client.update(id, {
        channelSummary: ai.channelSummary || "",
        contentStyle: ai.contentStyle || "",
        offers: ai.offers || "",
        contentStrategy: ai.contentStrategy ? JSON.stringify(ai.contentStrategy) : "",
        growthOpportunities: ai.growthOpportunities ? ai.growthOpportunities.join("\n") : "",
        name: client.name || ai.channelName || client.name,
      });
      await load();
    } catch (e) {
      setRefreshError(e.message || "Analysis failed. This tool will be available once your API key is connected.");
    } finally {
      setRefreshing(false);
    }
  }

  async function handleSetStage(stageKey) {
    try {
      await base44.entities.ClientProgress.create({
        client: id,
        stage: stageKey,
        source: "MANUAL",
        updatedAt: new Date().toISOString(),
        notes: "",
      });
      await load();
    } catch {
      /* ignore */
    }
  }

  async function saveNotes() {
    if (!notesDirty) return;
    try {
      await base44.entities.Client.update(id, { notes });
      setNotesDirty(false);
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 1800);
    } catch {
      /* ignore */
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="glass-card p-10 text-center">
        <h2 className="text-[20px] font-semibold tracking-tight">Client not found</h2>
        <button
          onClick={() => navigate("/clients")}
          className="mt-4 inline-flex items-center gap-2 text-[14px] font-medium text-primary"
        >
          <ArrowLeft className="w-4 h-4" /> Back to clients
        </button>
      </div>
    );
  }

  const currentStage = progress[0]?.stage;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => navigate("/clients")}
          className="inline-flex items-center gap-2 text-[14px] font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Clients
        </button>
        <button
          onClick={() => setEditOpen(true)}
          className="inline-flex items-center gap-2 h-9 px-3 rounded-[10px] text-[14px] font-medium border hover:bg-foreground/5 transition-colors"
          style={{ borderColor: "var(--border)" }}
        >
          <Pencil className="w-4 h-4" /> Edit
        </button>
      </div>

      <ClientOverview
        client={client}
        aiConfigured={aiConfigured}
        refreshing={refreshing}
        onRefresh={handleRefresh}
        refreshError={refreshError}
      />

      <StrategySection
        strategyJson={client.contentStrategy}
        aiConfigured={aiConfigured}
        refreshing={refreshing}
      />

      <PipelineTracker currentStage={currentStage} onSetStage={handleSetStage} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ClientPayments payments={payments} />
        <ClientTeam team={team} />
      </div>

      <ClientAnalytics snapshots={snapshots} />

      {/* Notes */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <StickyNote className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Notes</h2>
        </div>
        <textarea
          value={notes}
          onChange={(e) => {
            setNotes(e.target.value);
            setNotesDirty(true);
          }}
          onBlur={saveNotes}
          rows={4}
          placeholder="Add internal notes about this client…"
          className="w-full rounded-[12px] bg-background/60 border border-border px-3 py-2.5 text-[15px] outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        <div className="flex items-center justify-end gap-2 mt-2 h-5">
          {notesSaved && (
            <span className="inline-flex items-center gap-1 text-[13px]" style={{ color: "#30D158" }}>
              <Check className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {notesDirty && (
            <button
              onClick={saveNotes}
              className="text-[13px] font-medium text-primary hover:opacity-80"
            >
              Save notes
            </button>
          )}
        </div>
      </div>

      <ClientFormModal
        open={editOpen}
        client={client}
        onClose={() => setEditOpen(false)}
        onSaved={load}
      />
    </div>
  );
}