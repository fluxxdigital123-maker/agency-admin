import React from "react";
import { Link } from "react-router-dom";
import StagePill from "@/components/clients/StagePill";
import RiskPill from "@/components/clients/RiskPill";
import { ArrowUpRight } from "lucide-react";

export default function ClientStageCards({ clients, progressByClient, riskByClient }) {
  if (!clients.length) {
    return (
      <div className="glass-card p-6 text-center">
        <p className="text-[15px] text-muted-foreground">No active clients yet.</p>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {clients.map((c) => {
        const prog = progressByClient[c.id];
        const risk = riskByClient?.[c.id];
        return (
          <Link
            key={c.id}
            to={`/clients/${c.id}`}
            className="glass-card p-5 flex items-center justify-between hover:bg-white/[0.03] transition-colors"
          >
            <div className="min-w-0">
              <div className="text-[15px] font-medium truncate">{c.name}</div>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <StagePill stage={prog?.stage} size="sm" />
                <RiskPill risk={risk} />
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-muted-foreground shrink-0" />
          </Link>
        );
      })}
    </div>
  );
}