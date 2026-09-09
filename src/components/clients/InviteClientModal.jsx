import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, X, Mail, Check, UserPlus, Link as LinkIcon } from "lucide-react";

export default function InviteClientModal({ open, client, onClose }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (open) {
      setEmail(client?.googleAccountEmail || "");
      setDone(false);
      setErr("");
    }
  }, [open, client]);

  if (!open) return null;

  async function invite() {
    const trimmed = email.trim();
    if (!trimmed) {
      setErr("Enter the client's email.");
      return;
    }
    setBusy(true);
    setErr("");
    try {
      // Invite as a platform user (role "user"). Ignore "already invited" errors.
      try {
        await base44.users.inviteUser(trimmed, "user");
      } catch (e) {
        // user may already exist — that's fine, we still link the role below
      }
      // Upsert the CLIENT role scoped to this client.
      const existing = await base44.entities.UserRole.filter({ userEmail: trimmed }, "-created_date", 5);
      if (existing && existing[0]) {
        await base44.entities.UserRole.update(existing[0].id, {
          role: "CLIENT",
          clientAccess: [client.id],
        });
      } else {
        await base44.entities.UserRole.create({
          userEmail: trimmed,
          role: "CLIENT",
          clientAccess: [client.id],
        });
      }
      setDone(true);
    } catch (e) {
      setErr(e.message || "Could not invite the client.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-[18px] h-[18px] text-primary" />
            <h2 className="text-[18px] font-semibold tracking-tight">Invite client</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {done ? (
          <div className="text-center py-4">
            <div className="w-11 h-11 rounded-full mx-auto flex items-center justify-center mb-3" style={{ background: "rgba(48,209,88,0.16)" }}>
              <Check className="w-6 h-6" style={{ color: "#30D158" }} />
            </div>
            <p className="text-[15px] font-medium">Invitation sent to {email}</p>
            <p className="text-[13px] text-muted-foreground mt-1.5">
              The client will create their account and land on their portal at sign-in.
            </p>
            <div className="flex items-center gap-2 mt-4 rounded-[10px] px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)" }}>
              <LinkIcon className="w-4 h-4 text-muted-foreground shrink-0" />
              <span className="text-[13px] text-muted-foreground truncate">{window.location.origin}/portal</span>
            </div>
            <button onClick={onClose} className="mt-5 h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground">
              Done
            </button>
          </div>
        ) : (
          <>
            <p className="text-[14px] text-muted-foreground mb-4">
              Send {client?.name || "this client"} a login invite. Once they sign in, they'll see their own read-only portal — views, schedule, invoices, and the review queue.
            </p>
            <label className="block">
              <span className="text-[13px] text-muted-foreground">Client email</span>
              <div className="relative mt-1">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="client@example.com"
                  className="w-full rounded-[10px] bg-background/60 border border-border pl-9 pr-3 h-10 text-[14px] outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>
            </label>
            {err && <p className="text-[13px] text-destructive mt-3">{err}</p>}
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium border hover:bg-foreground/5" style={{ borderColor: "var(--border)" }}>
                Cancel
              </button>
              <button onClick={invite} disabled={busy} className="inline-flex items-center gap-1.5 h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground disabled:opacity-50">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                Send invite
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}