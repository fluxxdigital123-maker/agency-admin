// Shared authorization helpers for backend functions that are invoked both by
// authenticated admin users (from the UI) and by scheduled/entity-trigger
// workflows (no user session). Anonymous HTTP calls are rejected.
//
// Workflow invocations authenticate via a `system_secret` arg that matches the
// `internal_system_secret` AppSetting. The secret lives only in server-side
// workflow definitions (admin-visible) and the database — it is never exposed
// to the client bundle, so anonymous external callers cannot supply it.

async function getSetting(base44, key) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  return rows && rows[0] ? rows[0].value : null;
}

// Returns { authorized: true, user } when the caller is an authenticated admin
// or presents a valid system secret; otherwise { authorized: false, user: null }.
// `user` is the authenticated caller (null for system/secret calls).
export async function authorizeSystemCall(base44, body) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch {
    /* no user session — may be a workflow invocation */
  }
  if (user && user.role === "admin") {
    return { authorized: true, user };
  }
  const secret = body && body.system_secret ? String(body.system_secret) : "";
  if (secret) {
    try {
      const stored = await getSetting(base44, "internal_system_secret");
      if (stored && constantTimeEquals(secret, stored)) {
        return { authorized: true, user: null };
      }
    } catch {
      /* fall through to unauthorized */
    }
  }
  return { authorized: false, user: null };
}

// Constant-time string comparison to avoid timing side-channels on secrets.
export function constantTimeEquals(a, b) {
  const sa = String(a == null ? "" : a);
  const sb = String(b == null ? "" : b);
  if (sa.length !== sb.length) return false;
  let diff = 0;
  for (let i = 0; i < sa.length; i++) {
    diff |= sa.charCodeAt(i) ^ sb.charCodeAt(i);
  }
  return diff === 0;
}