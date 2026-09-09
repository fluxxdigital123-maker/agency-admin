export function monthKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export function inMonth(dateStr, ym) {
  return String(dateStr || "").slice(0, 7) === ym;
}

/**
 * Computes what each editor (TeamMember) is owed for a given month.
 *  - FIXED_MONTHLY:    rate (falls back to cost)
 *  - PER_CLIP:         rate × clips created this month
 *  - PER_1000_VIEWS:   rate × (views this month / 1000)
 *
 * Views are attributed to an editor via the clip's editor field
 * (ViewSnapshot.clip -> Clip.editor).
 */
export function computeEditorPayouts(team = [], clips = [], snapshots = [], ym = monthKey()) {
  const clipEditor = {};
  for (const cl of clips) {
    if (cl.editor) clipEditor[cl.id] = cl.editor;
  }

  const byEditor = {};
  for (const t of team) {
    byEditor[t.id] = { teamMember: t, clipsCount: 0, viewsTotal: 0, owed: 0 };
  }

  for (const cl of clips) {
    const e = byEditor[cl.editor];
    if (!e) continue;
    if (inMonth(cl.created_date, ym)) e.clipsCount += 1;
  }

  for (const s of snapshots || []) {
    if (!inMonth(s.date, ym)) continue;
    const ed = clipEditor[s.clip];
    if (!ed) continue;
    const e = byEditor[ed];
    if (!e) continue;
    e.viewsTotal += Number(s.views) || 0;
  }

  for (const id of Object.keys(byEditor)) {
    const e = byEditor[id];
    const t = e.teamMember;
    const rate = Number(t.rate) || 0;
    const cost = Number(t.cost) || 0;
    if (t.paymentType === "PER_CLIP") {
      e.owed = rate * e.clipsCount;
    } else if (t.paymentType === "PER_1000_VIEWS") {
      e.owed = rate * (e.viewsTotal / 1000);
    } else {
      e.owed = rate || cost;
    }
  }

  return byEditor;
}