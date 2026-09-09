import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const PLATFORMS = ["YOUTUBE_SHORTS", "TIKTOK", "INSTAGRAM_REELS", "X", "LINKEDIN"];

const SCHEMA = {
  type: "object",
  properties: {
    hooks: {
      type: "array",
      items: { type: "string" },
    },
    captions: {
      type: "object",
      properties: {
        YOUTUBE_SHORTS: { type: "array", items: { type: "string" } },
        TIKTOK: { type: "array", items: { type: "string" } },
        INSTAGRAM_REELS: { type: "array", items: { type: "string" } },
        X: { type: "array", items: { type: "string" } },
        LINKEDIN: { type: "array", items: { type: "string" } },
      },
      required: PLATFORMS,
    },
  },
  required: ["hooks", "captions"],
};

function knowledgeBlock(rows, heading) {
  if (!rows || rows.length === 0) return "";
  return `\n\n=== ${heading} ===\n` + rows.map((k) => `- ${k.learnedPrinciple || k.userInput}`).join("\n");
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { clipId } = body || {};
    if (!clipId) return Response.json({ error: "clipId is required" }, { status: 400 });

    const clip = await base44.asServiceRole.entities.Clip.get(clipId);
    if (!clip) return Response.json({ error: "Clip not found" }, { status: 404 });
    if (!clip.title) return Response.json({ error: "Clip has no title." }, { status: 400 });

    const clientId = clip.client;
    let client = null;
    if (clientId) {
      try {
        client = await base44.asServiceRole.entities.Client.get(clientId);
      } catch {
        /* ignore */
      }
    }

    // Global video knowledge
    let globalBlock = "";
    try {
      const g = await base44.asServiceRole.entities.KnowledgeEntry.filter(
        { scope: "VIDEO_GLOBAL" },
        "-timestamp",
        50
      );
      globalBlock = knowledgeBlock(g, "Global video knowledge (principles learned across all clients)");
    } catch {
      /* ignore */
    }

    // This client's learned hook/caption preferences
    let clientBlock = "";
    if (clientId) {
      try {
        const c = await base44.asServiceRole.entities.KnowledgeEntry.filter(
          { scope: "CLIENT_IDEAS", client: clientId },
          "-timestamp",
          50
        );
        clientBlock = knowledgeBlock(c, "This client's previously-used hooks/captions (preferred style — favor these patterns)");
      } catch {
        /* ignore */
      }
    }

    const clientCtx = client
      ? `Client: ${client.name}\nNiche/Summary: ${client.channelSummary || "N/A"}\nContent Style: ${client.contentStyle || "N/A"}\nOffers: ${client.offers || "N/A"}`
      : "Client: N/A";

    const prompt = `You are a short-form content strategist for a content agency. Generate hooks and captions for a single clip.

CLIP:
- Title: ${clip.title}
- Platform: ${clip.platform}
- Source video: ${clip.sourceVideoUrl || "N/A"}

${clientCtx}${globalBlock}${clientBlock}

Use live web search to understand the source video's actual topic (if a URL is provided) so hooks and captions are grounded in the real content. If no URL, rely on the title.

Produce:
1. EXACTLY 5 distinct hook lines — punchy, scroll-stopping opening lines a creator could speak to camera. Vary the angle (curiosity, bold claim, question, contrarian, story tease).
2. EXACTLY 3 caption variants PER platform (YouTube Shorts, TikTok, Instagram Reels, X, LinkedIn) — each tailored to that platform's tone, length norms, and hashtag conventions.

Apply the client's previously-used hooks/captions above as a style signal — lean toward what has worked for them, avoid repeating verbatim.

Return JSON: { "hooks": ["...","...","...","...","..."], "captions": { "YOUTUBE_SHORTS": ["...","...","..."], "TIKTOK": [...], "INSTAGRAM_REELS": [...], "X": [...], "LINKEDIN": [...] } } — 5 hooks, 3 captions per platform.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: SCHEMA,
    });

    const hooks = Array.isArray(result?.hooks) ? result.hooks.slice(0, 5) : [];
    const captions = {};
    for (const p of PLATFORMS) {
      captions[p] = Array.isArray(result?.captions?.[p]) ? result.captions[p].slice(0, 3) : [];
    }

    return Response.json({ hooks, captions });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}