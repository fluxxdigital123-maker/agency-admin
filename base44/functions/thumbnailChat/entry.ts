import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration.";

const SYSTEM_PROMPT = `You are an expert thumbnail designer and YouTube creative strategist specializing in high-CTR thumbnails for personal-brand creators. Given a video topic or request, you concisely explain the creative direction: the core visual concept, composition, subject expression, color palette, and text hierarchy — and WHY it will earn clicks. You build on prior ideas in this session. When the user asks to refine ("make the background darker"), reference what you proposed before and explain the adjusted direction. Keep it tight and actionable. ${VIDEO_LENGTH_RULE}`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { sessionId, userMessage, clientId } = body || {};
    if (!sessionId || !userMessage) {
      return Response.json({ error: "sessionId and userMessage are required" }, { status: 400 });
    }

    const history = await base44.asServiceRole.entities.ThumbnailMessage.filter(
      { session: sessionId },
      "timestamp",
      200
    );

    let knowledgeBlock = "";
    try {
      const knowledge = await base44.asServiceRole.entities.KnowledgeEntry.filter(
        { scope: "THUMBNAIL_GLOBAL" },
        "-timestamp",
        50
      );
      if (knowledge && knowledge.length) {
        knowledgeBlock =
          "\n\n=== Global thumbnail knowledge (principles learned across all clients) ===\n" +
          knowledge.map((k) => `- ${k.userInput} → ${k.learnedPrinciple}`).join("\n");
      }
    } catch {
      /* KnowledgeEntry may not exist yet */
    }

    let clientBlock = "";
    if (clientId) {
      try {
        const client = await base44.asServiceRole.entities.Client.get(clientId);
        if (client) {
          clientBlock =
            `\n\n=== Tagged client context ===\nName: ${client.name}\nChannel: ${client.channelUrl || "N/A"}\nContent Style: ${client.contentStyle || "N/A"}\nOffers: ${client.offers || "N/A"}`;
        }
      } catch {
        /* ignore */
      }
    }

    const historyText =
      history && history.length
        ? "\n\n=== Conversation so far ===\n" +
          history.map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`).join("\n\n")
        : "";

    const prompt = `${SYSTEM_PROMPT}${knowledgeBlock}${clientBlock}${historyText}\n\n=== Respond to this message ===\nUser: ${userMessage}\n\nAssistant:`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "automatic",
    });

    const responseText =
      typeof result === "string"
        ? result
        : result?.response || result?.text || result?.output || JSON.stringify(result);

    return Response.json({ response: responseText });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}