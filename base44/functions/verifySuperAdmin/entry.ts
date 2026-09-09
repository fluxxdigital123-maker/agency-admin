import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

async function getSetting(base44, key) {
  const rows = await base44.asServiceRole.entities.AppSetting.filter(
    { key },
    "-created_date",
    5
  );
  return rows && rows[0] ? rows[0].value : null;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const password = body && body.password ? String(body.password) : "";

    const stored = await getSetting(base44, "super_admin_password");
    if (!stored)
      return Response.json({
        ok: false,
        message: "Super admin is not configured. Set it in Settings first.",
      });

    if (password !== stored)
      return Response.json({ ok: false, message: "Incorrect password." });

    const email = await getSetting(base44, "super_admin_email");
    return Response.json({ ok: true, email: email || null });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}