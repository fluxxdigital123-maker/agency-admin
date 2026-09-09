import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration (>=4 min = long-form, <4 min = short-form).";

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    channelName: { type: "string" },
    channelSummary: { type: "string" },
    contentStyle: { type: "string" },
    offers: { type: "string" },
    contentStrategy: {
      type: "array",
      items: {
        type: "object",
        properties: {
          change: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["change", "reasoning"],
      },
    },
    growthOpportunities: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: [
    "channelName",
    "channelSummary",
    "contentStyle",
    "offers",
    "contentStrategy",
    "growthOpportunities",
  ],
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const channelUrl = (body && body.channelUrl || "").trim();
    if (!channelUrl) {
      return Response.json({ error: "channelUrl is required" }, { status: 400 });
    }

    const prompt = `You are a senior YouTube content strategist analyzing a YouTube channel for a content agency that builds in-house content teams for personal-brand entrepreneurs.

Analyze the YouTube channel at this URL: ${channelUrl}

Use live web search to look at the channel's actual uploads, titles, thumbnails, descriptions, and about page. ${VIDEO_LENGTH_RULE}

Return a structured analysis:
- channelName: the channel's display name.
- channelSummary: 2-3 sentences on who the creator is, their niche, audience, and current content mix (distinguish long-form vs short-form by the duration rule above).
- contentStyle: a concise description of their current content style, pacing, formatting, and thumbnail approach.
- offers: the products, services, coaching, or businesses the creator appears to sell or promote (infer from links/descriptions; "Unknown" if not evident).
- contentStrategy: an array of 3-6 concrete recommendations. Each has:
    - change: ONE sentence stating what to change and to what (e.g. "Shift title structure from clickbait questions to specific outcome-driven claims").
    - reasoning: a fuller paragraph explaining why, grounded in what you observed.
- growthOpportunities: an array of 3-5 short opportunity strings (untapped formats, collabs, funnels, retention fixes).

Be specific and grounded in observed data. If the channel cannot be found, still return the object with empty strings/arrays and note it in channelSummary.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: "gemini_3_flash",
      response_json_schema: RESPONSE_SCHEMA,
    });

    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}