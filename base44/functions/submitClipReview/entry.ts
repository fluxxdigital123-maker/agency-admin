import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Public, token-protected endpoint: a client approves a clip or requests changes.
// No user auth — the review token + clip ownership are verified server-side.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    let payload = {};
    try { payload = await req.json(); } catch {}
    const { token, clipId, decision, comment } = payload || {};
    if (!token || !clipId || !decision) {
      return Response.json({ error: "Missing fields" }, { status: 400 });
    }
    if (!["APPROVED", "CHANGES_REQUESTED"].includes(decision)) {
      return Response.json({ error: "Invalid decision" }, { status: 400 });
    }
    const clients = await base44.asServiceRole.entities.Client.filter({ reviewToken: token }, "-created_date", 5);
    const client = clients && clients[0];
    if (!client) {
      return Response.json({ error: "Invalid review link" }, { status: 404 });
    }
    const clip = await base44.asServiceRole.entities.Clip.get(clipId);
    if (!clip || clip.client !== client.id) {
      return Response.json({ error: "Clip not found" }, { status: 404 });
    }

    const cleanComment = typeof comment === "string" ? comment.slice(0, 2000) : "";
    const newStatus = decision === "APPROVED" ? "APPROVED" : "EDITING";

    await base44.asServiceRole.entities.Clip.update(clipId, {
      clientApproval: decision,
      clientFeedback: cleanComment,
      status: newStatus,
      statusChangedAt: new Date().toISOString(),
    });

    await base44.asServiceRole.entities.Notification.create({
      title: decision === "APPROVED"
        ? `Clip approved by ${client.name}`
        : `Changes requested by ${client.name}`,
      body: decision === "APPROVED"
        ? `${clip.title} — approved by the client.`
        : `${clip.title} — client requested changes${cleanComment ? ": " + cleanComment.slice(0, 300) : "."}`,
      kind: "CLIENT_APPROVAL",
      client: client.id,
      clip: clipId,
      read: false,
    });

    return Response.json({ ok: true, decision });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}