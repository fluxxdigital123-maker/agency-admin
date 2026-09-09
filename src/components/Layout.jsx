import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

export default function Layout() {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("agency-sidebar-collapsed") === "true";
  });

  useEffect(() => {
    localStorage.setItem("agency-sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  return (
    <div className="relative min-h-screen">
      {/* Soft layered background gradient orbs */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        <div
          className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full blur-[130px]"
          style={{ background: "rgba(10,132,255,0.12)" }}
        />
        <div
          className="absolute top-1/3 -right-48 w-[560px] h-[560px] rounded-full blur-[140px]"
          style={{ background: "rgba(100,210,255,0.10)" }}
        />
        <div
          className="absolute -bottom-40 left-1/3 w-[560px] h-[560px] rounded-full blur-[140px]"
          style={{ background: "rgba(191,90,242,0.08)" }}
        />
      </div>

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div
        className="transition-[margin] duration-300 ease-out"
        style={{ marginLeft: collapsed ? 72 : 260 }}
      >
        <TopBar />
        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}