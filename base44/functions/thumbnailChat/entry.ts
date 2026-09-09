import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration (>=4 min = long-form, <4 min = short-form).";

const SYSTEM_PROMPT = `You are an expert thumbnail designer and YouTube creative strategist specializing in high-CTR thumbnails for personal-brand creators. Given a video topic or request, you do TWO things:

1. DIRECTION: Concisely explain your creative direction — the core visual concept, composition, subject expression, color palette, and text hierarchy — and WHY it will earn clicks. Build on prior ideas in this session. When the user asks to refine ("make the background darker"), reference what you proposed before and explain the adjusted direction.

2. IMAGE PROMPT: Produce an OPTIMIZED nano-banana-pro image-generation prompt that will be fed directly to a text-to-image model. The prompt MUST target: 16:9 aspect ratio, 4K resolution, bold subject that stays readable at small sizes, high contrast, emotionally compelling, no extra border. Write it as a single vivid, descriptive paragraph — no markdown, no preface, no quotes.

${VIDEO_LENGTH_RULE}

Respond strictly as JSON: {"direction": "...", "imagePrompt": "..."}.`;

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
      /* ignore */
    }

    let clientBlock = "";
    if (clientId) {
      try {
        const client = await base44.asServiceRole.entities.Client.get(clientId);
        if (client) {
          clientBlock =
            `\n\n=== Tagged client context ===\n` +
            `Name: ${client.name}\n` +
            `Content Style: ${client.contentStyle || "N/A"}\n` +
            `Offers: ${client.offers || "N/A"}`;
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

    const prompt = `${SYSTEM_PROMPT}${knowledgeBlock}${clientBlock}${historyText}\n\n=== Respond to this message ===\nUser: ${userMessage}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      model: "automatic",
      response_json_schema: {
        type: "object",
        properties: {
          direction: { type: "string" },
          imagePrompt: { type: "string" },
        },
        required: ["direction", "imagePrompt"],
      },
    });

    const direction = result?.direction || "";
    const imagePrompt = result?.imagePrompt || userMessage;

    return Response.json({ response: direction, imagePrompt });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}