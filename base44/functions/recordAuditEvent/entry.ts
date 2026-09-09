import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { authorizeSystemCall } from "../../shared/internalAuth.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const { entityName, recordId, action, before, after, createdById } = body || {};

    if (!entityName || !action) {
      return Response.json({ error: 'entityName and action are required' }, { status: 400 });
    }

    const { authorized, user } = await authorizeSystemCall(base44, body);
    if (!authorized) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Actor: prefer the authenticated caller's identity; for system (workflow)
    // calls, resolve from the triggering record's created_by_id. A client-
    // supplied createdById is never trusted for an authenticated caller.
    let userEmail = 'system';
    if (user && user.email) {
      userEmail = user.email;
    } else if (createdById) {
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