import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, Wallet, Users, Calendar, Target, Lightbulb,
  Image as ImageIcon, BarChart3, Eye, UsersRound, Rocket, Settings,
  Clapperboard, MoreHorizontal, X } from "lucide-react";
import { useRole } from "@/lib/RoleContext";
import { canAccessPath, homePathFor } from "@/lib/roleAccess";

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

function primaryPathsFor(role) {
  if (role === "EDITOR") return ["/my-work", "/views"];
  if (role === "CLIENT") return ["/portal"];
  return ["/", "/clients", "/leads", "/views"];
}

export default function BottomTabBar() {
  const { role } = useRole();
  const [moreOpen, setMoreOpen] = useState(false);
  const items = navItems.filter((item) => canAccessPath(role, item.path));
  const primarySet = primaryPathsFor(role);
  const primary = items.filter((i) => primarySet.includes(i.path));
  const more = items.filter((i) => !primarySet.includes(i.path));
  const home = homePathFor(role);

  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 glass-bar flex items-stretch justify-around"
        style={{ borderTop: "0.5px solid var(--border)", paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {primary.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === home}
              className={({ isActive }) =>
                [
                  "flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-w-0",
                  isActive ? "text-primary" : "text-muted-foreground",
                ].join(" ")
              }
            >
              <Icon className="w-[20px] h-[20px] shrink-0" />
              <span className="text-[10px] font-medium truncate max-w-full px-0.5">{item.label}</span>
            </NavLink>
          );
        })}
        {more.length > 0 && (
          <button
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 min-w-0 text-muted-foreground"
          >
            <MoreHorizontal className="w-[20px] h-[20px] shrink-0" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        )}
      </nav>

      {moreOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex items-end"
          style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setMoreOpen(false)}
        >
          <div
            className="w-full glass-modal rounded-t-[20px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[16px] font-semibold tracking-tight">More</span>
              <button onClick={() => setMoreOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {more.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    end={item.path === home}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive }) =>
                      [
                        "flex flex-col items-center gap-1.5 py-3 rounded-[12px]",
                        isActive ? "text-primary" : "text-muted-foreground hover:bg-foreground/5",
                      ].join(" ")
                    }
                  >
                    <Icon className="w-[22px] h-[22px]" />
                    <span className="text-[11px] font-medium text-center leading-tight">{item.label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}