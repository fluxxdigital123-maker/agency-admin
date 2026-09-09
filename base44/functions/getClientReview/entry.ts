import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public, token-protected endpoint: returns a client's clips currently in REVIEW.
// No user auth — the review token in the payload is the authenticator (like a shared secret).
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch {}
    const token = (payload && payload.token) || new URL(req.url).searchParams.get("token") || "";
    if (!token || typeof token !== "string") {
      return Response.json({ error: "Missing review token" }, { status: 400 });
    }
    const clients = await base44.asServiceRole.entities.Client.filter({ reviewToken: token }, "-created_date", 5);
    const client = clients && clients[0];
    if (!client) {
      return Response.json({ error: "Invalid or expired review link" }, { status: 404 });
    }
    const clips = await base44.asServiceRole.entities.Clip.filter(
      { client: client.id, status: "REVIEW" },
      "-created_date",
      200
    );
    return Response.json({
      client: {
        id: client.id,
        name: client.name,
        channelThumbnail: client.channelThumbnail || "",
      },
      clips: (clips || []).map((c) => ({
        id: c.id,
        title: c.title,
        platform: c.platform,
        clipUrl: c.clipUrl || "",
        sourceVideoUrl: c.sourceVideoUrl || "",
        clientApproval: c.clientApproval || "NOT_REQUIRED",
        clientFeedback: c.clientFeedback || "",
      })),
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}