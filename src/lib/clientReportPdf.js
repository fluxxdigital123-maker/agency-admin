import { jsPDF } from "jspdf";

const C = {
  bg: [10, 10, 12],
  panel: [21, 21, 26],
  primary: [10, 132, 255],
  green: [48, 209, 88],
  red: [255, 69, 58],
  orange: [255, 159, 10],
  purple: [191, 90, 242],
  text: [235, 235, 240],
  muted: [150, 150, 160],
};

const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YT Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "IG Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

const STATUS_LABEL = {
  QUEUED: "Queued",
  EDITING: "Editing",
  REVIEW: "Review",
  APPROVED: "Approved",
  POSTED: "Posted",
};
const STATUS_COLOR = {
  QUEUED: C.muted,
  EDITING: C.primary,
  REVIEW: C.orange,
  APPROVED: C.green,
  POSTED: C.purple,
};

const fmt = (n) => Number(n || 0).toLocaleString("en-US");
const monthLabel = (ymStr) => {
  if (!ymStr) return "—";
  const [y, m] = ymStr.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" });
};

export function buildClientReportPdf(data) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  const contentW = W - M * 2;
  let y = M;

  const paintPage = () => {
    doc.setFillColor(C.bg[0], C.bg[1], C.bg[2]);
    doc.rect(0, 0, W, H, "F");
  };

  const ensure = (space) => {
    if (y + space > H - M) {
      doc.addPage();
      paintPage();
      y = M;
    }
  };

  const heading = (text) => {
    ensure(34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(C.primary[0], C.primary[1], C.primary[2]);
    doc.text(text.toUpperCase(), M, y + 2);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(0.5);
    doc.setGState(doc.GState({ opacity: 0.12 }));
    doc.line(M, y + 9, M + contentW, y + 9);
    doc.setGState(doc.GState({ opacity: 1 }));
    y += 22;
  };

  const para = (text, size = 10) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    const lines = doc.splitTextToSize(text, contentW);
    for (const ln of lines) {
      ensure(16);
      doc.text(ln, M, y + 4);
      y += size + 4;
    }
    y += 6;
  };

  paintPage();

  // Header / brand
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(data.branding?.name || "Agency Admin", M, y + 6);
  doc.setDrawColor(C.primary[0], C.primary[1], C.primary[2]);
  doc.setLineWidth(2.5);
  doc.line(M, y + 14, M + 46, y + 14);
  y += 30;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(`${data.clientName} — Monthly Report`, M, y + 4);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text(monthLabel(data.month), M, y + 2);
  y += 20;

  // Performance summary — stat panels
  heading("Performance Summary");
  const delta = data.viewsLastMonth > 0
    ? Math.round(((data.viewsThisMonth - data.viewsLastMonth) / data.viewsLastMonth) * 100)
    : null;
  const panels = [
    { label: "VIEWS THIS MONTH", value: fmt(data.viewsThisMonth), color: C.text },
    { label: "VIEWS LAST MONTH", value: fmt(data.viewsLastMonth), color: C.text },
    { label: "MONTH-OVER-MONTH", value: delta == null ? "—" : `${delta >= 0 ? "+" : ""}${delta}%`, color: delta == null ? C.muted : delta >= 0 ? C.green : C.red },
  ];
  const gap = 10;
  const pw = (contentW - gap * 2) / 3;
  const ph = 52;
  ensure(ph + 8);
  panels.forEach((p, i) => {
    const px = M + i * (pw + gap);
    doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
    doc.roundedRect(px, y, pw, ph, 8, 8, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text(p.label, px + 12, y + 16);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(p.color[0], p.color[1], p.color[2]);
    doc.text(p.value, px + 12, y + 38);
  });
  y += ph + 14;
  const e = data.engagement || {};
  para(`Engagement this month — likes ${fmt(e.likes)}, comments ${fmt(e.comments)}, shares ${fmt(e.shares)}.`, 9.5);

  // AI summary
  heading("AI Summary");
  const paragraphs = (data.summary || "—").split(/\n\s*\n/).filter(Boolean);
  if (paragraphs.length === 0) para(String(data.summary || "—"), 10);
  else paragraphs.forEach((p) => para(p.trim(), 10));

  // Top clips
  heading("Top 5 Clips");
  ensure(20);
  const cols = { title: contentW - 150, platform: 90, views: 60 };
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text("CLIP", M, y + 2);
  doc.text("PLATFORM", M + cols.title, y + 2);
  doc.text("VIEWS", W - M, y + 2, { align: "right" });
  y += 10;
  if (!data.topClips || data.topClips.length === 0) {
    para("No clips recorded yet.", 9.5);
  } else {
    data.topClips.forEach((c, i) => {
      ensure(20);
      if (i % 2 === 0) {
        doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
        doc.rect(M, y - 2, contentW, 18, "F");
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      const t = doc.splitTextToSize(c.title || "Untitled", cols.title - 14)[0] || "";
      doc.text(t, M + 8, y + 10);
      doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
      doc.text(PLATFORM_LABEL[c.platform] || c.platform || "—", M + cols.title, y + 10);
      doc.setTextColor(C.text[0], C.text[1], C.text[2]);
      doc.text(fmt(c.views), W - M - 8, y + 10, { align: "right" });
      y += 18;
    });
  }
  y += 8;

  // Cadence
  heading("Posting Cadence (this month)");
  if (!data.cadence || data.cadence.length === 0) {
    para("No posts logged this month.", 9.5);
  } else {
    para(data.cadence.map((c) => `${PLATFORM_LABEL[c.platform] || c.platform}: ${c.count}`).join("   ·   "), 10);
  }

  // Throughput
  heading("Pipeline Throughput");
  ensure(24);
  const items = data.throughput || [];
  items.forEach((t, i) => {
    ensure(18);
    const col = STATUS_COLOR[t.status] || C.muted;
    const ix = M + 8;
    doc.setFillColor(col[0], col[1], col[2]);
    doc.roundedRect(ix, y + 2, 8, 8, 2, 2, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    doc.text(STATUS_LABEL[t.status] || t.status, ix + 16, y + 9);
    doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
    doc.text(String(t.count), W - M - 8, y + 9, { align: "right" });
    y += 16;
  });
  y += 6;

  if (data.stage) para(`Current production stage: ${data.stage.replace(/_/g, " ").toLowerCase()}.`, 9);

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text(
    `Generated ${new Date(data.generatedAt || Date.now()).toLocaleString("en-US")}`,
    M,
    H - 22
  );

  return doc.output("blob");
}