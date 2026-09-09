export const ROLES = ["OWNER", "MANAGER", "EDITOR"];

export const ROLE_LABEL = { OWNER: "Owner", MANAGER: "Manager", EDITOR: "Editor" };
export const ROLE_COLOR = { OWNER: "#0A84FF", MANAGER: "#FF9F0A", EDITOR: "#30D158" };

// Which roles may view each page key. Editors only get views + clientDetail
// (and only their assigned clients there).
export const PAGE_ACCESS = {
  dashboard: ["OWNER", "MANAGER"],
  money: ["OWNER"],
  clients: ["OWNER", "MANAGER"],
  clientDetail: ["OWNER", "MANAGER", "EDITOR"],
  calendar: ["OWNER", "MANAGER"],
  leads: ["OWNER", "MANAGER"],
  ideation: ["OWNER", "MANAGER"],
  thumbnails: ["OWNER", "MANAGER"],
  analytics: ["OWNER", "MANAGER"],
  views: ["OWNER", "MANAGER", "EDITOR"],
  team: ["OWNER", "MANAGER"],
  onboarding: ["OWNER", "MANAGER"],
  settings: ["OWNER"],
};

const PATH_TO_PAGE = {
  "/": "dashboard",
  "/money": "money",
  "/clients": "clients",
  "/calendar": "calendar",
  "/leads": "leads",
  "/ideation": "ideation",
  "/thumbnails": "thumbnails",
  "/analytics": "analytics",
  "/views": "views",
  "/team": "team",
  "/onboarding": "onboarding",
  "/settings": "settings",
};

export function pageForPath(path) {
  return PATH_TO_PAGE[path];
}

export function canAccessPage(role, page) {
  return (PAGE_ACCESS[page] || []).includes(role);
}

export function canAccessPath(role, path) {
  return canAccessPage(role, pageForPath(path));
}

export function homePathFor(role) {
  if (role === "EDITOR") return "/views";
  return "/";
}

export function filterClientsByAccess(clients, role, clientAccess) {
  if (role === "EDITOR") {
    const allowed = new Set(clientAccess || []);
    return (clients || []).filter((c) => allowed.has(c.id));
  }
  return clients || [];
}