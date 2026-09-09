// Churn risk scoring (0–100) per client from four signals:
//   1. views trend (last 14 days vs prior 14 days)
//   2. late payments (overdue, or pending past due date)
//   3. clips stuck in pipeline (>7 days in QUEUED/EDITING/REVIEW)
//   4. days since last client interaction (progress update or clip approval/feedback)

const DAY_MS = 86400000;
const clamp = (v, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

export function computeChurnRisk({ client, viewSnapshots = [], payments = [], clips = [], progress = [] } = {}) {
  const factors = [];
  let score = 0;
  const now = Date.now();

  // 1. Views trend
  const snaps = (viewSnapshots || [])
    .filter((s) => s.date)
    .sort((a, b) => a.date.localeCompare(b.date));
  const recent = snaps.filter((s) => new Date(s.date).getTime() >= now - 14 * DAY_MS);
  const prior = snaps.filter((s) => {
    const t = new Date(s.date).getTime();
    return t >= now - 28 * DAY_MS && t < now - 14 * DAY_MS;
  });
  const rSum = recent.reduce((s, x) => s + (x.views || 0), 0);
  const pSum = prior.reduce((s, x) => s + (x.views || 0), 0);
  if (pSum > 0) {
    const pct = ((rSum - pSum) / pSum) * 100;
    let pts = 0;
    if (pct <= -25) pts = 30;
    else if (pct <= -10) pts = 18;
    else if (pct < 0) pts = 8;
    score += pts;
    if (pts > 0) factors.push(`Views ${pct.toFixed(0)}% vs prior 14 days`);
  } else if (rSum === 0) {
    score += 5;
    factors.push("No view data in last 28 days");
  }

  // 2. Late payments
  const late = (payments || []).filter(
    (p) => p.status === "OVERDUE" || (p.status === "PENDING" && p.dueDate && new Date(p.dueDate).getTime() < now)
  );
  if (late.length > 0) {
    score += Math.min(24, late.length * 12);
    factors.push(`${late.length} late payment${late.length > 1 ? "s" : ""}`);
  }

  // 3. Clips stuck in pipeline > 7 days
  const stuck = (clips || []).filter(
    (c) => ["QUEUED", "EDITING", "REVIEW"].includes(c.status) && c.statusChangedAt && now - new Date(c.statusChangedAt).getTime() > 7 * DAY_MS
  );
  if (stuck.length > 0) {
    score += Math.min(30, stuck.length * 10);
    factors.push(`${stuck.length} clip${stuck.length > 1 ? "s" : ""} stuck >7 days`);
  }

  // 4. Days since last client interaction
  const interactionTimes = [];
  for (const p of progress || []) if (p.updatedAt) interactionTimes.push(new Date(p.updatedAt).getTime());
  for (const c of clips || []) {
    if ((c.clientApproval === "APPROVED" || c.clientApproval === "CHANGES_REQUESTED") && c.statusChangedAt) {
      interactionTimes.push(new Date(c.statusChangedAt).getTime());
    }
  }
  if (interactionTimes.length > 0) {
    const last = Math.max(...interactionTimes);
    const days = Math.floor((now - last) / DAY_MS);
    let pts = 0;
    if (days > 21) pts = 20;
    else if (days > 14) pts = 12;
    else if (days > 7) pts = 6;
    score += pts;
    if (pts > 0) factors.push(`No client interaction in ${days} days`);
  } else {
    score += 20;
    factors.push("No recorded client interaction");
  }

  score = clamp(Math.round(score));
  const level = score >= 60 ? "HIGH" : score >= 30 ? "MEDIUM" : "LOW";
  if (factors.length === 0) factors.push("No risk factors detected");
  return { score, level, factors };
}

export const RISK_COLOR = { LOW: "#30D158", MEDIUM: "#FF9F0A", HIGH: "#FF453A" };
export const RISK_LABEL = { LOW: "Low", MEDIUM: "Medium", HIGH: "High" };