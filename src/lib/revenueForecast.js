// Revenue forecast model for the next N months.
// Inputs: clients (all), leads (pipeline), newClientsPerMonth (scenario).
// Model:
//  - Active clients contribute monthlyFee every month.
//  - Known churn: a CHURNED client with a future churnDate keeps contributing until that month;
//    a CHURNED client with no/past churnDate is already gone.
//  - Leads: IN_TALKS weighted 40%, CONTACTED 15% (expected); best case weights them at 100%.
//  - Scenario: new clients/month × avg active MRR, compounding from month 1.
//  - Bands: best (no lead discount + 1.5× growth), expected (weighted + 1×), worst (no leads + 0.3×).

const LEAD_WEIGHT = { IN_TALKS: 0.4, CONTACTED: 0.15 };

function monthStart(offset = 0) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return d;
}

export function buildRevenueForecast(clients = [], leads = [], newClientsPerMonth = 0, months = 6) {
  const active = clients.filter((c) => c.status === "ACTIVE");
  const currentMrr = active.reduce((s, c) => s + (c.monthlyFee || 0), 0);
  const avgMrr = active.length ? currentMrr / active.length : 0;

  const pipelineLeads = (leads || []).filter(
    (l) => l.status === "IN_TALKS" || l.status === "CONTACTED"
  );
  const leadExpected = pipelineLeads.reduce(
    (s, l) => s + (l.monthlyRecurring || 0) * (LEAD_WEIGHT[l.status] || 0),
    0
  );
  const leadBest = pipelineLeads.reduce((s, l) => s + (l.monthlyRecurring || 0), 0);

  const series = [];
  for (let i = 0; i < months; i++) {
    const mDate = monthStart(i);
    let activeMrr = 0;
    for (const c of clients) {
      const fee = c.monthlyFee || 0;
      if (fee <= 0) continue;
      const churnDate = c.churnDate ? new Date(c.churnDate) : null;
      // CHURNED without a date = already gone.
      if (c.status === "CHURNED" && !churnDate) continue;
      // Dropped by this month if churn date is on/before month start.
      if (churnDate && churnDate <= mDate) continue;
      activeMrr += fee;
    }
    const scenario = newClientsPerMonth * i * avgMrr;
    const worst = Math.max(0, activeMrr + scenario * 0.3);
    const expected = activeMrr + leadExpected + scenario;
    const best = activeMrr + leadBest + scenario * 1.5;
    series.push({
      month: mDate.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
      worst: Math.round(worst),
      expected: Math.round(expected),
      best: Math.round(best),
      band: Math.max(0, Math.round(best - worst)),
    });
  }

  return { series, currentMrr, avgMrr, leadExpected, leadBest, months };
}

export function fmtMoneyShort(v) {
  if (v == null) return "—";
  if (Math.abs(v) >= 1000) return `$${(v / 1000).toFixed(1)}k`;
  return `$${Math.round(v)}`;
}