import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { entityName, recordId, action, before, after, createdById } = body || {};

    if (!entityName || !action) {
      return Response.json({ error: 'entityName and action are required' }, { status: 400 });
    }

    // Best-effort actor resolution: the platform's entity triggers run as the
    // service role (no user token), so we resolve the actor from the record's
    // built-in created_by_id when present. Falls back to "system" for
    // service-role-created records.
    let userEmail = 'system';
    if (createdById) {
      try {
        const users = await base44.asServiceRole.entities.User.filter({ id: createdById }, '-created_date', 1);
        if (users && users[0] && users[0].email) userEmail = users[0].email;
      } catch {
        /* keep "system" */
      }
    }

    const truncate = (s) => (typeof s === 'string' ? s.slice(0, 8000) : s);

    await base44.asServiceRole.entities.AuditEvent.create({
      userEmail,
      action,
      entityName,
      recordId: recordId || null,
      before: before ? truncate(before) : null,
      after: after ? truncate(after) : null,
      timestamp: new Date().toISOString(),
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}