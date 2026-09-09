// Lead scoring (0–100) from channel size, average views, and deal value.
// Each input is log-normalized to 0–100, then weighted: subs 40%, views 30%, deal 30%.

const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));
const logScale = (v, ceiling) => clamp((Math.log10((v || 0) + 1) / Math.log10(ceiling)) * 100);

export function computeLeadScore(lead = {}) {
  const subs = lead.subscribers || 0;
  const views = lead.avgViews || 0;
  const deal = (lead.upfrontCash || 0) + (lead.monthlyRecurring || 0) * 12; // annualized

  const subsScore = logScale(subs, 5_000_000);      // 5M subs → 100
  const viewsScore = logScale(views, 2_000_000);    // 2M avg views → 100
  const dealScore = logScale(deal, 300_000);        // $300k annualized → 100

  return Math.round(0.4 * subsScore + 0.3 * viewsScore + 0.3 * dealScore);
}

export function scoreTone(score) {
  if (score >= 70) return "#30D158";
  if (score >= 40) return "#FF9F0A";
  return "#FF453A";
}