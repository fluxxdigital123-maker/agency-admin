import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { fmtDate } from "@/lib/format";
import { buildClientReportPdf } from "@/lib/clientReportPdf";
import { FileText, Download, Loader2, Sparkles, ChevronDown, ChevronUp } from "lucide-react";

const MONTH_LABEL = (ymStr) => {
  if (!ymStr) return "—";
  const [y, m] = ymStr.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export default function ClientReports({ clientId }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState(null);

  async function load() {
    setLoading(true);
    try {
      const r = await base44.entities.Report.filter({ client: clientId }, "-createdAt", 100);
      setReports(r || []);
    } catch {
      setReports([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [clientId]);

  async function generate() {
    setGenerating(true);
    setError("");
    try {
      const res = await base44.functions.invoke("generateClientReport", { clientId });
      const data = res && res.data ? res.data : res;
      if (!data || data.error) throw new Error(data?.error || "Failed to build report data.");

      const blob = buildClientReportPdf(data);
      const file = new File([blob], `report-${data.month}.pdf`, { type: "application/pdf" });
      const up = await base44.integrations.Core.UploadFile({ file });
      const pdfUrl = up?.file_url || up?.data?.file_url || "";

      await base44.entities.Report.create({
        client: clientId,
        month: data.month,
        pdfUrl,
        summary: data.summary || "",
        createdAt: new Date().toISOString(),
      });
      await load();
    } catch (e) {
      setError(e.message || "Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-[18px] h-[18px] text-muted-foreground" />
          <h2 className="text-[20px] font-semibold tracking-tight">Reports</h2>
        </div>
        <button
          onClick={generate}
          disabled={generating}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-[10px] text-[14px] font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: "linear-gradient(135deg, #0A84FF, #BF5AF2)" }}
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {generating ? "Generating…" : "Generate Report"}
        </button>
      </div>

      {error && (
        <p className="text-[13px] mb-3" style={{ color: "#FF453A" }}>{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : reports.length === 0 ? (
        <p className="text-[14px] text-muted-foreground py-4">
          No reports yet. Click <span className="font-medium text-foreground">Generate Report</span> to build a downloadable
          monthly PDF with views, top clips, cadence, throughput, and an AI summary.
        </p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => {
            const isOpen = expanded === r.id;
            return (
              <div
                key={r.id}
                className="rounded-[12px] border"
                style={{ borderColor: "var(--border)", background: "rgba(255,255,255,0.02)" }}
              >
                <div className="flex items-center justify-between gap-3 px-4 py-3">
                  <button
                    onClick={() => setExpanded(isOpen ? null : r.id)}
                    className="flex items-center gap-2 min-w-0 text-left flex-1"
                  >
                    {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />}
                    <div className="min-w-0">
                      <div className="text-[15px] font-medium truncate">{MONTH_LABEL(r.month)}</div>
                      <div className="text-[12px] text-muted-foreground">{fmtDate(r.createdAt)}</div>
                    </div>
                  </button>
                  {r.pdfUrl ? (
                    <a
                      href={r.pdfUrl}
                      download={`report-${r.month}.pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[8px] text-[13px] font-medium border hover:bg-foreground/5 transition-colors shrink-0"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Download className="w-3.5 h-3.5" /> PDF
                    </a>
                  ) : (
                    <span className="text-[12px] text-muted-foreground shrink-0">no file</span>
                  )}
                </div>
                {isOpen && r.summary && (
                  <div className="px-4 pb-4 -mt-1">
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground whitespace-pre-wrap">{r.summary}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}