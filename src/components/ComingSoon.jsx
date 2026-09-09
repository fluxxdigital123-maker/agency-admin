import React from "react";
import { Sparkles } from "lucide-react";

export default function ComingSoon({ title, description }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[62vh] py-10">
      <div className="glass-card w-full max-w-lg px-10 py-12 md:px-14 md:py-14 text-center">
        <div className="mx-auto w-12 h-12 rounded-2xl flex items-center justify-center mb-6"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.18), rgba(100,210,255,0.18))", border: "0.5px solid rgba(255,255,255,0.08)" }}>
          <Sparkles className="w-5 h-5" style={{ color: "hsl(var(--accent-teal))" }} />
        </div>
        <div className="text-[13px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Coming soon
        </div>
        <h1 className="mt-3 text-[28px] md:text-[32px] font-semibold tracking-tight">
          {title}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground max-w-md mx-auto">
          {description || "This module is being crafted. Check back shortly."}
        </p>
      </div>
    </div>
  );
}