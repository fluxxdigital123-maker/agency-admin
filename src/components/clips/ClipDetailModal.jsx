import React from "react";
import { X, ExternalLink } from "lucide-react";
import HooksCaptionsAssistant from "@/components/clips/HooksCaptionsAssistant";

const PLATFORM_LABEL = {
  YOUTUBE_SHORTS: "YouTube Shorts",
  TIKTOK: "TikTok",
  INSTAGRAM_REELS: "Instagram Reels",
  X: "X",
  LINKEDIN: "LinkedIn",
};

export default function ClipDetailModal({ clip, onClose }) {
  if (!clip) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="glass-modal w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="min-w-0">
            <h3 className="text-[18px] font-semibold tracking-tight truncate">{clip.title}</h3>
            <div className="flex items-center gap-2 mt-1 text-[12px] text-muted-foreground">
              <span>{PLATFORM_LABEL[clip.platform] || clip.platform}</span>
              {clip.sourceVideoUrl && (
                <a href={clip.sourceVideoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 hover:text-primary">
                  <ExternalLink className="w-3 h-3" /> source
                </a>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-foreground/5 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        <HooksCaptionsAssistant clip={clip} />
      </div>
    </div>
  );
}