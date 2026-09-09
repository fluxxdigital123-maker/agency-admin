import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const PLATFORMS = ["YOUTUBE_SHORTS", "TIKTOK", "INSTAGRAM_REELS", "X", "LINKEDIN"];
const STATUSES = ["QUEUED", "EDITING", "REVIEW", "APPROVED", "POSTED"];

function ym(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function inMonth(dateStr, key) {
  return String(dateStr || "").slice(0, 7) === key;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { clientId } = body || {};
    if (!clientId) return Response.json({ error: "clientId is required" }, { status: 400 });

    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client) return Response.json({ error: "Client not found" }, { status: 404 });

    const now = new Date();
    const thisMonth = ym(now);
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonth = ym(prev);

    const [clips, snaps, progress] = await Promise.all([
      base44.asServiceRole.entities.Clip.filter({ client: clientId }, "-created_date", 1000),
      base44.asServiceRole.entities.ViewSnapshot.filter({ client: clientId }, "-date", 2000),
      base44.asServiceRole.entities.ClientProgress.filter({ client: clientId }, "-updatedAt", 50),
    ]);

    let viewsThisMonth = 0, viewsLastMonth = 0;
    let likesThis = 0, commentsThis = 0, sharesThis = 0;
    for (const s of snaps || []) {
      if (inMonth(s.date, thisMonth)) {
        viewsThisMonth += Number(s.views) || 0;
        likesThis += Number(s.likes) || 0;
        commentsThis += Number(s.comments) || 0;
        sharesThis += Number(s.shares) || 0;
      } else if (inMonth(s.date, lastMonth)) {
        viewsLastMonth += Number(s.views) || 0;
      }
    }

    const topClips = [...(clips || [])]
      .sort((a, b) => (Number(b.views) || 0) - (Number(a.views) || 0))
      .slice(0, 5)
      .map((c) => ({
        title: c.title || "Untitled",
        platform: c.platform || "—",
        views: Number(c.views) || 0,
        likes: Number(c.likes) || 0,
      }));

    const cadenceMap = {};
    for (const p of PLATFORMS) cadenceMap[p] = 0;
    for (const c of clips || []) {
      const d = c.postedDate || c.created_date;
      if (inMonth(d, thisMonth)) {
        const p = c.platform || "YOUTUBE_SHORTS";
        cadenceMap[p] = (cadenceMap[p] || 0) + 1;
      }
    }
    const cadence = PLATFORMS.filter((p) => cadenceMap[p] > 0).map((p) => ({ platform: p, count: cadenceMap[p] }));

    const statusMap = {};
    for (const s of STATUSES) statusMap[s] = 0;
    for (const c of clips || []) {
      const s = c.status || "QUEUED";
      statusMap[s] = (statusMap[s] || 0) + 1;
    }
    const throughput = STATUSES.map((s) => ({ status: s, count: statusMap[s] || 0 }));

    const stage = progress && progress[0] ? progress[0].stage : null;

    let branding = { name: "Agency Admin", logoUrl: "" };
    try {
      const rows = await base44.asServiceRole.entities.AppSetting.filter(
        { key: { $in: ["agency_name", "agency_logo_url"] } },
        "-created_date",
        10
      );
      const m = {};
      for (const r of rows || []) m[r.key] = r.value;
      if (m.agency_name) branding.name = m.agency_name;
      if (m.agency_logo_url) branding.logoUrl = m.agency_logo_url;
    } catch {
      /* ignore */
    }

    const metricsText =
      `Client: ${client.name}\n` +
      `Report month: ${thisMonth}\n` +
      `Views this month: ${viewsThisMonth}\n` +
      `Views last month: ${viewsLastMonth}\n` +
      `Engagement this month — likes: ${likesThis}, comments: ${commentsThis}, shares: ${sharesThis}\n` +
      `Top clips: ${topClips.map((c) => `${c.title} (${c.platform}, ${c.views} views)`).join("; ") || "none"}\n` +
      `Posting cadence this month: ${cadence.map((c) => `${c.platform}: ${c.count}`).join(", ") || "none"}\n` +
      `Pipeline throughput: ${throughput.map((t) => `${t.status}: ${t.count}`).join(", ")}\n` +
      `Current production stage: ${stage || "unknown"}\n` +
      `Channel summary: ${client.channelSummary || "N/A"}\n` +
      `Content style: ${client.contentStyle || "N/A"}`;

    const prompt = `You are a performance analyst for a content agency. Write a concise monthly client report in EXACTLY 3 paragraphs (plain text, no headings, no markdown, no bullet points):

Paragraph 1 — Performance recap: summarize this month's views vs last month, engagement, and the top-performing clips.
Paragraph 2 — Key insights: what's working, what's underperforming, and posting cadence observations.
Paragraph 3 — Next-month plan: concrete recommendations for content focus, posting cadence, and pipeline priorities.

Be specific and grounded strictly in the metrics below. Do not invent numbers. Separate the three paragraphs with a blank line.

${metricsText}`;

    let summary = "";
    try {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({ prompt });
      summary = typeof res === "string" ? res : res?.response || "";
    } catch (e) {
      summary = "AI summary unavailable.";
    }

    return Response.json({
      month: thisMonth,
      clientName: client.name,
      branding,
      viewsThisMonth,
      viewsLastMonth,
      engagement: { likes: likesThis, comments: commentsThis, shares: sharesThis },
      topClips,
      cadence,
      throughput,
      stage,
      summary,
      generatedAt: now.toISOString(),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}