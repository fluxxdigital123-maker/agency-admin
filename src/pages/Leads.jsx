import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import LeadCard, { STATUS_LABELS, STATUS_ORDER, STATUS_HEX } from "@/components/leads/LeadCard";
import LeadFormModal from "@/components/leads/LeadFormModal";
import PipelineTotals from "@/components/leads/PipelineTotals";
import PipelineValueChart from "@/components/leads/PipelineValueChart";
import { Plus } from "lucide-react";

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const l = await base44.entities.Lead.list("-created_date", 500);
      setLeads(l || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const byStatus = useMemo(() => {
    const m = {};
    for (const s of STATUS_ORDER) m[s] = [];
    for (const l of leads) (m[l.status] = m[l.status] || []).push(l);
    for (const s of STATUS_ORDER) {
      m[s].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
    }
    return m;
  }, [leads]);

  async function move(id, status) {
    const patch = { status };
    const prev = leads.find((l) => l.id === id);
    if (prev && status !== "TO_CONTACT" && !prev.lastContactDate) {
      patch.lastContactDate = new Date().toISOString().slice(0, 10);
    }
    setLeads((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)));
    try {
      await base44.entities.Lead.update(id, patch);
    } catch {
      load();
    }
  }

  function openNew() {
    setEditing(null);
    setModalOpen(true);
  }
  function openEdit(lead) {
    setEditing(lead);
    setModalOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Leads</h1>
          <p className="text-[15px] text-muted-foreground mt-1">
            Prospect pipeline — track deal stage, upfront cash, and monthly recurring value.
          </p>
        </div>
        <button
          onClick={openNew}
          className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[13px] font-medium"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          <Plus className="w-4 h-4" /> New lead
        </button>
      </div>

      <PipelineTotals leads={leads} />

      <PipelineValueChart leads={leads} />

      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-5 gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory -mx-4 px-4 md:mx-0 md:px-0 pb-2 md:pb-0">
        {STATUS_ORDER.map((s) => {
          const hex = STATUS_HEX[s];
          const list = byStatus[s] || [];
          return (
            <div key={s} className="snap-start shrink-0 w-[82%] sm:w-[48%] md:w-auto md:shrink glass-card p-4 flex flex-col min-h-[200px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: hex }} />
                  <h2 className="text-[14px] font-semibold tracking-tight">{STATUS_LABELS[s]}</h2>
                </div>
                <span className="text-[12px] text-muted-foreground">{list.length}</span>
              </div>
              <div className="space-y-2 flex-1">
                {list.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground/70 py-4 text-center">No leads</p>
                ) : (
                  list.map((l) => <LeadCard key={l.id} lead={l} onMove={move} onEdit={openEdit} />)
                )}
              </div>
            </div>
          );
        })}
      </div>

      {modalOpen && (
        <LeadFormModal lead={editing} onClose={() => setModalOpen(false)} onSaved={load} />
      )}
    </div>
  );
}