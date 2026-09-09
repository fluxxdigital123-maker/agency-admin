import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const SCOPES = {
  THUMBNAIL_GLOBAL: "thumbnail design (high-CTR YouTube thumbnails)",
  VIDEO_GLOBAL: "video & ideation (titles, hooks, content strategy, growth)",
};

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { scope, userInput } = body || {};
    if (!scope || !SCOPES[scope]) {
      return Response.json({ error: "Invalid scope" }, { status: 400 });
    }
    if (!userInput || !userInput.trim()) {
      return Response.json({ error: "userInput is required" }, { status: 400 });
    }

    const prompt = `You are a learning system for a content agency. A team member is training you on ${SCOPES[scope]} by pasting examples, principles, guidelines, or reference material.

Read the following input carefully and:
1. Confirm you understood it (one short sentence).
2. Restate the extracted principle(s) concisely and faithfully — as a reusable rule the agency should follow. Do not invent anything not supported by the input. If the input is long, distill it to the key principles.

INPUT:
"""
${userInput}
"""

Respond strictly as JSON: {"learnedPrinciple": "..."}.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "automatic",
      response_json_schema: {
        type: "object",
        properties: { learnedPrinciple: { type: "string" } },
        required: ["learnedPrinciple"],
      },
    });

    const learnedPrinciple =
      result && result.learnedPrinciple
        ? result.learnedPrinciple
        : typeof result === "string"
        ? result
        : "Principle recorded.";

    const entry = await base44.asServiceRole.entities.KnowledgeEntry.create({
      scope,
      userInput,
      learnedPrinciple,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ learnedPrinciple, id: entry?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}