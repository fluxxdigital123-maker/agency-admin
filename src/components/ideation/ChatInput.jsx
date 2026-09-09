import React, { useState, useRef, useEffect } from "react";
import { Send, Loader2 } from "lucide-react";

export default function ChatInput({ onSend, loading, placeholder }) {
  const [value, setValue] = useState("");
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  }, [value]);

  function submit() {
    const v = value.trim();
    if (!v || loading) return;
    onSend(v);
    setValue("");
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div
        className="flex items-end gap-2 p-2"
        style={{
          borderRadius: 20,
          background: "rgba(255,255,255,0.04)",
          border: "0.5px solid rgba(255,255,255,0.10)",
          backdropFilter: "blur(40px) saturate(180%)",
        }}
      >
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "Message Ideation…"}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none px-3 py-2 text-[15px] leading-relaxed placeholder:text-muted-foreground/60"
          style={{ maxHeight: 200 }}
        />
        <button
          onClick={submit}
          disabled={loading || !value.trim()}
          className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-opacity disabled:opacity-40 hover:opacity-85"
          style={{ background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-center text-[11px] text-muted-foreground/60 mt-1.5">
        Enter to send · Shift+Enter for newline
      </p>
    </div>
  );
}