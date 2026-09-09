import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useRole } from "@/lib/RoleContext";
import { Loader2, LogOut, Film, AlertCircle } from "lucide-react";
import PortalViews from "@/components/portal/PortalViews";
import PortalClips from "@/components/portal/PortalClips";
import PortalSchedule from "@/components/portal/PortalSchedule";
import PortalInvoices from "@/components/portal/PortalInvoices";
import PortalReviewQueue from "@/components/portal/PortalReviewQueue";

export default function Portal() {
  const { role, clientAccess } = useRole();
  const [client, setClient] = useState(null);
  const [clips, setClips] = useState([]);
  const [snapshots, setSnapshots] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notLinked, setNotLinked] = useState(false);

  const clientId = clientAccess?.[0];

  async function load() {
    if (!clientId) {
      setNotLinked(true);
      setLoading(false);
      return;
    }
    try {
      const [c, cl, vs, inv] = await Promise.all([
        base44.entities.Client.get(clientId),
        base44.entities.Clip.filter({ client: clientId }, "-created_date", 500),
        base44.entities.ViewSnapshot.filter({ client: clientId }, "-date", 1000),
        base44.entities.Invoice.filter({ client: clientId }, "-issueDate", 100),
      ]);
      setClient(c);
      setClips(cl || []);
      setSnapshots(vs || []);
      setInvoices(inv || []);
    } catch {
      setNotLinked(true);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function handleReviewed(updatedClip) {
    setClips((prev) => prev.map((c) => (c.id === updatedClip.id ? updatedClip : c)));
  }

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(1200px 600px at 50% -10%, rgba(10,132,255,0.10), transparent), #0a0a0b",
      }}
    >
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        <div className="flex items-center justify-between gap-3 mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "rgba(10,132,255,0.16)" }}
            >
              <Film className="w-5 h-5" style={{ color: "#0A84FF" }} />
            </div>
            <div>
              <h1 className="text-[22px] md:text-[26px] font-semibold tracking-tight text-white">
                {client?.name ? `${client.name} · Portal` : "Client Portal"}
              </h1>
              <p className="text-[13px] text-white/50">
                Your performance, schedule, invoices, and review queue.
              </p>
            </div>
          </div>
          <button
            onClick={() => base44.auth.logout("/login")}
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-[10px] text-[13px] font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            style={{ border: "0.5px solid rgba(255,255,255,0.12)" }}
          >
            <LogOut className="w-4 h-4" /> Sign out
          </button>
        </div>

        {loading && (
          <div className="glass-card p-10 flex items-center justify-center gap-2 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" /> Loading your portal…
          </div>
        )}

        {notLinked && !loading && (
          <div className="glass-card p-8 text-center">
            <AlertCircle className="w-6 h-6 mx-auto mb-2" style={{ color: "#FF9F0A" }} />
            <p className="text-[15px] text-white">
              Your account isn't linked to a client yet.
            </p>
            <p className="text-[13px] text-white/50 mt-1">
              Ask your account manager to send you an invite.
            </p>
          </div>
        )}

        {!loading && !notLinked && (
          <div className="space-y-6">
            <PortalReviewQueue
              clips={clips.filter((c) => c.clientApproval === "PENDING")}
              onReviewed={handleReviewed}
            />
            <PortalViews snapshots={snapshots} />
            <PortalSchedule clips={clips} />
            <PortalClips clips={clips.filter((c) => c.status === "POSTED")} />
            <PortalInvoices invoices={invoices} client={client} />
          </div>
        )}
      </div>
    </div>
  );
}