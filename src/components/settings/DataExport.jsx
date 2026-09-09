import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import {
  Download, Database, FileSpreadsheet, Archive, Upload, Loader2, Check, AlertCircle,
} from "lucide-react";

const ENTITIES = [
  "Client", "Lead", "Payment", "Invoice", "EditorPayout",
  "TeamMember", "Clip", "PostingCadence", "ClientProgress",
  "ViewSnapshot", "AnalyticsSnapshot", "Report",
  "IdeationThread", "IdeationMessage", "ThumbnailSession", "ThumbnailMessage",
  "KnowledgeEntry", "Notification", "UserRole", "AppSetting",
];

const AUTO_FIELDS = ["id", "created_date", "updated_date", "created_by_id"];
const SETTING_KEY = "lastDataExportAt";

function escapeCsv(v) {
  if (v === null || v === undefined) return "";
  let s = typeof v === "object" ? JSON.stringify(v) : String(v);
  if (/[",\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCSV(rows) {
  if (!rows || !rows.length) return "";
  const keys = Array.from(rows.reduce((set, r) => {
    Object.keys(r).forEach((k) => set.add(k));
    return set;
  }, new Set()));
  const head = keys.join(",");
  const body = rows.map((r) => keys.map((k) => escapeCsv(r[k])).join(",")).join("\n");
  return head + "\n" + body;
}

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function fmtTime(iso) {
  if (!iso) return "Never";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export default function DataExport() {
  const [lastExport, setLastExport] = useState("");
  const [busy, setBusy] = useState(""); // entity name or "backup" or "restore"
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [restoreResult, setRestoreResult] = useState("");
  const fileRef = useRef(null);

  async function loadLastExport() {
    try {
      const rows = await base44.entities.AppSetting.filter({ key: SETTING_KEY }, "-created_date", 1);
      if (rows && rows[0]) setLastExport(rows[0].value);
    } catch {
      /* ignore */
    }
  }

  useEffect(() => { loadLastExport(); }, []);

  function stampExport() {
    const now = new Date().toISOString();
    setLastExport(now);
    return base44.entities.AppSetting.filter({ key: SETTING_KEY }, "-created_date", 1)
      .then((rows) => {
        if (rows && rows[0]) return base44.entities.AppSetting.update(rows[0].id, { value: now });
        return base44.entities.AppSetting.create({ key: SETTING_KEY, value: now });
      })
      .catch(() => {});
  }

  function flash(kind) {
    setDone(kind);
    setTimeout(() => setDone(""), 1800);
  }

  async function exportCsv(name) {
    setBusy(name);
    setError("");
    try {
      const rows = await base44.entities[name].list("-created_date", 5000);
      const csv = toCSV(rows || []);
      download(`${name}.csv`, csv, "text/csv");
      await stampExport();
      flash(`${name} CSV`);
    } catch (e) {
      setError(e.message || `Failed to export ${name}`);
    } finally {
      setBusy("");
    }
  }

  async function fullBackup() {
    setBusy("backup");
    setError("");
    try {
      const bundle = { exportedAt: new Date().toISOString(), entities: {} };
      for (const name of ENTITIES) {
        try {
          const rows = await base44.entities[name].list("-created_date", 5000);
          bundle.entities[name] = rows || [];
        } catch {
          bundle.entities[name] = [];
        }
      }
      download(`agency-backup-${bundle.exportedAt.slice(0, 10)}.json`, JSON.stringify(bundle, null, 2), "application/json");
      await stampExport();
      flash("Full backup");
    } catch (e) {
      setError(e.message || "Backup failed");
    } finally {
      setBusy("");
    }
  }

  async function restore(file) {
    if (!file) return;
    setBusy("restore");
    setError("");
    setRestoreResult("");
    try {
      const text = await file.text();
      const bundle = JSON.parse(text);
      const ents = bundle.entities || {};
      const results = [];
      for (const name of Object.keys(ents)) {
        if (!ENTITIES.includes(name)) continue;
        const records = ents[name];
        if (!Array.isArray(records) || !records.length) continue;
        const clean = records.map((r) => {
          const c = { ...r };
          AUTO_FIELDS.forEach((f) => delete c[f]);
          return c;
        });
        try {
          await base44.entities[name].bulkCreate(clean);
          results.push(`${name}: ${clean.length}`);
        } catch (e) {
          results.push(`${name}: failed (${e.message})`);
        }
      }
      setRestoreResult(results.join(" · ") || "Nothing to restore");
      flash("Restore");
    } catch (e) {
      setError(e.message || "Restore failed — invalid JSON file");
    } finally {
      setBusy("");
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="glass-card p-6 space-y-5">
      <div className="flex items-center gap-2">
        <Database className="w-[18px] h-[18px] text-muted-foreground" />
        <h3 className="text-[16px] font-semibold tracking-tight">Data Export & Backup</h3>
      </div>

      <div className="flex items-center justify-between text-[13px]">
        <span className="text-muted-foreground">Last export: <span className="text-foreground font-medium">{fmtTime(lastExport)}</span></span>
        {done && (
          <span className="inline-flex items-center gap-1" style={{ color: "#30D158" }}>
            <Check className="w-3.5 h-3.5" /> {done} downloaded
          </span>
        )}
      </div>

      {error && (
        <div className="flex items-start gap-2 text-[13px] p-2.5 rounded-[10px]" style={{ background: "rgba(255,69,58,0.10)", color: "#FF453A" }}>
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /> <span>{error}</span>
        </div>
      )}

      {/* Full backup + restore */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <button
          onClick={fullBackup}
          disabled={!!busy}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-medium border hover:bg-foreground/5 transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {busy === "backup" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Archive className="w-4 h-4" />}
          Full backup (JSON)
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={!!busy}
          className="flex items-center justify-center gap-2 h-10 px-4 rounded-[10px] text-[14px] font-medium border hover:bg-foreground/5 transition-colors disabled:opacity-50"
          style={{ borderColor: "var(--border)" }}
        >
          {busy === "restore" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Restore from JSON
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => restore(e.target.files?.[0])}
        />
      </div>

      {restoreResult && (
        <div className="text-[13px] p-2.5 rounded-[10px] bg-foreground/5">
          <span className="font-medium">Restored:</span> {restoreResult}
        </div>
      )}

      {/* Per-entity CSV exports */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
          <span className="text-[14px] font-medium">Export individual entities (CSV)</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {ENTITIES.map((name) => (
            <button
              key={name}
              onClick={() => exportCsv(name)}
              disabled={!!busy}
              className="flex items-center justify-between gap-1.5 h-9 px-3 rounded-[8px] text-[13px] border hover:bg-foreground/5 transition-colors disabled:opacity-50"
              style={{ borderColor: "var(--border)" }}
            >
              <span className="truncate">{name}</span>
              {busy === name ? <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" /> : <Download className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}