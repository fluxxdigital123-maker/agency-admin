import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { ShieldCheck, Loader2, X } from "lucide-react";

export default function SuperAdminModal({ onClose, onRevealEmail }) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const res = await base44.functions.invoke("verifySuperAdmin", { password });
      const data = res && res.data ? res.data : res;
      if (data.ok) {
        if (data.email) {
          onRevealEmail(data.email);
          setInfo("Super admin recognized — enter your password to sign in.");
        } else {
          setInfo("Access granted. No admin email is stored yet — set one in Settings.");
        }
      } else {
        setError(data.message || "Incorrect password.");
      }
    } catch (err) {
      setError(err.message || "Verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(20px)" }}
    >
      <div className="glass-modal w-full max-w-sm p-6 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="w-5 h-5" />
        </button>
        <div
          className="w-10 h-10 rounded-2xl flex items-center justify-center mb-3"
          style={{ background: "rgba(255,159,10,0.12)" }}
        >
          <ShieldCheck className="w-5 h-5" style={{ color: "#FF9F0A" }} />
        </div>
        <h2 className="text-[18px] font-semibold tracking-tight">Super Admin Access</h2>
        <p className="text-[13px] text-muted-foreground mt-1 mb-4">
          Enter the super admin password to reveal the admin account.
        </p>
        {error && (
          <div
            className="mb-3 p-2.5 rounded-lg text-[13px]"
            style={{ background: "rgba(255,69,58,0.1)", color: "#FF453A" }}
          >
            {error}
          </div>
        )}
        {info && (
          <div
            className="mb-3 p-2.5 rounded-lg text-[13px]"
            style={{ background: "rgba(48,209,88,0.1)", color: "#30D158" }}
          >
            {info}
          </div>
        )}
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Super admin password"
            autoFocus
            className="w-full h-10 rounded-[10px] px-3 text-[14px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
          />
          <button
            type="submit"
            disabled={loading || !password}
            className="w-full h-10 rounded-[10px] text-[14px] font-medium disabled:opacity-40"
            style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}