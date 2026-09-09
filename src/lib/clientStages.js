// Production pipeline stages for ClientProgress.
// Order matches the pipeline flow. Each has a label + accent color token.
export const STAGES = [
  { key: "WAITING_FOR_FOOTAGE", label: "Waiting for Footage", color: "muted" },
  { key: "FILMING", label: "Filming", color: "blue" },
  { key: "EDITING_SHORT_FORM", label: "Editing Short-Form", color: "teal" },
  { key: "EDITING_LONG_FORM", label: "Editing Long-Form", color: "purple" },
  { key: "DESIGNING_THUMBNAIL", label: "Designing Thumbnail", color: "orange" },
  { key: "IN_REVIEW", label: "In Review", color: "amber" },
  { key: "UPLOADING", label: "Uploading", color: "cyan" },
  { key: "PUBLISHED", label: "Published", color: "green" },
];

export const STAGE_MAP = Object.fromEntries(STAGES.map((s) => [s.key, s]));

export function getStage(key) {
  return STAGE_MAP[key] || STAGES[0];
}

export function stageIndex(key) {
  const i = STAGES.findIndex((s) => s.key === key);
  return i < 0 ? 0 : i;
}

// Color -> inline style for pills / dots, using the Apple accent palette.
export const STAGE_COLOR_HEX = {
  muted: "#86868b",
  blue: "#0A84FF",
  teal: "#64D2FF",
  purple: "#BF5AF2",
  orange: "#FF9F0A",
  amber: "#FFD60A",
  cyan: "#5AC8FA",
  green: "#30D158",
  red: "#FF453A",
};

// Long-form / short-form definition used everywhere AI looks at videos.
// 4 minutes or longer = long-form; under 4 minutes = short-form.
// Never use YouTube's "Shorts" tab as the definition of short-form.
export const VIDEO_LENGTH_RULE =
  "When categorizing videos by length, define LONG-FORM as 4 minutes or longer, and SHORT-FORM as under 4 minutes. Never use YouTube's 'Shorts' tab/shelf as the definition of short-form — use the actual duration (>=4 min = long-form, <4 min = short-form).";

export const PLAN_LABELS = {
  TEAM_ONLY: "Team Only",
  PERSONAL_INVOLVED: "Personal Involved",
  CUSTOM: "Custom",
};