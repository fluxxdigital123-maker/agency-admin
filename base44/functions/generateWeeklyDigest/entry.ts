import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

// Compiles a weekly agency digest (per-client views, posted clips, pipeline stage,
// overdue payments, 30-day-guarantee flags) into a single email sent via Base44's
// email integration. Scheduled Monday 08:00 via the "Weekly Digest" workflow.
// Also invoked manually from Settings ("Send test digest") — test mode bypasses the
// on/off toggle and sends to the configured (or caller's) email.
export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const b = base44.asServiceRole;
    const body = await req.json().catch(() => ({}));
    const test = !!body?.test;
    const now = new Date();
    const DAY = 86400000;
    const weekAgo = new Date(now.getTime() - 7 * DAY);

    // Test mode requires an admin caller (scheduled runs have no user).
    if (test) {
      const user = await base44.auth.me();
      if (!user) return Response.json({ error: "Unauthorized" }, { status: 401 });
      if (user.role !== "admin") return Response.json({ error: "Admin only" }, { status: 403 });
    }

    // Settings
    const settingRows = await b.entities.AppSetting.filter(
      { key: { $in: ["digest_enabled", "digest_email", "agency_name", "super_admin_email"] } },
      "-created_date",
      20
    );
    const sm = {};
    for (const r of settingRows || []) sm[r.key] = r.value;

    const enabled = sm.digest_enabled !== "false"; // default on
    if (!test && !enabled) {
      return Response.json({ ok: true, skipped: true, reason: "disabled" });
    }

    // Resolve recipient
    let recipient = (sm.digest_email || "").trim();
    if (!recipient && test) {
      try {
        const u = await base44.auth.me();
        if (u?.email) recipient = u.email;
      } catch {
        /* ignore */
      }
    }
    if (!recipient && sm.super_admin_email) recipient = sm.super_admin_email.trim();
    if (!recipient) {
      try {
        const admins = await b.entities.User.filter({ role: "admin" }, "created_date", 5);
        if (admins && admins[0]) recipient = admins[0].email;
      } catch {
        /* ignore */
      }
    }
    if (!recipient) {
      return Response.json(
        { error: "No recipient email configured. Set a digest email in Settings." },
        { status: 400 }
      );
    }

    // Gather data
    const [clients, clips, snaps, payments, progress] = await Promise.all([
      b.entities.Client.list("-created_date", 500),
      b.entities.Clip.list("-created_date", 2000),
      b.entities.ViewSnapshot.list("-date", 5000),
      b.entities.Payment.list("-dueDate", 2000),
      b.entities.ClientProgress.list("-updatedAt", 2000),
    ]);

    // Latest pipeline stage per client
    const stageByClient = {};
    for (const p of progress || []) {
      const ex = stageByClient[p.client];
      const pt = new Date(p.updatedAt || p.created_date).getTime();
      const et = ex ? new Date(ex.updatedAt || ex.created_date).getTime() : 0;
      if (!ex || pt > et) stageByClient[p.client] = p;
    }

    const clientName = (id) => (clients || []).find((c) => c.id === id)?.name || "—";
    const activeClients = (clients || []).filter((c) => c.status !== "CHURNED");

    const rows = [];
    let totalViews = 0;
    let totalPosted = 0;
    const overduePayments = [];
    const guaranteeFlags = [];

    for (const c of activeClients) {
      const cSnaps = (snaps || []).filter(
        (s) =>
          s.client === c.id &&
          s.date &&
          new Date(s.date) >= weekAgo &&
          new Date(s.date) <= now
      );
      const views = cSnaps.reduce((s, x) => s + (Number(x.views) || 0), 0);
      const likes = cSnaps.reduce((s, x) => s + (Number(x.likes) || 0), 0);
      const postedThisWeek = (clips || []).filter(
        (cl) => cl.client === c.id && cl.postedDate && new Date(cl.postedDate) >= weekAgo
      ).length;
      const stage = stageByClient[c.id]?.stage || "—";

      totalViews += views;
      totalPosted += postedThisWeek;
      rows.push({ name: c.name, views, likes, postedThisWeek, stage });

      if (c.startDate) {
        const elapsed = Math.floor(
          (now.getTime() - new Date(c.startDate).getTime()) / DAY
        );
        if (elapsed >= 25 && elapsed <= 30) {
          guaranteeFlags.push(`${c.name} — day ${elapsed} of the 30-day views guarantee`);
        } else if (elapsed > 30 && c.baselineViews) {
          const totalAll = (snaps || [])
            .filter((s) => s.client === c.id)
            .reduce((s, x) => s + (Number(x.views) || 0), 0);
          if (totalAll < Number(c.baselineViews)) {
            guaranteeFlags.push(
              `${c.name} — past 30 days, ${fmtNum(totalAll)} / ${fmtNum(c.baselineViews)} views vs guarantee`
            );
          }
        }
      }
    }

    for (const p of payments || []) {
      if (p.status !== "PAID" && p.dueDate && new Date(p.dueDate) < now) {
        overduePayments.push({
          client: clientName(p.client),
          amount: Number(p.amount || 0),
          dueDate: String(p.dueDate).slice(0, 10),
        });
      }
    }

    rows.sort((a, b2) => b2.views - a.views);

    const agencyName = sm.agency_name || "Agency Admin";
    const rangeStart = weekAgo.toISOString().slice(0, 10);
    const rangeEnd = now.toISOString().slice(0, 10);
    const subject = `${agencyName} — Weekly Digest (${rangeStart} → ${rangeEnd})`;
    const html = buildHtml({
      agencyName,
      rangeStart,
      rangeEnd,
      totalViews,
      totalPosted,
      clientCount: activeClients.length,
      overdueCount: overduePayments.length,
      guaranteeCount: guaranteeFlags.length,
      rows,
      overduePayments,
      guaranteeFlags,
      test,
    });

    await b.integrations.Core.SendEmail({ to: recipient, subject, html });

    return Response.json({
      ok: true,
      test,
      recipient,
      clients: activeClients.length,
      totalViews,
      totalPosted,
      overdue: overduePayments.length,
      guarantees: guaranteeFlags.length,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

function fmtNum(n) {
  const v = Number(n) || 0;
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 1_000) return (v / 1_000).toFixed(1) + "K";
  return String(v);
}

function fmtMoney(n) {
  return "$" + (Number(n) || 0).toLocaleString();
}

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"]/g, (c) =>
    c === "&" ? "&amp;" : c === "<" ? "&lt;" : c === ">" ? "&gt;" : "&quot;"
  );
}

function buildHtml(opts) {
  const {
    agencyName,
    rangeStart,
    rangeEnd,
    totalViews,
    totalPosted,
    clientCount,
    overdueCount,
    guaranteeCount,
    rows,
    overduePayments,
    guaranteeFlags,
    test,
  } = opts;

  const rowHtml = rows
    .map(
      (r) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#f5f5f7;font-weight:600;">${esc(r.name)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#0a84ff;font-weight:600;text-align:right;">${fmtNum(r.views)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#e5e5e7;text-align:right;">${fmtNum(r.likes)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#30d158;font-weight:600;text-align:right;">${r.postedThisWeek}</td>
        <td style="padding:10px 12px;border-bottom:1px solid rgba(255,255,255,0.06);color:#98989f;font-size:12px;">${esc(r.stage)}</td>
      </tr>`
    )
    .join("");

  const overdueHtml = overduePayments.length
    ? overduePayments
        .map(
          (p) =>
            `<tr><td style="padding:8px 12px;color:#ff453a;font-weight:600;">${esc(p.client)}</td><td style="padding:8px 12px;color:#f5f5f7;text-align:right;">${fmtMoney(p.amount)}</td><td style="padding:8px 12px;color:#98989f;text-align:right;font-size:12px;">${esc(p.dueDate)}</td></tr>`
        )
        .join("")
    : `<tr><td colspan="3" style="padding:14px 12px;color:#98989f;text-align:center;">None — all clear.</td></tr>`;

  const guaranteeHtml = guaranteeFlags.length
    ? guaranteeFlags
        .map(
          (g) =>
            `<li style="padding:6px 0;color:#ff9f0a;">${esc(g)}</li>`
        )
        .join("")
    : `<li style="padding:6px 0;color:#98989f;">None — no clients in the guarantee window.</li>`;

  const banner = test
    ? `<div style="margin:0 0 18px;padding:10px 14px;border-radius:10px;background:rgba(255,159,10,0.14);color:#ff9f0a;font-size:13px;font-weight:600;">TEST DIGEST — manually triggered from Settings</div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0b;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:32px 20px;">
    <div style="margin-bottom:24px;">
      <div style="font-size:13px;color:#98989f;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">${esc(agencyName)}</div>
      <h1 style="margin:4px 0 2px;font-size:26px;color:#f5f5f7;font-weight:700;letter-spacing:-0.02em;">Weekly Digest</h1>
      <div style="font-size:14px;color:#98989f;">${rangeStart} → ${rangeEnd}</div>
    </div>
    ${banner}
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <tr>
        <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:700;color:#0a84ff;letter-spacing:-0.02em;">${fmtNum(totalViews)}</div>
          <div style="font-size:12px;color:#98989f;margin-top:2px;">Views this week</div>
        </td>
        <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:700;color:#30d158;letter-spacing:-0.02em;">${totalPosted}</div>
          <div style="font-size:12px;color:#98989f;margin-top:2px;">Clips posted</div>
        </td>
        <td style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:16px;text-align:center;width:33%;">
          <div style="font-size:24px;font-weight:700;color:#f5f5f7;letter-spacing:-0.02em;">${clientCount}</div>
          <div style="font-size:12px;color:#98989f;margin-top:2px;">Active clients</div>
        </td>
      </tr>
    </table>

    <h2 style="font-size:16px;color:#f5f5f7;margin:0 0 8px;font-weight:600;">Per-client performance</h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
      <tr>
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#98989f;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid rgba(255,255,255,0.08);">Client</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#98989f;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid rgba(255,255,255,0.08);">Views</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#98989f;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid rgba(255,255,255,0.08);">Likes</th>
        <th style="padding:10px 12px;text-align:right;font-size:11px;color:#98989f;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid rgba(255,255,255,0.08);">Posted</th>
        <th style="padding:10px 12px;text-align:left;font-size:11px;color:#98989f;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid rgba(255,255,255,0.08);">Stage</th>
      </tr>
      ${rowHtml || `<tr><td colspan="5" style="padding:14px 12px;color:#98989f;text-align:center;">No active clients.</td></tr>`}
    </table>

    <h2 style="font-size:16px;color:#f5f5f7;margin:0 0 8px;font-weight:600;">Overdue payments <span style="font-size:13px;color:#ff453a;font-weight:600;">(${overdueCount})</span></h2>
    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;overflow:hidden;">
      <tr><td style="padding:8px 12px;color:#98989f;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;">Client</td><td style="padding:8px 12px;color:#98989f;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;text-align:right;">Amount</td><td style="padding:8px 12px;color:#98989f;font-size:11px;text-transform:uppercase;letter-spacing:0.04em;text-align:right;">Due</td></tr>
      ${overdueHtml}
    </table>

    <h2 style="font-size:16px;color:#f5f5f7;margin:0 0 8px;font-weight:600;">30-day guarantee flags <span style="font-size:13px;color:#ff9f0a;font-weight:600;">(${guaranteeCount})</span></h2>
    <ul style="list-style:none;padding:0;margin:0 0 24px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:12px;padding:12px 16px;">
      ${guaranteeHtml}
    </ul>

    <div style="margin-top:32px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);font-size:12px;color:#6e6e73;">
      Generated automatically by ${esc(agencyName)}. You can toggle this digest on or off in Settings → Weekly Digest.
    </div>
  </div>
</body></html>`;
}