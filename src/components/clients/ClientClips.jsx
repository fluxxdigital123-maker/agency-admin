import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { Film, Plus, X, ExternalLink, Filter, MessageSquareQuote } from "lucide-react";
import ClipDetailModal from "@/components/clips/ClipDetailModal";

const PLATFORMS = ["YOUTUBE_SHORTS", "TIKTOK", "INSTAGRAM_REELS", "X", "LINKEDIN"];
const STATUSES = ["QUEUED", "EDITING", "REVIEW", "APPROVED", "POSTED"];

const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YT Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "IG Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

const STATUS_STYLE = {
  QUEUED: { bg: "rgba(120,120,128,0.18)", fg: "#98989F" },
  EDITING: { bg: "rgba(10,132,255,0.16)", fg: "#0A84FF" },
  REVIEW: { bg: "rgba(255,159,10,0.16)", fg: "#FF9F0A" },
  APPROVED: { bg: "rgba(191,90,242,0.16)", fg: "#BF5AF2" },
  POSTED: { bg: "rgba(48,209,88,0.16)", fg: "#30D158" },
};

function Pill({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.QUEUED;
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: s.bg, color: s.fg }}
    >
      {status}
    </span>
  );
}

const APPROVAL_STYLE = {
  NOT_REQUIRED: { bg: "rgba(120,120,128,0.16)", fg: "#98989F", label: "—" },
  PENDING: { bg: "rgba(255,159,10,0.16)", fg: "#FF9F0A", label: "Pending" },
  APPROVED: { bg: "rgba(48,209,88,0.16)", fg: "#30D158", label: "Approved" },
  CHANGES_REQUESTED: { bg: "rgba(255,69,58,0.16)", fg: "#FF453A", label: "Changes" },
};

function ApprovalPill({ approval, feedback }) {
  const a = APPROVAL_STYLE[approval] || APPROVAL_STYLE.NOT_REQUIRED;
  return (
    <span
      title={feedback ? `Client: ${feedback}` : (approval === "NOT_REQUIRED" ? "Not sent for review" : approval)}
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
      style={{ background: a.bg, color: a.fg }}
    >
      {a.label}
    </span>
  );
}

function fmt(n) {
  if (n == null || isNaN(Number(n))) return "—";
  const v = Number(n);
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(v);
}

export default function ClientClips({ clientId, team }) {
  const [clips, setClips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [fPlatform, setFPlatform] = useState("");
  const [fEditor, setFEditor] = useState("");
  const [fStatus, setFStatus] = useState("");
  const [detailClip, setDetailClip] = useState(null);

  const editorMap = useMemo(() => {
    const m = {};
    for (const t of team || []) m[t.id] = t;
    return m;
  }, [team]);

  async function load() {
    setLoading(true);
    try {
      const rows = await base44.entities.Clip.filter({ client: clientId }, "-created_date", 500);
      setClips(rows || []);
    } catch {
      setClips([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (clientId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  const filtered = clips.filter((c) => {
    if (fPlatform && c.platform !== fPlatform) return false;
    if (fEditor && c.editor !== fEditor) return false;
    if (fStatus && c.status !== fStatus) return false;
    return true;
  });

  const hasFilters = fPlatform || fEditor || fStatus;

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Film className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Clips</h2>
          <span className="text-[13px] text-muted-foreground">{filtered.length}</span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Add Clip
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="inline-flex items-center gap-1 text-[12px] text-muted-foreground mr-1">
          <Filter className="w-3.5 h-3.5" /> Filter
        </div>
        <FilterSelect value={fPlatform} onChange={setFPlatform} placeholder="Platform" options={PLATFORMS.map((p) => ({ value: p, label: PLATFORM_LABEL[p] }))} />
        <FilterSelect value={fEditor} onChange={setFEditor} placeholder="Editor" options={(team || []).map((t) => ({ value: t.id, label: t.name }))} />
        <FilterSelect value={fStatus} onChange={setFStatus} placeholder="Status" options={STATUSES.map((s) => ({ value: s, label: s }))} />
        {hasFilters && (
          <button onClick={() => { setFPlatform(""); setFEditor(""); setFStatus(""); }} className="text-[12px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
            <X className="w-3 h-3" /> Clear
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-10 text-center text-[14px] text-muted-foreground">Loading clips…</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-[14px] text-muted-foreground">
          {clips.length === 0 ? "No clips yet. Add your first clip." : "No clips match these filters."}
        </div>
      ) : (
        <React.Fragment>
        {/* Mobile card list */}
        <div className="md:hidden space-y-2">
          {filtered.map((c) => (
            <div key={c.id} className="glass-card p-3 space-y-2">
              <div className="flex items-start justify-between gap-2">
                <button onClick={() => setDetailClip(c)} className="font-medium text-left hover:text-primary transition-colors min-w-0 truncate">
                  {c.title}
                </button>
                <select
                  value={c.status}
                  onChange={async (e) => {
                    const ns = e.target.value;
                    const patch = { status: ns };
                    if (ns === "REVIEW" && (!c.clientApproval || c.clientApproval === "NOT_REQUIRED")) patch.clientApproval = "PENDING";
                    await base44.entities.Clip.update(c.id, patch);
                    load();
                  }}
                  className="h-7 rounded-md px-1.5 text-[11px] outline-none bg-transparent shrink-0"
                  style={{ border: "0.5px solid var(--border)" }}
                >
                  {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-muted-foreground">{PLATFORM_LABEL[c.platform] || c.platform}</span>
                <span className="text-[11px] text-muted-foreground">·</span>
                <span className="text-[11px] text-muted-foreground">{c.editor ? (editorMap[c.editor]?.name || "—") : "Unassigned"}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Pill status={c.status} />
                <ApprovalPill approval={c.clientApproval} feedback={c.clientFeedback} />
              </div>
              <div className="flex items-center gap-3 text-[12px] text-muted-foreground pt-1" style={{ borderTop: "0.5px solid var(--border)" }}>
                <span>👁 {fmt(c.views)}</span>
                <span>♥ {fmt(c.likes)}</span>
                <span>💬 {fmt(c.comments)}</span>
                <span>↗ {fmt(c.shares)}</span>
              </div>
              {c.sourceVideoUrl && (
                <a href={c.sourceVideoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5">
                  <ExternalLink className="w-3 h-3" /> source
                </a>
              )}
            </div>
          ))}
        </div>
        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto -mx-2">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="text-left text-muted-foreground border-b" style={{ borderColor: "var(--border)" }}>
                <th className="font-medium px-2 py-2">Title</th>
                <th className="font-medium px-2 py-2">Platform</th>
                <th className="font-medium px-2 py-2">Editor</th>
                <th className="font-medium px-2 py-2">Status</th>
                <th className="font-medium px-2 py-2">Approval</th>
                <th className="font-medium px-2 py-2 text-right">Views</th>
                <th className="font-medium px-2 py-2 text-right">Likes</th>
                <th className="font-medium px-2 py-2 text-right">Comments</th>
                <th className="font-medium px-2 py-2 text-right">Shares</th>
                <th className="font-medium px-2 py-2">Posted</th>
                <th className="font-medium px-2 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-foreground/[0.02]" style={{ borderColor: "var(--border)" }}>
                  <td className="px-2 py-2.5 max-w-[220px]">
                    <button onClick={() => setDetailClip(c)} className="font-medium truncate text-left hover:text-primary transition-colors flex items-center gap-1">
                      {c.title}
                      <MessageSquareQuote className="w-3 h-3 text-muted-foreground/60 shrink-0" />
                    </button>
                    {c.sourceVideoUrl && (
                      <a href={c.sourceVideoUrl} target="_blank" rel="noreferrer" className="text-[11px] text-muted-foreground hover:text-primary inline-flex items-center gap-0.5 truncate">
                        <ExternalLink className="w-3 h-3" /> source
                      </a>
                    )}
                  </td>
                  <td className="px-2 py-2.5">{PLATFORM_LABEL[c.platform] || c.platform}</td>
                  <td className="px-2 py-2.5">{c.editor ? (editorMap[c.editor]?.name || "—") : "—"}</td>
                  <td className="px-2 py-2.5"><Pill status={c.status} /></td>
                  <td className="px-2 py-2.5"><ApprovalPill approval={c.clientApproval} feedback={c.clientFeedback} /></td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmt(c.views)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmt(c.likes)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmt(c.comments)}</td>
                  <td className="px-2 py-2.5 text-right tabular-nums">{fmt(c.shares)}</td>
                  <td className="px-2 py-2.5 text-muted-foreground">{c.postedDate ? c.postedDate.slice(5) : "—"}</td>
                  <td className="px-2 py-2.5">
                    <select
                      value={c.status}
                      onChange={async (e) => {
                        const newStatus = e.target.value;
                        const patch = { status: newStatus };
                        if (newStatus === "REVIEW" && (!c.clientApproval || c.clientApproval === "NOT_REQUIRED")) {
                          patch.clientApproval = "PENDING";
                        }
                        await base44.entities.Clip.update(c.id, patch);
                        load();
                      }}
                      className="h-7 rounded-md px-1.5 text-[12px] outline-none bg-transparent"
                      style={{ border: "0.5px solid var(--border)" }}
                    >
                      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </React.Fragment>
      )}

      {addOpen && (
        <AddClipModal
          clientId={clientId}
          team={team || []}
          onClose={() => setAddOpen(false)}
          onSaved={() => { setAddOpen(false); load(); }}
        />
      )}

      {detailClip && (
        <ClipDetailModal clip={detailClip} onClose={() => setDetailClip(null)} />
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, placeholder, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 rounded-full px-3 text-[12px] font-medium outline-none bg-background/60"
      style={{ border: "0.5px solid var(--border)" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function AddClipModal({ clientId, team, onClose, onSaved }) {
  const [form, setForm] = useState({
    title: "",
    platform: "YOUTUBE_SHORTS",
    sourceVideoUrl: "",
    clipUrl: "",
    editor: "",
    status: "QUEUED",
    postedDate: "",
    views: "",
    likes: "",
    comments: "",
    shares: "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit() {
    if (!form.title.trim()) { setErr("Title is required."); return; }
    setSaving(true);
    setErr("");
    try {
      await base44.entities.Clip.create({
        client: clientId,
        title: form.title.trim(),
        platform: form.platform,
        sourceVideoUrl: form.sourceVideoUrl.trim() || undefined,
        clipUrl: form.clipUrl.trim() || undefined,
        editor: form.editor || undefined,
        status: form.status,
        postedDate: form.postedDate || undefined,
        views: form.views === "" ? undefined : Number(form.views),
        likes: form.likes === "" ? undefined : Number(form.likes),
        comments: form.comments === "" ? undefined : Number(form.comments),
        shares: form.shares === "" ? undefined : Number(form.shares),
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "Could not save clip.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal mobile-sheet w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-tight">Add Clip</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          <Field label="Title *">
            <input value={form.title} onChange={(e) => set("title", e.target.value)} className="inp" placeholder="Clip title" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Platform">
              <select value={form.platform} onChange={(e) => set("platform", e.target.value)} className="inp">
                {PLATFORMS.map((p) => <option key={p} value={p}>{PLATFORM_LABEL[p]}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select value={form.status} onChange={(e) => set("status", e.target.value)} className="inp">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Editor">
            <select value={form.editor} onChange={(e) => set("editor", e.target.value)} className="inp">
              <option value="">Unassigned</option>
              {team.map((t) => <option key={t.id} value={t.id}>{t.name} · {t.role}</option>)}
            </select>
          </Field>
          <Field label="Source video URL">
            <input value={form.sourceVideoUrl} onChange={(e) => set("sourceVideoUrl", e.target.value)} className="inp" placeholder="https://…" />
          </Field>
          <Field label="Clip URL">
            <input value={form.clipUrl} onChange={(e) => set("clipUrl", e.target.value)} className="inp" placeholder="https://…" />
          </Field>
          <Field label="Posted date">
            <input type="date" value={form.postedDate} onChange={(e) => set("postedDate", e.target.value)} className="inp" />
          </Field>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Views"><input type="number" value={form.views} onChange={(e) => set("views", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Likes"><input type="number" value={form.likes} onChange={(e) => set("likes", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Comments"><input type="number" value={form.comments} onChange={(e) => set("comments", e.target.value)} className="inp" placeholder="0" /></Field>
            <Field label="Shares"><input type="number" value={form.shares} onChange={(e) => set("shares", e.target.value)} className="inp" placeholder="0" /></Field>
          </div>
        </div>

        {err && <p className="text-[13px] mt-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}

        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium hover:bg-foreground/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save clip"}
          </button>
        </div>
      </div>
      <style>{`.inp{width:100%;height:38px;border-radius:10px;border:0.5px solid var(--border);background:rgba(255,255,255,0.04);padding:0 10px;font-size:14px;outline:none}.inp:focus{box-shadow:0 0 0 2px hsl(var(--ring)/0.4)}`}</style>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[12px] font-medium text-muted-foreground mb-1">{label}</span>
      {children}
    </label>
  );
}