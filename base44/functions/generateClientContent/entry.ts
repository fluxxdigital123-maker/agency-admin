import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration (>=4 min = long-form, <4 min = short-form).";

const TITLES_SCHEMA = {
  type: "object",
  properties: {
    videos: {
      type: "array",
      items: {
        type: "object",
        properties: {
          originalTitle: { type: "string" },
          videoUrl: { type: "string" },
          alternatives: { type: "array", items: { type: "string" } },
        },
        required: ["originalTitle", "videoUrl", "alternatives"],
      },
    },
  },
  required: ["videos"],
};

const IDEAS_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          angle: { type: "string" },
          hook: { type: "string" },
        },
        required: ["title", "angle", "hook"],
      },
    },
  },
  required: ["ideas"],
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
    const { clientId, type } = body || {};
    if (!clientId) return Response.json({ error: "clientId is required" }, { status: 400 });
    if (type !== "TITLES" && type !== "IDEAS") {
      return Response.json({ error: "type must be TITLES or IDEAS" }, { status: 400 });
    }

    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client) return Response.json({ error: "Client not found" }, { status: 404 });
    if (!client.channelUrl) {
      return Response.json({ error: "This client has no channel URL to analyze." }, { status: 400 });
    }

    // Global VIDEO knowledge (applies to every client)
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

    // This client's own learned feedback for the relevant scope
    const clientScope = type === "TITLES" ? "CLIENT_TITLES" : "CLIENT_IDEAS";
    let clientBlock = "";
    try {
      const c = await base44.asServiceRole.entities.KnowledgeEntry.filter(
        { scope: clientScope, client: clientId },
        "-timestamp",
        50
      );
      clientBlock = knowledgeBlock(c, `This client's feedback/learnings (${clientScope})`);
    } catch {
      /* ignore */
    }

    const clientCtx =
      `Client: ${client.name}\n` +
      `Channel: ${client.channelUrl}\n` +
      `Niche/Summary: ${client.channelSummary || "N/A"}\n` +
      `Content Style: ${client.contentStyle || "N/A"}\n` +
      `Offers: ${client.offers || "N/A"}\n` +
      `Content Strategy: ${client.contentStrategy || "N/A"}\n` +
      `Growth Opportunities: ${client.growthOpportunities || "N/A"}`;

    let prompt, schema, field, tsField;
    if (type === "TITLES") {
      prompt = `You are a YouTube title strategist for a content agency. ${VIDEO_LENGTH_RULE}

${clientCtx}${globalBlock}${clientBlock}

Use live web search to find this channel's uploads page and identify the 5 MOST RECENT LONG-FORM uploads (each >= 4 minutes; ignore any video under 4 minutes and ignore Shorts). For EACH of those 5 videos, generate exactly 3 ALTERNATIVE titles that would plausibly increase click-through while staying truthful to the video's actual topic. Apply any client feedback/learnings above when crafting the alternatives.

Return JSON: { "videos": [ { "originalTitle": "...", "videoUrl": "...", "alternatives": ["...", "...", "..."] } ] } — up to 5 video objects, each with exactly 3 alternatives. If fewer than 5 long-form videos exist, include as many as you find.`;
      schema = TITLES_SCHEMA;
      field = "suggestedTitles";
      tsField = "suggestedTitlesAt";
    } else {
      prompt = `You are a YouTube content strategist for a content agency. ${VIDEO_LENGTH_RULE}

${clientCtx}${globalBlock}${clientBlock}

Use live web search to ground yourself in this channel's actual content and audience. Propose 8 FRESH LONG-FORM video ideas (each intended to be >= 4 minutes) tailored to this creator's niche, style, offers, and growth opportunities. Avoid repeating topics they've already published. Apply any client feedback/learnings above.

Return JSON: { "ideas": [ { "title": "...", "angle": "one sentence on the content angle/approach", "hook": "the opening hook" } ] } — exactly 8 ideas.`;
      schema = IDEAS_SCHEMA;
      field = "suggestedIdeas";
      tsField = "suggestedIdeasAt";
    }

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: schema,
    });

    const items = type === "TITLES" ? (result?.videos || []) : (result?.ideas || []);
    const nowIso = new Date().toISOString();

    await base44.asServiceRole.entities.Client.update(clientId, {
      [field]: JSON.stringify(items),
      [tsField]: nowIso,
    });

    return Response.json({ items, updatedAt: nowIso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}