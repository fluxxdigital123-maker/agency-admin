import { jsPDF } from "jspdf";

const C = {
  bg: [10, 10, 12],
  panel: [21, 21, 26],
  primary: [10, 132, 255],
  green: [48, 209, 88],
  red: [255, 69, 58],
  orange: [255, 159, 10],
  gray: [142, 142, 147],
  text: [235, 235, 240],
  muted: [150, 150, 160],
};

const STATUS_COLOR = {
  DRAFT: C.gray,
  SENT: C.primary,
  PAID: C.green,
  OVERDUE: C.red,
};

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const fmtDate = (s) => {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return String(s);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

export function buildInvoicePdf({ invoice, client, branding }) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  const contentW = W - M * 2;

  doc.setFillColor(C.bg[0], C.bg[1], C.bg[2]);
  doc.rect(0, 0, W, H, "F");

  let y = M;

  // Brand header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(branding?.name || "Agency Admin", M, y + 4);
  doc.setDrawColor(C.primary[0], C.primary[1], C.primary[2]);
  doc.setLineWidth(2.5);
  doc.line(M, y + 12, M + 46, y + 12);
  y += 30;

  // Title + status
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text("INVOICE", M, y + 6);
  const status = invoice.status || "DRAFT";
  const sc = STATUS_COLOR[status] || C.gray;
  const sw = 70;
  doc.setFillColor(sc[0], sc[1], sc[2]);
  doc.roundedRect(M + contentW - sw, y - 8, sw, 22, 11, 11, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(status, M + contentW - sw / 2, y + 7, { align: "center" });
  y += 30;

  // Meta panel
  doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
  doc.roundedRect(M, y, contentW, 70, 10, 10, "F");
  doc.setFontSize(9);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.setFont("helvetica", "normal");
  doc.text("BILL TO", M + 16, y + 20);
  doc.text("INVOICE #", M + 16, y + 44);
  doc.text("ISSUE DATE", M + contentW / 2, y + 20);
  doc.text("DUE DATE", M + contentW / 2, y + 44);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(C.text[0], C.text[1], C.text[2]);
  doc.text(client?.name || "—", M + 16, y + 32);
  doc.text(invoice.invoiceNumber || "—", M + 16, y + 56);
  doc.text(fmtDate(invoice.issueDate), M + contentW / 2, y + 32);
  doc.text(fmtDate(invoice.dueDate), M + contentW / 2, y + 56);
  y += 86;

  // Line items header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text("DESCRIPTION", M, y);
  doc.text("AMOUNT", W - M, y, { align: "right" });
  y += 8;
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.5);
  doc.setGState(doc.GState({ opacity: 0.12 }));
  doc.line(M, y, M + contentW, y);
  doc.setGState(doc.GState({ opacity: 1 }));
  y += 14;

  // Line items (split by newline)
  const lines = String(invoice.lineItems || "").split(/\n/).filter(Boolean);
  const items = lines.length ? lines : ["Monthly content management & production services"];
  items.forEach((li, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
      doc.rect(M, y - 10, contentW, 24, "F");
    }
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10.5);
    doc.setTextColor(C.text[0], C.text[1], C.text[2]);
    const wrapped = doc.splitTextToSize(li, contentW - 140)[0] || "";
    doc.text(wrapped, M + 8, y + 4);
    doc.text(fmtMoney(invoice.amount), W - M - 8, y + 4, { align: "right" });
    y += 24;
  });
  y += 10;

  // Total
  doc.setFillColor(C.panel[0], C.panel[1], C.panel[2]);
  doc.roundedRect(M, y, contentW, 44, 8, 8, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  doc.text("AMOUNT DUE", M + 16, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(C.primary[0], C.primary[1], C.primary[2]);
  doc.text(fmtMoney(invoice.amount), W - M - 16, y + 26, { align: "right" });
  y += 70;

  // Footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(C.muted[0], C.muted[1], C.muted[2]);
  const footer = doc.splitTextToSize("Thank you for your partnership. Please remit payment by the due date above.", contentW);
  doc.text(footer[0] || "", M, y);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString("en-US")}`, M, H - 24);

  return doc.output("blob");
}