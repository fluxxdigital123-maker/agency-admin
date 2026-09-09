export const PLATFORMS = ["YOUTUBE_SHORTS", "TIKTOK", "INSTAGRAM_REELS", "X", "LINKEDIN"];

export const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YT Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "IG Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

export const PLATFORM_COLOR = {
  YOUTUBE_SHORTS: "#FF453A",
  TIKTOK: "#64D2FF",
  INSTAGRAM_REELS: "#BF5AF2",
  X: "#8E8E93",
  LINKEDIN: "#0A84FF",
};

// Returns { start, end } Date objects for the Mon–Sun week containing `ref` (default: now).
export function weekRange(ref = new Date()) {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // Mon=0 ... Sun=6
  const start = new Date(d);
  start.setDate(d.getDate() - day);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

export function inThisWeek(dateStr, ref) {
  if (!dateStr) return false;
  const { start, end } = weekRange(ref);
  const d = new Date(dateStr + "T00:00:00");
  return d >= start && d <= end;
}