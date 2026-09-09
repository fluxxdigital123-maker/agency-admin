import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Plus, Trash2, Loader2, X } from "lucide-react";
import { ROLES, ROLE_LABEL, ROLE_COLOR } from "@/lib/roleAccess";

export default function RolesPanel() {
  const [roles, setRoles] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [addOpen, setAddOpen] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, c] = await Promise.all([
        base44.entities.UserRole.list("-created_date", 200),
        base44.entities.Client.list("-created_date", 200),
      ]);
      setRoles(r || []);
      setClients(c || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function updateRole(id, patch) {
    setSavingId(id);
    try {
      await base44.entities.UserRole.update(id, patch);
      await load();
    } finally {
      setSavingId(null);
    }
  }

  async function del(id) {
    if (!confirm("Remove this role assignment?")) return;
    await base44.entities.UserRole.delete(id);
    load();
  }

  function toggleAccess(row, clientId) {
    const current = row.clientAccess || [];
    const next = current.includes(clientId)
      ? current.filter((c) => c !== clientId)
      : [...current, clientId];
    updateRole(row.id, { clientAccess: next });
  }

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-[18px] h-[18px]" style={{ color: "#0A84FF" }} />
          <h3 className="text-[16px] font-semibold tracking-tight">Team Roles</h3>
          <span className="text-[13px] text-muted-foreground">{roles.length}</span>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="inline-flex items-center gap-1.5 h-8 px-3 rounded-[10px] text-[13px] font-medium bg-primary text-primary-foreground hover:opacity-90"
        >
          <Plus className="w-4 h-4" /> Assign role
        </button>
      </div>

      {roles.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-6 text-center">
          No roles assigned yet. Users without a role default to Owner.
        </p>
      ) : (
        <div className="space-y-3">
          {roles.map((row) => (
            <div
              key={row.id}
              className="rounded-[12px] p-4"
              style={{ background: "rgba(255,255,255,0.03)", border: "0.5px solid var(--border)" }}
            >
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[14px] font-medium truncate">{row.userEmail}</div>
                  <div className="text-[12px] text-muted-foreground">
                    {(row.clientAccess || []).length} client
                    {(row.clientAccess || []).length === 1 ? "" : "s"} assigned
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={row.role}
                    onChange={(e) => updateRole(row.id, { role: e.target.value })}
                    disabled={savingId === row.id}
                    className="h-8 rounded-[9px] px-2 text-[13px] font-medium outline-none"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "0.5px solid var(--border)",
                      color: ROLE_COLOR[row.role],
                    }}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABEL[r]}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={() => del(row.id)}
                    className="w-8 h-8 rounded-[9px] flex items-center justify-center hover:bg-foreground/5 text-muted-foreground"
                    title="Remove"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {row.role === "EDITOR" && (
                <div className="mt-3 pt-3" style={{ borderTop: "0.5px solid var(--border)" }}>
                  <div className="text-[12px] text-muted-foreground mb-2">Assigned clients</div>
                  <div className="flex flex-wrap gap-2">
                    {clients.length === 0 ? (
                      <span className="text-[12px] text-muted-foreground">No clients yet.</span>
                    ) : (
                      clients.map((c) => {
                        const on = (row.clientAccess || []).includes(c.id);
                        return (
                          <button
                            key={c.id}
                            onClick={() => toggleAccess(row, c.id)}
                            className="h-7 px-2.5 rounded-full text-[12px] font-medium transition-colors"
                            style={
                              on
                                ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                                : {
                                    background: "rgba(255,255,255,0.05)",
                                    color: "hsl(var(--muted-foreground))",
                                    border: "0.5px solid var(--border)",
                                  }
                            }
                          >
                            {c.name}
                          </button>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {addOpen && (
        <AddRoleModal clients={clients} onClose={() => setAddOpen(false)} onSaved={() => { setAddOpen(false); load(); }} />
      )}
    </div>
  );
}

function AddRoleModal({ clients, onClose, onSaved }) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("EDITOR");
  const [access, setAccess] = useState([]);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

  function toggle(id) {
    setAccess((a) => (a.includes(id) ? a.filter((x) => x !== id) : [...a, id]));
  }

  async function submit() {
    if (!email.trim()) {
      setErr("Email is required.");
      return;
    }
    setSaving(true);
    setErr("");
    try {
      await base44.entities.UserRole.create({
        userEmail: email.trim().toLowerCase(),
        role,
        clientAccess: role === "EDITOR" ? access : [],
      });
      onSaved();
    } catch (e) {
      setErr(e.message || "Could not save role.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[18px] font-semibold tracking-tight">Assign role</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-3">
          <label className="block">
            <span className="block text-[12px] font-medium text-muted-foreground mb-1">User email</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="editor@agency.com"
              className="w-full h-9 rounded-[9px] px-3 text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
            />
          </label>
          <label className="block">
            <span className="block text-[12px] font-medium text-muted-foreground mb-1">Role</span>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full h-9 rounded-[9px] px-3 text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </select>
          </label>
          {role === "EDITOR" && (
            <div>
              <span className="block text-[12px] font-medium text-muted-foreground mb-2">Assigned clients</span>
              <div className="flex flex-wrap gap-2">
                {clients.map((c) => {
                  const on = access.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className="h-7 px-2.5 rounded-full text-[12px] font-medium transition-colors"
                      style={
                        on
                          ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
                          : { background: "rgba(255,255,255,0.05)", color: "hsl(var(--muted-foreground))", border: "0.5px solid var(--border)" }
                      }
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        {err && <p className="text-[13px] mt-3" style={{ color: "hsl(var(--destructive))" }}>{err}</p>}
        <div className="flex items-center justify-end gap-2 mt-5">
          <button onClick={onClose} className="h-9 px-3 rounded-[10px] text-[14px] font-medium hover:bg-foreground/5">Cancel</button>
          <button onClick={submit} disabled={saving} className="h-9 px-4 rounded-[10px] text-[14px] font-medium bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {saving ? "Saving…" : "Save role"}
          </button>
        </div>
      </div>
    </div>
  );
}