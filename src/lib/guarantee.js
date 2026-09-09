const DAY_MS = 86400000;

/**
 * Computes the 30-day guarantee metrics for a client.
 *
 * baseline = views in the 30 days BEFORE startDate, taken from
 *   client.baselineViews (manual) if set, else summed from
 *   AnalyticsSnapshot (views) in that window, else ViewSnapshot (views).
 * current  = views in the first 30 days AFTER startDate, from ViewSnapshot.
 *
 * Returns null if the client has no startDate.
 */
export function computeGuarantee(client, viewSnapshots = [], analyticsSnapshots = []) {
  if (!client || !client.startDate) return null;

  const start = new Date(client.startDate);
  const today = new Date();
  const elapsed = Math.max(0, Math.floor((today - start) / DAY_MS));
  const daysRemaining = Math.max(0, 30 - elapsed);

  const baseStart = new Date(start.getTime() - 30 * DAY_MS);
  const winEnd = new Date(start.getTime() + 30 * DAY_MS);

  const inWin = (d, a, b) => {
    const t = new Date(d);
    return t >= a && t < b;
  };

  let baseline = client.baselineViews;
  const hasManual = baseline !== undefined && baseline !== null && baseline !== "" && !isNaN(Number(baseline));
  if (hasManual) {
    baseline = Number(baseline);
  } else {
    const an = (analyticsSnapshots || []).filter((s) => inWin(s.date, baseStart, start));
    baseline = an.reduce((s, x) => s + (Number(x.views) || 0), 0);
    if (!baseline) {
      const vs = (viewSnapshots || []).filter((s) => inWin(s.date, baseStart, start));
      baseline = vs.reduce((s, x) => s + (Number(x.views) || 0), 0);
    }
  }

  const curVs = (viewSnapshots || []).filter((s) => inWin(s.date, start, winEnd));
  const current = curVs.reduce((s, x) => s + (Number(x.views) || 0), 0);

  const pct = baseline > 0 ? ((current - baseline) / baseline) * 100 : null;

  let status;
  if (pct === null) {
    status = elapsed >= 20 ? "red" : "orange";
  } else if (pct > 0) {
    status = "green";
  } else {
    status = elapsed >= 20 ? "red" : "orange";
  }

  return { elapsed, daysRemaining, baseline, current, pct, status, inWindow: elapsed <= 30 };
}