import React, { useState } from "react";
import { Link } from "react-router-dom";
import { KeyRound, ChevronDown, ChevronRight, Wrench } from "lucide-react";

export default function ConnectKeyBanner() {
  const [open, setOpen] = useState(false);
  return (
    <div className="glass-card p-5 flex flex-col sm:flex-row sm:items-center gap-4">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0"
        style={{ background: "rgba(255,159,10,0.12)", border: "0.5px solid rgba(255,159,10,0.25)" }}
      >
        <KeyRound className="w-5 h-5" style={{ color: "#FF9F0A" }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-medium">Connect your YouTube API key to auto-pull analytics</p>
        <p className="text-[13px] text-muted-foreground mt-0.5">
          Without a key you can still add snapshots manually per client. Automatic pulls need a YouTube Data API v3 key.
        </p>
        <button
          onClick={() => setOpen((o) => !o)}
          className="mt-2 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:opacity-80"
        >
          <Wrench className="w-3.5 h-3.5" /> Here&apos;s how
          {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>
        {open && (
          <ol className="mt-3 list-decimal pl-4 space-y-1.5 text-[13px] text-muted-foreground max-w-xl">
            <li>Open Google Cloud Console and enable &quot;YouTube Data API v3&quot;.</li>
            <li>Create an API key under Credentials.</li>
            <li>
              Go to <Link to="/settings" className="text-primary underline">Settings → YouTube API</Link> and paste it.
            </li>
            <li>Return here and click &quot;Pull from YouTube&quot;.</li>
          </ol>
        )}
      </div>
      <Link
        to="/settings"
        className="h-9 px-4 rounded-[10px] text-[13px] font-medium inline-flex items-center justify-center shrink-0"
        style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
      >
        Go to Settings
      </Link>
    </div>
  );
}