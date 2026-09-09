import React, { useState, useEffect } from "react";
import { Loader2, Check, ShieldCheck, Eye, EyeOff } from "lucide-react";
import { upsertSetting, loadSettingsMap } from "@/lib/integrations";

export default function SuperAdminSettings() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [hasPw, setHasPw] = useState(false);

  useEffect(() => {
    loadSettingsMap().then((m) => {
      setEmail(m["super_admin_email"] || "");
      setHasPw(!!m["super_admin_password"]);
    });
  }, []);

  async function save() {
    setSaving(true);
    try {
      if (email) await upsertSetting("super_admin_email", email);
      if (password) await upsertSetting("super_admin_password", password);
      setHasPw(!!password || hasPw);
      setPassword("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <ShieldCheck className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
        <h2 className="text-[18px] font-semibold tracking-tight">Super Admin Access</h2>
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        Set a shared password for the "Super Admin Access" button on the login screen. Entering it
        reveals the admin email so you can sign in.
      </p>
      <div className="space-y-3">
        <div>
          <label className="text-[12px] text-muted-foreground">
            Admin email (revealed on correct password)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="admin@agency.com"
            className="w-full h-9 rounded-[9px] px-3 text-[14px] outline-none mt-1"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
          />
        </div>
        <div>
          <label className="text-[12px] text-muted-foreground">
            Super admin password {hasPw ? "(set — enter a new one to replace)" : ""}
          </label>
          <div className="relative mt-1">
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Set a password"
              className="w-full h-9 rounded-[9px] px-3 pr-9 text-[14px] outline-none"
              style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
            />
            <button
              onClick={() => setShow((s) => !s)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
            >
              {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <button
          onClick={save}
          disabled={saving || (!email && !password)}
          className="h-9 px-4 rounded-[9px] text-[13px] font-medium inline-flex items-center gap-1.5 disabled:opacity-40"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}{" "}
          {saved ? "Saved" : "Save"}
        </button>
      </div>
    </div>
  );
}