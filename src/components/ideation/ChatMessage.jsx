import React from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles } from "lucide-react";

export default function ChatMessage({ role, content, loading }) {
  const isUser = role === "user";

  if (loading) {
    return (
      <div className="flex gap-3">
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.2), rgba(100,210,255,0.2))" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-teal))" }} />
        </div>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }}
        >
          <div className="flex gap-1 items-center h-5">
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "0ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "150ms" }} />
            <span className="w-2 h-2 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      {!isUser && (
        <div
          className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5"
          style={{ background: "linear-gradient(135deg, rgba(10,132,255,0.2), rgba(100,210,255,0.2))" }}
        >
          <Sparkles className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-teal))" }} />
        </div>
      )}
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed`}
        style={
          isUser
            ? { background: "hsl(var(--primary))", color: "hsl(var(--primary-foreground))" }
            : { background: "rgba(255,255,255,0.04)", border: "0.5px solid rgba(255,255,255,0.08)" }
        }
      >
        {isUser ? (
          <p className="whitespace-pre-wrap">{content}</p>
        ) : (
          <div className="chat-md">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}