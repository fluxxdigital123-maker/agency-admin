import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";
import { constantTimeEquals } from "../../shared/internalAuth.ts";

async function getSetting(base44, key) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  return rows && rows[0] ? rows[0] : null;
}

async function setSetting(base44, key, value) {
  const existing = await getSetting(base44, key);
  if (existing) {
    await base44.asServiceRole.entities.AppSetting.update(existing.id, { value });
  } else {
    await base44.asServiceRole.entities.AppSetting.create({ key, value });
  }
}

const MAX_FAILS = 5;
const LOCK_MS = 15 * 60 * 1000; // 15 minutes

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const password = body && body.password ? String(body.password) : "";

    // Brute-force lockout: track failed attempts in an AppSetting.
    const nowTs = Date.now();
    let lock = { fails: 0, until: 0 };
    try {
      const rec = await getSetting(base44, "super_admin_lockout");
      if (rec && rec.value) lock = JSON.parse(rec.value);
    } catch {
      /* reset on parse error */
    }
    if (lock.until && lock.until > nowTs) {
      return Response.json(
        { ok: false, message: "Too many attempts. Please try again later." },
        { status: 429 }
      );
    }

    const stored = await getSetting(base44, "super_admin_password");
    const storedValue = stored ? stored.value : null;
    if (!storedValue)
      return Response.json({
        ok: false,
        message: "Super admin is not configured. Set it in Settings first.",
      });

    if (!constantTimeEquals(password, storedValue)) {
      lock.fails = (lock.fails || 0) + 1;
      if (lock.fails >= MAX_FAILS) {
        lock.until = nowTs + LOCK_MS;
        lock.fails = 0;
      }
      try {
        await setSetting(base44, "super_admin_lockout", JSON.stringify(lock));
      } catch {
        /* lockout persistence is best-effort */
      }
      return Response.json({ ok: false, message: "Incorrect password." });
    }

    // Correct password — clear the lockout and reveal the admin email.
    try {
      await setSetting(base44, "super_admin_lockout", JSON.stringify({ fails: 0, until: 0 }));
    } catch {
      /* best-effort */
    }
    const emailRec = await getSetting(base44, "super_admin_email");
    const email = emailRec ? emailRec.value : null;
    return Response.json({ ok: true, email: email || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}