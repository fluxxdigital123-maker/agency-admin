import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const HF_ENDPOINT = "https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard";

/**
 * Generates a thumbnail image via the Higgsfield API (Soul v2 / nano-banana-pro,
 * 16:9, 4K). Uses the stored HIGGSFIELD_API_KEY / HIGGSFIELD_API_SECRET. When the
 * key is absent the function returns { configured: false } so the frontend can
 * render the "connect your API key" degraded state while the chat stays usable.
 */
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const HF_KEY = process.env.HIGGSFIELD_API_KEY;
    const HF_SECRET = process.env.HIGGSFIELD_API_SECRET;
    if (!HF_KEY || !HF_SECRET) {
      return Response.json({ configured: false });
    }

    const body = await req.json().catch(() => ({}));
    const { prompt, sessionId, clientId } = body || {};
    if (!prompt) {
      return Response.json({ configured: true, error: "prompt is required" }, { status: 400 });
    }

    // Build context: global thumbnail principles + client style + recent session direction
    let knowledgeBlock = "";
    try {
      const knowledge = await base44.asServiceRole.entities.KnowledgeEntry.filter(
        { scope: "THUMBNAIL_GLOBAL" },
        "-timestamp",
        30
      );
      if (knowledge && knowledge.length) {
        knowledgeBlock =
          " Learned thumbnail principles: " +
          knowledge.map((k) => k.learnedPrinciple).join("; ");
      }
    } catch {
      /* ignore */
    }

    let clientBlock = "";
    if (clientId) {
      try {
        const client = await base44.asServiceRole.entities.Client.get(clientId);
        if (client) {
          clientBlock = ` Creator brand: ${client.name}. Content style: ${client.contentStyle || "N/A"}.`;
        }
      } catch {
        /* ignore */
      }
    }

    let historyBlock = "";
    if (sessionId) {
      try {
        const history = await base44.asServiceRole.entities.ThumbnailMessage.filter(
          { session: sessionId },
          "timestamp",
          12
        );
        const userDirs = (history || []).filter((m) => m.role === "user").map((m) => m.content);
        if (userDirs.length) {
          historyBlock = " Recent direction in this session: " + userDirs.join(" | ");
        }
      } catch {
        /* ignore */
      }
    }

    const imagePrompt =
      `YouTube thumbnail, 16:9, 4K, high-contrast, bold centered subject, dramatic lighting, readable at small size, no extra border. Subject: ${prompt}.${clientBlock}${knowledgeBlock}${historyBlock}`;

    const authHeader = `Key ${HF_KEY}:${HF_SECRET}`;

    // 1. Submit the generation
    const submitRes = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt: imagePrompt,
        aspect_ratio: "16:9",
        resolution: "4k",
      }),
    });

    if (!submitRes.ok) {
      const errText = await submitRes.text();
      return Response.json(
        { configured: true, error: `Higgsfield submit failed (${submitRes.status}): ${errText}` },
        { status: 502 }
      );
    }

    const submitData = await submitRes.json();
    const statusUrl = submitData.status_url;
    if (!statusUrl) {
      return Response.json(
        { configured: true, error: "Higgsfield returned no status_url" },
        { status: 502 }
      );
    }

    // 2. Poll until a terminal state
    let result = null;
    for (let i = 0; i < 90; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const stRes = await fetch(statusUrl, { headers: { Authorization: authHeader } });
      if (stRes.ok) {
        result = await stRes.json();
        if (["completed", "failed", "nsfw", "canceled"].includes(result.status)) break;
      }
    }

    if (!result || result.status !== "completed") {
      return Response.json(
        { configured: true, error: `Generation did not complete (status: ${result?.status || "unknown"})` },
        { status: 502 }
      );
    }

    const imageUrl = result.images && result.images[0] && result.images[0].url;
    if (!imageUrl) {
      return Response.json(
        { configured: true, error: "No image URL in completed response" },
        { status: 502 }
      );
    }

    return Response.json({ configured: true, imageUrl });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}