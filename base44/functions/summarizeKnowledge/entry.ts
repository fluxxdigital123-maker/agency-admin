import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { scope } = body || {};
    if (!scope) return Response.json({ error: "scope is required" }, { status: 400 });

    const entries = await base44.asServiceRole.entities.KnowledgeEntry.filter(
      { scope },
      "-timestamp",
      500
    );
    if (!entries || entries.length === 0) {
      return Response.json({ summary: "", count: 0 });
    }

    const list = entries
      .map((e, i) => `${i + 1}. INPUT: ${e.userInput}\n   PRINCIPLE: ${e.learnedPrinciple}`)
      .join("\n\n");

    const prompt = `You are reviewing the agency's learned knowledge base for ${scope}. Below are all recorded entries (user input + extracted principle). Produce a concise summary GROUPED BY TOPIC/THEME. Under each topic heading, bullet the principles. Preserve fidelity — do not add new advice. Where entries overlap, merge them under one topic.

ENTRIES:
${list}

Output as markdown.`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "automatic",
    });
    const summary =
      typeof result === "string"
        ? result
        : result?.response || result?.text || "";

    return Response.json({ summary, count: entries.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}