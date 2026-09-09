import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, UserPlus, Shield, User } from "lucide-react";

export default function TeamAccess() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("user");
  const [inviting, setInviting] = useState(false);
  const [msg, setMsg] = useState("");

  async function load() {
    try {
      const u = await base44.entities.User.list("-created_date", 100);
      setUsers(u || []);
    } catch {
      /* ignore */
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function invite() {
    const v = email.trim();
    if (!v || inviting) return;
    setInviting(true);
    setMsg("");
    try {
      await base44.users.inviteUser(v, role);
      setEmail("");
      setMsg(`Invitation sent to ${v}.`);
      await load();
    } catch (e) {
      setMsg(e.message || "Invite failed.");
    } finally {
      setInviting(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <UserPlus className="w-[18px] h-[18px] text-muted-foreground" />
        <h2 className="text-[18px] font-semibold tracking-tight">Team Access</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Create logins for your team and manage who can access the dashboard. Members sign in with the
        standard login screen.
      </p>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@agency.com"
          className="flex-1 h-9 rounded-[9px] px-3 text-[14px] outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="h-9 rounded-[9px] px-3 text-[14px] outline-none"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
        >
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <button
          onClick={invite}
          disabled={inviting || !email.trim()}
          className="h-9 px-4 rounded-[9px] text-[13px] font-medium inline-flex items-center justify-center gap-1.5 disabled:opacity-40"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />} Invite
        </button>
      </div>
      {msg && <div className="text-[13px] text-muted-foreground mb-3">{msg}</div>}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="divide-y" style={{ borderColor: "var(--border)" }}>
          {users.map((u) => (
            <div key={u.id} className="flex items-center gap-3 py-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-[12px] font-semibold shrink-0">
                {(u.full_name || u.email || "?").slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium truncate">{u.full_name || u.email}</div>
                <div className="text-[12px] text-muted-foreground truncate">{u.email}</div>
              </div>
              <span
                className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full shrink-0"
                style={{
                  background: u.role === "admin" ? "rgba(255,159,10,0.12)" : "rgba(255,255,255,0.06)",
                  color: u.role === "admin" ? "#FF9F0A" : "hsl(var(--muted-foreground))",
                }}
              >
                {u.role === "admin" ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />} {u.role || "user"}
              </span>
            </div>
          ))}
          {!loading && users.length === 0 && (
            <div className="py-6 text-center text-[13px] text-muted-foreground">
              No team members yet. Invite someone above.
            </div>
          )}
        </div>
      )}
    </div>
  );
}