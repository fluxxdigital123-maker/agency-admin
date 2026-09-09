import React, { useState } from "react";
import { jsPDF } from "jspdf";
import { Download, Loader2, FileText } from "lucide-react";

const AGREEMENT_LINES = [
  "",
  "This Client Services Agreement (the \"Agreement\") is entered into as of [START DATE],",
  "by and between [AGENCY NAME] (\"Agency\") and [CLIENT NAME] (\"Client\").",
  "",
  "1. SERVICES",
  "Agency will provide content production, channel management, and growth services for the",
  "Client's YouTube channel located at [CHANNEL URL].",
  "",
  "2. FEES",
  "Setup Fee: [SETUP FEE] (one-time, due on signing).",
  "Monthly Recurring: [MONTHLY FEE] (due on the 1st of each month).",
  "",
  "3. TERM",
  "This Agreement begins on [START DATE] and continues month-to-month until either party",
  "terminates with 14 days' written notice.",
  "",
  "4. 30-DAY VIEWS GUARANTEE",
  "Agency guarantees that the Client's channel will see an increase in views within the first",
  "30 days of the Agreement. If no views increase is achieved within that period, Agency will",
  "issue a full refund of the Setup Fee to the Client.",
  "",
  "5. CONTENT OWNERSHIP",
  "All content produced for the Client remains the property of the Client upon full payment of",
  "all owed fees. Agency may use completed work for portfolio purposes.",
  "",
  "6. CONFIDENTIALITY",
  "Both parties agree to keep confidential any proprietary information shared during the course",
  "of this engagement.",
  "",
  "7. GOVERNING LAW",
  "This Agreement is governed by the laws of the applicable jurisdiction.",
  "",
  "",
  "Agency: __________________________     Date: ____________",
  "",
  "Client: __________________________     Date: ____________",
];

export default function AgreementDownload() {
  const [busy, setBusy] = useState(false);

  function download() {
    if (busy) return;
    setBusy(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "letter" });
      const margin = 56;
      const maxW = doc.internal.pageSize.getWidth() - margin * 2;
      const pageH = doc.internal.pageSize.getHeight();
      let y = margin;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("Client Services Agreement", margin, y);
      y += 24;
      doc.setDrawColor(200);
      doc.line(margin, y, margin + maxW, y);
      y += 20;

      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      const lineHeight = 15;
      for (const line of AGREEMENT_LINES) {
        const wrapped = doc.splitTextToSize(line, maxW);
        for (const w of wrapped) {
          if (y > pageH - margin) {
            doc.addPage();
            y = margin;
          }
          doc.text(w, margin, y);
          y += lineHeight;
        }
      }

      doc.save("client-agreement.pdf");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="glass-card p-6 flex flex-col sm:flex-row sm:items-center gap-4">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(10,132,255,0.14)", border: "0.5px solid rgba(10,132,255,0.25)" }}
      >
        <FileText className="w-5 h-5" style={{ color: "#0A84FF" }} />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-[16px] font-semibold tracking-tight">Client Agreement</h3>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          A ready-to-sign PDF including the 30-day views guarantee and fee placeholders.
        </p>
      </div>
      <button
        onClick={download}
        disabled={busy}
        className="h-10 px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 shrink-0 disabled:opacity-50"
        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
      >
        {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
        Download agreement
      </button>
    </div>
  );
}