import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration (>=4 min = long-form, <4 min = short-form).";

const SYSTEM_PROMPT = `You are an expert content strategist specializing in personal-brand growth on YouTube and social media. You help ideate video titles, thumbnail concepts, content angles, hooks, and growth strategies. You remember everything in this thread and build on previous insights. When given a YouTube URL, analyze its content strategy and extract learnings.

${VIDEO_LENGTH_RULE}`;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { threadId, userMessage, clientId } = body || {};
    if (!threadId || !userMessage) {
      return Response.json({ error: "threadId and userMessage are required" }, { status: 400 });
    }

    // 1. Full thread history
    const history = await base44.asServiceRole.entities.IdeationMessage.filter(
      { thread: threadId },
      "timestamp",
      200
    );

    // 2. Global VIDEO knowledge (Settings will populate these later)
    let knowledgeBlock = "";
    try {
      const knowledge = await base44.asServiceRole.entities.KnowledgeEntry.filter(
        { scope: "VIDEO_GLOBAL" },
        "-timestamp",
        50
      );
      if (knowledge && knowledge.length) {
        knowledgeBlock =
          "\n\n=== Global video knowledge (principles learned across all clients) ===\n" +
          knowledge
            .map((k) => `- Input: ${k.userInput} → Learned principle: ${k.learnedPrinciple}`)
            .join("\n");
      }
    } catch {
      /* KnowledgeEntry may not exist yet — ignore */
    }

    // 3. Tagged client context
    let clientBlock = "";
    if (clientId) {
      try {
        const client = await base44.asServiceRole.entities.Client.get(clientId);
        if (client) {
          clientBlock =
            `\n\n=== Tagged client context ===\n` +
            `Name: ${client.name}\n` +
            `Channel: ${client.channelUrl || "N/A"}\n` +
            `Content Strategy: ${client.contentStrategy || "N/A"}\n` +
            `Content Style: ${client.contentStyle || "N/A"}\n` +
            `Offers: ${client.offers || "N/A"}\n` +
            `Growth Opportunities: ${client.growthOpportunities || "N/A"}`;
        }
      } catch {
        /* client lookup failed — continue without */
      }
    }

    const historyText =
      history && history.length
        ? "\n\n=== Conversation so far ===\n" +
          history
            .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
            .join("\n\n")
        : "";

    const prompt = `${SYSTEM_PROMPT}${knowledgeBlock}${clientBlock}${historyText}\n\n=== Respond to this message ===\nUser: ${userMessage}\n\nAssistant:`;

    // Persist the user message BEFORE the LLM call so it survives a failure
    await base44.asServiceRole.entities.IdeationMessage.create({
      thread: threadId,
      role: "user",
      content: userMessage,
      timestamp: new Date().toISOString(),
    });

    const hasYouTubeUrl = /youtube\.com|youtu\.be/i.test(userMessage);

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: hasYouTubeUrl,
      model: "automatic",
    });

    const responseText =
      typeof result === "string"
        ? result
        : result?.response || result?.text || result?.output || JSON.stringify(result);

    const assistantMsg = await base44.asServiceRole.entities.IdeationMessage.create({
      thread: threadId,
      role: "assistant",
      content: responseText,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ response: responseText, messageId: assistantMsg?.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}