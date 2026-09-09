import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const RoleContext = createContext({ role: "OWNER", clientAccess: [], loading: true });

export function RoleProvider({ children }) {
  const [state, setState] = useState({ role: "OWNER", clientAccess: [], loading: true });

  useEffect(() => {
    let done = false;
    base44.functions
      .invoke("getCurrentUserRole", {})
      .then((res) => {
        if (done) return;
        const d = res?.data || res;
        if (d && d.role) {
          setState({ role: d.role, clientAccess: d.clientAccess || [], loading: false });
        } else {
          setState({ role: "OWNER", clientAccess: [], loading: false });
        }
      })
      .catch(() => {
        if (!done) setState({ role: "OWNER", clientAccess: [], loading: false });
      });
    return () => {
      done = true;
    };
  }, []);

  return <RoleContext.Provider value={state}>{children}</RoleContext.Provider>;
}

export function useRole() {
  return useContext(RoleContext);
}