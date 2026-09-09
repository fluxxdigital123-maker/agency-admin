import { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import {
  Sparkles,
  Image as ImageIcon,
  Youtube,
  MessageCircle,
  FileText,
} from "lucide-react";

/**
 * Integration registry. Each integration has a card, a setup guide,
 * credential fields (stored in AppSetting), and a test connection.
 * Status is stored as JSON in `integration_<id>`:
 *   { configured: bool, lastTested: iso|null, error: string|null }
 */
export const INTEGRATIONS = [
  {
    id: "claude",
    name: "Claude / AI API",
    icon: Sparkles,
    color: "#FF9F0A",
    description:
      "Powers channel analysis, ideation, thumbnail direction, and suggested titles/ideas via Base44's built-in LLM. No API key required — just enable and test.",
    estMinutes: 2,
    order: 1,
    badge: "Set this up first",
    credentialKeys: [],
    statusKey: "integration_claude",
    steps: [
      {
        title: "AI is built in",
        body: "Base44 provides a managed LLM through InvokeLLM. There's no API key to buy or billing to configure.",
      },
      {
        title: "Enable AI features",
        body: "Toggle 'Enable AI features' below. This unlocks channel analysis, ideation, thumbnail direction, and the suggested titles/ideas tools.",
      },
      {
        title: "Test the connection",
        body: "Click 'Test Connection' to run a quick LLM call and confirm everything responds.",
      },
    ],
    checklist: ["AI features enabled", "Test connection passed"],
  },
  {
    id: "higgsfield",
    name: "Higgsfield",
    icon: ImageIcon,
    color: "#BF5AF2",
    description:
      "AI thumbnail image generation (Soul v2 / nano-banana-pro, 16:9, 4K). Requires an API key and secret.",
    estMinutes: 3,
    order: 2,
    credentialKeys: [
      { id: "higgsfield_api_key", label: "API Key", type: "password" },
      { id: "higgsfield_api_secret", label: "API Secret", type: "password" },
    ],
    statusKey: "integration_higgsfield",
    steps: [
      {
        title: "Create a Higgsfield account",
        body: "Sign up at Higgsfield and open the Dashboard → API Keys section.",
        link: "https://higgsfield.ai",
      },
      {
        title: "Copy your API Key and Secret",
        body: "Generate a new API key. Copy both the API Key and the API Secret.",
      },
      {
        title: "Paste and save",
        body: "Paste both values into the Credentials fields below and click 'Save credentials'.",
      },
      {
        title: "Test the connection",
        body: "Click 'Test Connection'. Full image generation is verified on your next thumbnail.",
        code: "curl https://api.higgsfield.ai/higgsfield-ai/soul/v2/standard \\\n  -H \"Authorization: Key YOUR_KEY:YOUR_SECRET\"",
      },
    ],
    checklist: ["Account created", "API Key & Secret saved", "Test connection passed"],
  },
  {
    id: "youtube",
    name: "YouTube Data API",
    icon: Youtube,
    color: "#FF453A",
    description:
      "Auto-pull subscribers, total views, and top videos for each client channel in Analytics.",
    estMinutes: 5,
    order: 3,
    credentialKeys: [{ id: "youtube_api_key", label: "API Key", type: "password" }],
    statusKey: "integration_youtube",
    steps: [
      {
        title: "Open Google Cloud Console",
        body: "Create or select a project.",
        link: "https://console.cloud.google.com",
      },
      {
        title: "Enable YouTube Data API v3",
        body: "Navigate to APIs & Services → Library, search 'YouTube Data API v3', and enable it.",
      },
      {
        title: "Create an API key",
        body: "Go to Credentials → Create Credentials → API key.",
      },
      {
        title: "Restrict the key (recommended)",
        body: "Restrict the key to YouTube Data API v3 only, for security.",
      },
      {
        title: "Paste, save, and test",
        body: "Paste the key below, save, then test the connection.",
      },
    ],
    checklist: ["Project created", "YouTube Data API v3 enabled", "API key created", "Test connection passed"],
  },
  {
    id: "discord",
    name: "Discord Bot",
    icon: MessageCircle,
    color: "#5865F2",
    description:
      "Read-only Discord monitor. The status agent reads recent messages from each client's server every ~30 minutes to infer the production stage. Requires the MESSAGE CONTENT INTENT.",
    estMinutes: 5,
    order: 4,
    credentialKeys: [{ id: "discord_bot_token", label: "Bot Token", type: "password" }],
    statusKey: "integration_discord",
    steps: [
      {
        title: "Create a Discord application",
        body: "Go to the Discord Developer Portal and create a New Application.",
        link: "https://discord.com/developers/applications",
      },
      {
        title: "Add a Bot and copy the token",
        body: "Open the Bot tab → Add Bot → Reset Token → Copy. This is your Bot Token.",
      },
      {
        title: "Enable MESSAGE CONTENT INTENT",
        body: "On the Bot tab, under Privileged Gateway Intents, turn on 'MESSAGE CONTENT INTENT'. The bot is read-only — it only reads messages and never posts.",
      },
      {
        title: "Invite the bot to each client server",
        body: "Use the OAuth2 URL Generator with scope 'bot'. The bot only needs to read message history.",
        code: "https://discord.com/oauth2/authorize?client_id=YOUR_APP_ID&scope=bot&permissions=66560",
      },
      {
        title: "Match servers to clients",
        body: "The agent matches each Discord server NAME to a client name (case-insensitive), or to the client's Discord Server ID field. Name your client servers to match client names for automatic pairing.",
      },
      {
        title: "Paste, save, and test",
        body: "Paste the Bot Token below, save, then test.",
      },
    ],
    checklist: ["Application created", "Bot token copied", "MESSAGE CONTENT INTENT enabled", "Bot invited to client servers", "Test connection passed"],
  },
  {
    id: "notion",
    name: "Notion",
    icon: FileText,
    color: "#0A84FF",
    description:
      "Optional. Connect a Notion integration token to sync client docs and briefs in the future.",
    estMinutes: 4,
    order: 5,
    optional: true,
    credentialKeys: [{ id: "notion_token", label: "Integration Token", type: "password" }],
    statusKey: "integration_notion",
    steps: [
      {
        title: "Create a Notion integration",
        body: "Go to notion.so/my-integrations → New integration.",
        link: "https://www.notion.so/my-integrations",
      },
      {
        title: "Copy the Internal Integration Secret",
        body: "After creating, copy the secret token.",
      },
      {
        title: "Share pages with the integration",
        body: "Open the relevant Notion pages/databases → ••• → Connections → add your integration.",
      },
      {
        title: "Paste, save, and test",
        body: "Paste the token below, save, then test.",
      },
    ],
    checklist: ["Integration created", "Token copied", "Pages shared with integration", "Test connection passed"],
  },
];

export async function loadSettingsMap() {
  const rows = await base44.entities.AppSetting.list("-created_date", 500);
  const map = {};
  for (const r of rows || []) map[r.key] = r.value;
  return map;
}

export async function upsertSetting(key, value) {
  const rows = await base44.entities.AppSetting.filter({ key }, "-created_date", 5);
  if (rows && rows[0]) await base44.entities.AppSetting.update(rows[0].id, { value });
  else await base44.entities.AppSetting.create({ key, value });
}

export async function writeStatus(statusKey, status) {
  await upsertSetting(statusKey, JSON.stringify(status));
}

export function parseStatus(integration, map) {
  const raw = map[integration.statusKey];
  let status = null;
  if (raw) {
    try {
      status = JSON.parse(raw);
    } catch {
      /* ignore */
    }
  }
  if (!status) {
    if (integration.id === "youtube")
      return { configured: map["youtube_key_configured"] === "true", lastTested: null, error: null };
    if (integration.id === "claude")
      return { configured: map["ai_configured"] !== "false", lastTested: null, error: null };
    return { configured: false, lastTested: null, error: null };
  }
  return status;
}

export async function saveCredentials(integration, values) {
  for (const f of integration.credentialKeys) {
    await upsertSetting(f.id, values[f.id] || "");
  }
  const configured = integration.credentialKeys.every((f) => (values[f.id] || "").trim());
  await writeStatus(integration.statusKey, { configured, lastTested: null, error: null });
}

export async function setClaudeEnabled(enabled) {
  await upsertSetting("ai_configured", enabled ? "true" : "false");
  await writeStatus("integration_claude", { configured: enabled, lastTested: null, error: null });
}

export async function testIntegrationConnection(id) {
  const res = await base44.functions.invoke("testIntegration", { type: id });
  return res && res.data ? res.data : res;
}

/**
 * Hook: returns true/false once the integration status is known, null while loading.
 * Used by the non-intrusive banners on tabs.
 */
export function useIntegrationConfigured(id) {
  const [configured, setConfigured] = useState(null);
  useEffect(() => {
    let done = false;
    const keys = [`integration_${id}`];
    if (id === "youtube") keys.push("youtube_key_configured");
    if (id === "claude") keys.push("ai_configured");
    base44.entities.AppSetting
      .filter({ key: { $in: keys } }, "-created_date", 10)
      .then((rows) => {
        if (done) return;
        let v = null;
        const statusRow = (rows || []).find((r) => r.key === `integration_${id}`);
        if (statusRow) {
          try {
            v = JSON.parse(statusRow.value).configured;
          } catch {
            /* ignore */
          }
        }
        if (v === null) {
          if (id === "youtube") v = (rows || []).some((r) => r.key === "youtube_key_configured" && r.value === "true");
          else if (id === "claude") v = !(rows || []).some((r) => r.key === "ai_configured" && r.value === "false");
          else v = false;
        }
        setConfigured(!!v);
      })
      .catch(() => {
        if (!done) setConfigured(false);
      });
    return () => {
      done = true;
    };
  }, [id]);
  return configured;
}