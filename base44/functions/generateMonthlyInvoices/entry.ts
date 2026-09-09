import { createClientFromRequest } from "npm:@base44/sdk@0.8.44";

function ym(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
function addDays(d, n) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);

    // Allow system (workflow) invocation; block non-admin direct calls.
    let user = null;
    try {
      user = await base44.auth.me();
    } catch {
      /* workflow context — no user */
    }
    if (user && user.role !== "admin")
      return Response.json({ error: "Forbidden" }, { status: 403 });

    const now = new Date();
    const thisMonth = ym(now);
    const issueDate = isoDate(now);
    const dueDate = isoDate(addDays(now, 15));

    const [clients, invoices, payments] = await Promise.all([
      base44.asServiceRole.entities.Client.filter({ status: "ACTIVE" }, "-created_date", 200),
      base44.asServiceRole.entities.Invoice.list("-issueDate", 2000),
      base44.asServiceRole.entities.Payment.list("-dueDate", 2000),
    ]);

    // Existing invoice keys: client|YYYY-MM
    const invoiceKeys = new Set();
    for (const inv of invoices || []) {
      if (inv.client && inv.issueDate) invoiceKeys.add(`${inv.client}|${String(inv.issueDate).slice(0, 7)}`);
    }
    // Existing monthly payment keys: client|dueDate
    const paymentKeys = new Set();
    for (const p of payments || []) {
      if (p.client && p.type === "MONTHLY" && p.dueDate) paymentKeys.add(`${p.client}|${p.dueDate}`);
    }

    const created = [];
    for (const c of clients || []) {
      const key = `${c.id}|${thisMonth}`;
      if (invoiceKeys.has(key)) continue;
      const amount = Number(c.monthlyFee) || 0;
      const invoiceNumber = `INV-${thisMonth}-${String(c.id).slice(-6).toUpperCase()}`;
      const lineItems = "Monthly content management & production services";

      await base44.asServiceRole.entities.Invoice.create({
        client: c.id,
        invoiceNumber,
        amount,
        issueDate,
        dueDate,
        status: "DRAFT",
        lineItems,
      });

      // Ensure a matching MONTHLY payment exists (links invoice <-> payment by client + dueDate).
      if (!paymentKeys.has(`${c.id}|${dueDate}`)) {
        await base44.asServiceRole.entities.Payment.create({
          client: c.id,
          amount,
          type: "MONTHLY",
          dueDate,
          status: "PENDING",
        });
        paymentKeys.add(`${c.id}|${dueDate}`);
      }

      created.push({ client: c.name, invoiceNumber, amount });
    }

    // Mark SENT invoices past their due date as OVERDUE.
    const today = issueDate;
    let overdueUpdated = 0;
    for (const inv of invoices || []) {
      if (inv.status === "SENT" && inv.dueDate && inv.dueDate < today) {
        try {
          await base44.asServiceRole.entities.Invoice.update(inv.id, { status: "OVERDUE" });
          overdueUpdated += 1;
        } catch {
          /* ignore */
        }
      }
    }

    return Response.json({ ok: true, month: thisMonth, created: created.length, overdueUpdated, items: created });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}