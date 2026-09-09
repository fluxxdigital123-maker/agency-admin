import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { authorizeSystemCall } from "../../shared/internalAuth.ts";

const STAGES = [
  "WAITING_FOR_FOOTAGE",
  "FILMING",
  "EDITING_SHORT_FORM",
  "EDITING_LONG_FORM",
  "DESIGNING_THUMBNAIL",
  "IN_REVIEW",
  "UPLOADING",
  "PUBLISHED",
];

async function getSetting(base44, key) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  return rows && rows[0] ? rows[0].value : null;
}

async function botGuilds(token) {
  const r = await fetch("https://discord.com/api/v10/users/@me/guilds", {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!r.ok) return [];
  return await r.json();
}

async function guildTextChannels(token, guildId) {
  const r = await fetch(`https://discord.com/api/v10/guilds/${guildId}/channels`, {
    headers: { Authorization: `Bot ${token}` },
  });
  if (!r.ok) return [];
  const ch = await r.json();
  return (ch || []).filter((c) => c.type === 0).slice(0, 5);
}

async function recentMessages(token, channelId, limit = 20) {
  const r = await fetch(
    `https://discord.com/api/v10/channels/${channelId}/messages?limit=${limit}`,
    { headers: { Authorization: `Bot ${token}` } }
  );
  if (!r.ok) return [];
  return await r.json();
}

function buildTranscript(messagesByChannel) {
  const lines = [];
  for (const msgs of messagesByChannel) {
    for (const m of msgs) {
      const who =
        (m.author && (m.author.global_name || m.author.username)) || "user";
      const content = (m.content || "").replace(/\s+/g, " ").trim();
      if (content) lines.push(`${who}: ${content}`);
    }
  }
  let text = lines.join("\n");
  if (text.length > 3000) text = text.slice(0, 3000);
  return text;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));

    const { authorized } = await authorizeSystemCall(base44, body || {});
    if (!authorized)
      return Response.json({ error: "Unauthorized" }, { status: 401 });

    const token = await getSetting(base44, "discord_bot_token");
    if (!token)
      return Response.json({ ok: false, message: "Discord bot token not configured." });

    const guilds = await botGuilds(token);
    if (!guilds.length)
      return Response.json({ ok: false, message: "Bot is not in any servers." });

    const clients = await base44.asServiceRole.entities.Client.filter(
      { status: "ACTIVE" },
      "-created_date",
      200
    );

    const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");
    const results = [];

    for (const client of clients || []) {
      // Match server NAME to client name, or discordServerId to guild id.
      const match = guilds.find(
        (g) =>
          (client.discordServerId && g.id === client.discordServerId) ||
          norm(g.name) === norm(client.name)
      );
      if (!match) continue;

      const channels = await guildTextChannels(token, match.id);
      const msgs = [];
      for (const ch of channels) {
        const m = await recentMessages(token, ch.id, 20);
        msgs.push((m || []).slice().reverse()); // chronological-ish
      }
      const transcript = buildTranscript(msgs);
      if (!transcript) {
        results.push({ client: client.name, skipped: "no messages" });
        continue;
      }

      let stage = null;
      let reasoning = "";
      try {
        const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: `Based on these team Discord messages, determine the current production stage for this client. Stages: ${STAGES.join(
            ", "
          )}. Return only the stage name and brief reasoning.\n\nClient: ${
            client.name
          }\n\nRecent messages:\n${transcript}`,
          response_json_schema: {
            type: "object",
            properties: {
              stage: { type: "string", enum: STAGES },
              reasoning: { type: "string" },
            },
            required: ["stage", "reasoning"],
          },
        });
        const obj = llm && typeof llm === "object" ? llm : null;
        if (obj && STAGES.includes(obj.stage)) {
          stage = obj.stage;
          reasoning = (obj.reasoning || "").slice(0, 500);
        }
      } catch (e) {
        reasoning = "LLM failed: " + e.message;
      }

      if (stage) {
        await base44.asServiceRole.entities.ClientProgress.create({
          client: client.id,
          stage,
          source: "AI_DISCORD",
          notes: reasoning,
          updatedAt: new Date().toISOString(),
        });
        results.push({ client: client.name, stage, reasoning });
      } else {
        results.push({ client: client.name, skipped: "no stage determined" });
      }
    }

    return Response.json({ ok: true, processed: results.length, results });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}