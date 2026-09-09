import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

const API = "https://www.googleapis.com/youtube/v3";

// Parse a YouTube URL / handle / ID into a resolvable form.
function parseChannelInput(input) {
  const s = (input || "").trim();
  if (!s) return { raw: "", type: "none" };
  let m = s.match(/youtube\.com\/channel\/(UC[\w-]+)/);
  if (m) return { raw: m[1], type: "id" };
  m = s.match(/youtube\.com\/@([\w.\-]+)/);
  if (m) return { raw: m[1], type: "handle" };
  m = s.match(/youtube\.com\/user\/([\w.\-]+)/);
  if (m) return { raw: m[1], type: "username" };
  m = s.match(/youtube\.com\/c\/([\w.\-]+)/);
  if (m) return { raw: m[1], type: "custom" };
  if (s.startsWith("@")) return { raw: s.slice(1), type: "handle" };
  if (/^UC[\w-]{20,}$/.test(s)) return { raw: s, type: "id" };
  return { raw: s, type: "handle" };
}

async function resolveChannelId(key, parsed) {
  if (parsed.type === "id") return parsed.raw;
  if (parsed.type === "handle" || parsed.type === "username") {
    const param = parsed.type === "handle" ? "forHandle" : "forUsername";
    const url = `${API}/channels?part=id&${param}=${encodeURIComponent(parsed.raw)}&key=${key}`;
    const r = await fetch(url);
    if (r.ok) {
      const j = await r.json();
      const id = j.items && j.items[0] && j.items[0].id;
      if (id) return id;
    }
  }
  // fallback: search by name
  const surl = `${API}/search?part=id&q=${encodeURIComponent(parsed.raw)}&type=channel&maxResults=1&key=${key}`;
  const sr = await fetch(surl);
  if (sr.ok) {
    const sj = await sr.json();
    const sid = sj.items && sj.items[0] && sj.items[0].id && sj.items[0].id.channelId;
    if (sid) return sid;
  }
  return null;
}

async function fetchJson(url) {
  const r = await fetch(url);
  if (!r.ok) {
    let detail = "";
    try {
      detail = (await r.json())?.error?.message || "";
    } catch {
      /* ignore */
    }
    throw new Error(`YouTube API error (${r.status}): ${detail || r.statusText}`);
  }
  return r.json();
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const clientId = (body && body.clientId || "").trim();
    if (!clientId) return Response.json({ error: "clientId is required" }, { status: 400 });

    // Server-only API key
    const settings = await base44.asServiceRole.entities.AppSetting.filter(
      { key: "youtube_api_key" },
      "-created_date",
      5
    );
    const key = settings && settings[0] && settings[0].value;
    if (!key) return Response.json({ configured: false });

    const client = await base44.asServiceRole.entities.Client.get(clientId);
    if (!client) return Response.json({ error: "Client not found" }, { status: 404 });
    if (!client.channelUrl) {
      return Response.json(
        { error: "This client has no channel URL. Add one in the client profile first." },
        { status: 400 }
      );
    }

    const parsed = parseChannelInput(client.channelUrl);
    const channelId = await resolveChannelId(key, parsed);
    if (!channelId) {
      return Response.json(
        { error: "Could not resolve a YouTube channel from this URL. Use a /channel/UC…, /@handle, or /user/name URL." },
        { status: 400 }
      );
    }

    const ch = await fetchJson(
      `${API}/channels?part=snippet,statistics&id=${channelId}&key=${key}`
    );
    const c = ch.items && ch.items[0];
    if (!c) return Response.json({ error: "YouTube channel not found." }, { status: 404 });
    const stats = c.statistics || {};
    const channelTitle = (c.snippet && c.snippet.title) || client.name;

    // Top videos by view count
    let topVideos = [];
    try {
      const sj = await fetchJson(
        `${API}/search?part=id&channelId=${channelId}&order=viewCount&type=video&maxResults=5&key=${key}`
      );
      const ids = (sj.items || [])
        .map((it) => it.id && it.id.videoId)
        .filter(Boolean);
      if (ids.length) {
        const vj = await fetchJson(
          `${API}/videos?part=snippet,statistics&id=${ids.join(",")}&key=${key}`
        );
        topVideos = (vj.items || []).map((v) => ({
          title: (v.snippet && v.snippet.title) || "Untitled",
          url: `https://www.youtube.com/watch?v=${v.id}`,
          views: Number((v.statistics && v.statistics.viewCount) || 0),
        }));
      }
    } catch {
      /* top videos are optional */
    }

    const today = new Date().toISOString().slice(0, 10);
    const snapshot = await base44.asServiceRole.entities.AnalyticsSnapshot.create({
      client: clientId,
      date: today,
      subscribers: Number(stats.subscriberCount || 0),
      views: Number(stats.viewCount || 0),
      watchHours: null, // not exposed by YouTube Data API v3 — manual entry only
      impressionsCTR: null, // not exposed by YouTube Data API v3 — manual entry only
      topVideos: JSON.stringify(topVideos),
    });

    return Response.json({ configured: true, snapshot, channelTitle });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}