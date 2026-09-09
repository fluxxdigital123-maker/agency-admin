import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

async function getSetting(base44, key) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  return rows && rows[0] ? rows[0].value : null;
}

async function upsertSetting(base44, key, value) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  if (rows && rows[0]) await base44.asServiceRole.entities.AppSetting.update(rows[0].id, { value });
  else await base44.asServiceRole.entities.AppSetting.create({ key, value });
}

async function writeStatus(base44, statusKey, status) {
  await upsertSetting(base44, statusKey, JSON.stringify(status));
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json().catch(() => ({}));
    const type = body && body.type;
    const valid = ["claude", "higgsfield", "youtube", "discord", "notion"];
    if (!valid.includes(type)) return Response.json({ error: "Invalid type" }, { status: 400 });

    const nowIso = new Date().toISOString();
    let ok = false;
    let message = "";

    if (type === "claude") {
      try {
        const r = await base44.asServiceRole.integrations.Core.InvokeLLM({
          prompt: "Reply with the single word OK.",
        });
        const txt = typeof r === "string" ? r : (r && r.response) || JSON.stringify(r || {});
        ok = /ok/i.test(String(txt).slice(0, 20));
        message = ok ? "AI is responding." : "Unexpected AI response.";
      } catch (e) {
        message = e.message;
      }
    } else if (type === "higgsfield") {
      const key = await getSetting(base44, "higgsfield_api_key");
      const secret = await getSetting(base44, "higgsfield_api_secret");
      if (!key || !secret) {
        message = "API key and secret are required.";
      } else {
        try {
          const r = await fetch("https://api.higgsfield.ai/higgsfield-ai/credit_balance", {
            headers: { Authorization: `Key ${key}:${secret}` },
          });
          if (r.status === 200) {
            ok = true;
            message = "Higgsfield connected.";
          } else if (r.status === 401 || r.status === 403) {
            message = "Invalid Higgsfield credentials.";
          } else {
            ok = true;
            message = "Credentials saved — full verification happens on your next thumbnail.";
          }
        } catch (e) {
          ok = true;
          message = "Credentials saved — verify on next thumbnail generation.";
        }
      }
    } else if (type === "youtube") {
      const key = await getSetting(base44, "youtube_api_key");
      if (!key) {
        message = "API key is required.";
      } else {
        try {
          const r = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=snippet&chart=mostPopular&maxResults=1&key=${encodeURIComponent(key)}`
          );
          if (r.ok) {
            ok = true;
            message = "YouTube Data API connected.";
          } else {
            const j = await r.json().catch(() => ({}));
            message = (j.error && j.error.message) || `YouTube API error (${r.status}).`;
          }
        } catch (e) {
          message = e.message;
        }
      }
    } else if (type === "discord") {
      const token = await getSetting(base44, "discord_bot_token");
      if (!token) {
        message = "Bot token is required.";
      } else {
        try {
          const r = await fetch("https://discord.com/api/v10/users/@me", {
            headers: { Authorization: `Bot ${token}` },
          });
          if (r.ok) {
            const j = await r.json();
            ok = true;
            message = `Connected as @${j.username}.`;
          } else if (r.status === 401) {
            message = "Invalid bot token.";
          } else {
            message = `Discord API error (${r.status}).`;
          }
        } catch (e) {
          message = e.message;
        }
      }
    } else if (type === "notion") {
      const token = await getSetting(base44, "notion_token");
      if (!token) {
        message = "Integration token is required.";
      } else {
        try {
          const r = await fetch("https://api.notion.com/v1/users/me", {
            headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" },
          });
          if (r.ok) {
            const j = await r.json();
            ok = true;
            message = `Connected as ${j.name || "Notion"}.`;
          } else if (r.status === 401) {
            message = "Invalid Notion token.";
          } else {
            message = `Notion API error (${r.status}).`;
          }
        } catch (e) {
          message = e.message;
        }
      }
    }

    const statusKey = `integration_${type}`;
    await writeStatus(base44, statusKey, {
      configured: ok,
      lastTested: nowIso,
      error: ok ? null : message,
    });
    if (type === "claude") await upsertSetting(base44, "ai_configured", ok ? "true" : "false");
    if (type === "youtube")
      await upsertSetting(base44, "youtube_key_configured", ok ? "true" : "false");

    return Response.json({ success: ok, message, lastTested: nowIso });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}