import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { X, Upload, FileSpreadsheet } from "lucide-react";
import { PLATFORMS } from "@/lib/viewPlatforms";

const SAMPLE = "client,date,platform,views,likes,comments,shares,clip\nAcme Inc,2026-09-09,YOUTUBE_SHORTS,1200,80,12,5,";

function parseCsv(str) {
  const lines = str.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { headers: [], rows: [] };
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const rows = lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const o = {};
    headers.forEach((h, i) => { o[h] = cols[i] ?? ""; });
    return o;
  });
  return { headers, rows };
}

export default function CsvImportModal({ clients, onClose, onSaved }) {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function importNow() {
    setErr(""); setResult(null);
    if (!text.trim()) { setErr("Paste CSV data first."); return; }
    setBusy(true);
    try {
      const { rows } = parseCsv(text);
      if (!rows.length) { setErr("No rows found."); setBusy(false); return; }
      const byName = {};
      for (const c of clients) byName[c.name.toLowerCase()] = c.id;
      const records = [];
      let skipped = 0;
      for (const r of rows) {
        const key = (r.client || "").toLowerCase();
        const cid = byName[key] || r.client || undefined;
        if (!cid) { skipped++; continue; }
        const rec = { client: cid, date: r.date || new Date().toISOString().slice(0, 10) };
        const plat = (r.platform || "").toUpperCase();
        if (r.platform && PLATFORMS.includes(plat)) rec.platform = plat;
        for (const f of ["views", "likes", "comments", "shares"]) {
          if (r[f] !== undefined && r[f] !== "") rec[f] = Number(r[f]);
        }
        if (r.clip) rec.clip = r.clip;
        records.push(rec);
      }
      if (!records.length) { setErr("No valid rows (client names did not match)."); setBusy(false); return; }
      await base44.entities.ViewSnapshot.bulkCreate(records);
      setResult({ imported: records.length, skipped });
      setText("");
      onSaved();
    } catch (e) {
      setErr(e.message || "Import failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-tight">Bulk CSV Import</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[13px] text-muted-foreground mb-3">
          Columns: <code className="text-[12px]">client, date, platform, views, likes, comments, shares, clip</code>.
          Client is matched by name (case-insensitive) or id.
        </p>
        <div className="flex items-center gap-2 mb-3 text-[12px] text-muted-foreground">
          <FileSpreadsheet className="w-4 h-4" />
          <span>Platform values: {PLATFORMS.join(", ")}</span>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={8}
          placeholder={SAMPLE}
          className="w-full rounded-[12px] bg-background/60 border border-border px-3 py-2.5 text-[13px] font-mono outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        />
        {err && <p className="text-[13px] mt-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}
        {result && (
          <p className="text-[13px] mt-3" style={{ color: "#30D158" }}>
            Imported {result.imported} snapshots{result.skipped ? `, skipped ${result.skipped}` : ""}.
          </p>
        )}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium hover:bg-foreground/5">Close</button>
          <button
            onClick={importNow}
            disabled={busy}
            className="h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-1.5"
          >
            <Upload className="w-4 h-4" />
            {busy ? "Importing…" : "Import"}
          </button>
        </div>
      </div>
    </div>
  );
}