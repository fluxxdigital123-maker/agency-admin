import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

// Scans agency data and creates notifications for conditions that need attention:
//  - overdue payments, clips stuck in Review >48h, clients approaching the 30-day guarantee mark.
// Idempotent: skips a condition if an unread notification of that type for the same entity already exists.
// Run daily via the "Daily Notifications" workflow.
export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const b = base44.asServiceRole;
    const now = new Date();
    const DAY = 86400000;
    let created = 0;

    const existing = await b.entities.Notification.filter({ read: false }, "-created_date", 500);
    const seen = new Set((existing || []).map((n) => `${n.type}:${n.client || n.clip || ""}`));

    async function notify(type, message, link, client, clip) {
      const key = `${type}:${client || clip || ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      try {
        await b.entities.Notification.create({
          type,
          message,
          link: link || "",
          read: false,
          client: client || null,
          clip: clip || null,
        });
        created++;
      } catch {
        /* skip individual failures */
      }
    }

    // 1. Overdue payments (unpaid and past due date)
    const payments = await b.entities.Payment.list("-dueDate", 1000);
    for (const p of (payments || [])) {
      if (p.status === "PAID" || !p.dueDate) continue;
      if (new Date(p.dueDate).getTime() < now.getTime()) {
        const amt = Number(p.amount || 0).toLocaleString();
        await notify(
          "PAYMENT_OVERDUE",
          `Overdue payment of $${amt} (due ${String(p.dueDate).slice(0, 10)})`,
          `/clients/${p.client}`,
          p.client,
          null
        );
      }
    }

    // 2. Clips stuck in Review longer than 48 hours
    const clips = await b.entities.Clip.list("-created_date", 1000);
    for (const c of (clips || [])) {
      if (c.status !== "REVIEW") continue;
      const ts = c.statusChangedAt ? new Date(c.statusChangedAt) : new Date(c.created_date);
      if (now.getTime() - ts.getTime() > 48 * 3600000) {
        await notify(
          "CLIP_STUCK_REVIEW",
          `"${c.title}" has been in Review for over 48 hours.`,
          `/clients/${c.client}`,
          c.client,
          c.id
        );
      }
    }

    // 3. Clients approaching the 30-day guarantee mark (days 25–30 since start)
    const clients = await b.entities.Client.list("-created_date", 500);
    for (const cl of (clients || [])) {
      if (!cl.startDate) continue;
      const elapsed = Math.floor((now.getTime() - new Date(cl.startDate).getTime()) / DAY);
      if (elapsed >= 25 && elapsed <= 30) {
        await notify(
          "GUARANTEE_APPROACHING",
          `${cl.name} is at day ${elapsed} of the 30-day views guarantee.`,
          `/clients/${cl.id}`,
          cl.id,
          null
        );
      }
    }

    return Response.json({ ok: true, created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}