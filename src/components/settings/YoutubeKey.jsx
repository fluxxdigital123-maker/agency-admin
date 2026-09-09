import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Loader2, Check, KeyRound, Eye, EyeOff } from "lucide-react";

export default function YoutubeKey() {
  const [key, setKey] = useState("");
  const [configured, setConfigured] = useState(false);
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.AppSetting.list()
      .then((rows) => {
        const f = (rows || []).find((r) => r.key === "youtube_key_configured");
        setConfigured(!!(f && f.value === "true"));
      })
      .catch(() => {});
  }, []);

  async function save() {
    const v = key.trim();
    if (saving) return;
    setSaving(true);
    try {
      const rows = await base44.entities.AppSetting.list();
      const keyRow = (rows || []).find((r) => r.key === "youtube_api_key");
      const flagRow = (rows || []).find((r) => r.key === "youtube_key_configured");
      if (keyRow) await base44.entities.AppSetting.update(keyRow.id, { value: v });
      else await base44.entities.AppSetting.create({ key: "youtube_api_key", value: v });
      const flagVal = v ? "true" : "false";
      if (flagRow) await base44.entities.AppSetting.update(flagRow.id, { value: flagVal });
      else await base44.entities.AppSetting.create({ key: "youtube_key_configured", value: flagVal });
      setConfigured(!!v);
      setKey("");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-1">
        <KeyRound className="w-[18px] h-[18px]" style={{ color: "#FF9F0A" }} />
        <h2 className="text-[18px] font-semibold tracking-tight">YouTube API</h2>
        {configured && (
          <span
            className="ml-auto inline-flex items-center gap-1 text-[12px] font-medium"
            style={{ color: "#30D158" }}
          >
            <Check className="w-3.5 h-3.5" /> Connected
          </span>
        )}
      </div>
      <p className="text-[13px] text-muted-foreground mb-4">
        A YouTube Data API v3 key lets the Analytics tab auto-pull subscribers, total views, and top videos for each client channel.
      </p>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type={show ? "text" : "password"}
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={configured ? "Enter a new key to replace the saved one" : "Paste your YouTube Data API v3 key"}
            className="w-full h-10 rounded-[10px] px-3 pr-10 text-[14px] outline-none"
            style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid var(--border)" }}
          />
          <button
            onClick={() => setShow((s) => !s)}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:opacity-70"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <button
          onClick={save}
          disabled={saving || !key.trim()}
          className="h-10 px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center gap-1.5 transition-opacity disabled:opacity-40"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : null}
          {saved ? "Saved" : "Save key"}
        </button>
      </div>
      <p className="text-[12px] text-muted-foreground/70 mt-2">
        Get a key from Google Cloud Console → YouTube Data API v3 → Credentials. The key is stored server-side and only used for analytics pulls.
      </p>
    </div>
  );
}