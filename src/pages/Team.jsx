import React, { useState, useEffect, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import ClientLane from "@/components/team/ClientLane";
import CapacityTracker from "@/components/team/CapacityTracker";

export default function Team() {
  const [clients, setClients] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const [c, m] = await Promise.all([
        base44.entities.Client.list("-created_date", 200),
        base44.entities.TeamMember.list("-created_date", 1000),
      ]);
      setClients(c || []);
      setMembers(m || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const activeClients = useMemo(() => clients.filter((c) => c.status === "ACTIVE"), [clients]);

  const membersByClient = useMemo(() => {
    const m = {};
    for (const mem of members) (m[mem.client] = m[mem.client] || []).push(mem);
    return m;
  }, [members]);

  const totalCost = members.reduce((s, m) => s + (m.cost || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-6 h-6 border-2 border-muted border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[28px] md:text-[32px] font-semibold tracking-tight">Team</h1>
        <p className="text-[15px] text-muted-foreground mt-1">
          One lane per client with roles, monthly cost, and capacity across your in-house team.
        </p>
      </div>

      <CapacityTracker members={members} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {activeClients.map((c) => (
          <ClientLane key={c.id} client={c} members={membersByClient[c.id] || []} />
        ))}
      </div>

      {members.length > 0 && (
        <p className="text-[13px] text-muted-foreground">
          Total team cost across all clients:{" "}
          <span className="font-medium text-foreground">
            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(totalCost)}
          </span>
        </p>
      )}
    </div>
  );
}