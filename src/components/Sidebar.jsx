import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, Wallet, Users, Calendar, Target, Lightbulb,
  Image as ImageIcon, BarChart3, Eye, UsersRound, Rocket, Settings, PanelLeft,
  Clapperboard,
} from "lucide-react";
import { useRole } from "@/lib/RoleContext";
import { canAccessPath } from "@/lib/roleAccess";

const navItems = [
  { label: "My Work", path: "/my-work", icon: Clapperboard },
  { label: "Dashboard", path: "/", icon: LayoutDashboard },
  { label: "Money", path: "/money", icon: Wallet },
  { label: "Clients", path: "/clients", icon: Users },
  { label: "Calendar", path: "/calendar", icon: Calendar },
  { label: "Leads", path: "/leads", icon: Target },
  { label: "Ideation", path: "/ideation", icon: Lightbulb },
  { label: "Thumbnails", path: "/thumbnails", icon: ImageIcon },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Views", path: "/views", icon: Eye },
  { label: "Team", path: "/team", icon: UsersRound },
  { label: "Onboarding", path: "/onboarding", icon: Rocket },
  { label: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar({ collapsed, onToggle }) {
  const { role } = useRole();
  const items = navItems.filter((item) => canAccessPath(role, item.path));
  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-40 flex flex-col bg-black transition-[width] duration-300 ease-out"
      style={{ width: collapsed ? 72 : 260, borderRight: "0.5px solid rgba(255,255,255,0.08)" }}
    >
      <div
        className="flex items-center h-12 px-4 shrink-0"
        style={{ borderBottom: "0.5px solid rgba(255,255,255,0.06)" }}
      >
        <div
          className="w-7 h-7 rounded-[10px] flex items-center justify-center shrink-0"
          style={{ background: "linear-gradient(135deg, #0A84FF, #64D2FF)" }}
        >
          <span className="text-white text-[13px] font-semibold leading-none">A</span>
        </div>
        {!collapsed && (
          <span className="ml-3 text-[15px] font-semibold tracking-tight text-white whitespace-nowrap">
            Agency Admin
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                [
                  "flex items-center gap-3 rounded-[10px] px-3 h-10 transition-colors duration-200",
                  isActive
                    ? "text-white"
                    : "text-[#86868b] hover:text-white hover:bg-white/5",
                ].join(" ")
              }
              style={({ isActive }) =>
                isActive ? { background: "rgba(255,255,255,0.08)" } : undefined
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              {!collapsed && (
                <span className="text-[15px] font-medium whitespace-nowrap">
                  {item.label}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      <div className="p-2 shrink-0" style={{ borderTop: "0.5px solid rgba(255,255,255,0.06)" }}>
        <button
          onClick={onToggle}
          title={collapsed ? "Expand" : "Collapse"}
          className="flex items-center gap-3 rounded-[10px] px-3 h-10 w-full text-[#86868b] hover:text-white hover:bg-white/5 transition-colors duration-200"
        >
          <PanelLeft className="w-[18px] h-[18px] shrink-0" />
          {!collapsed && <span className="text-[15px] font-medium whitespace-nowrap">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}