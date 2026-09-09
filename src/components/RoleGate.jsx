import React from "react";
import { Navigate } from "react-router-dom";
import { useRole } from "@/lib/RoleContext";
import { canAccessPage, homePathFor } from "@/lib/roleAccess";

export default function RoleGate({ page, children }) {
  const { role, loading } = useRole();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }
  if (!canAccessPage(role, page)) {
    return <Navigate to={homePathFor(role)} replace />;
  }
  return children;
}