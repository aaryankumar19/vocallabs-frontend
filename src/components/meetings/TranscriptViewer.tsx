import React from "react";
import { Sparkles, MessageSquare, Clock } from "lucide-react";
import { TranscriptItem } from "@/lib/api";

interface TranscriptViewerProps {
  transcript: TranscriptItem[];
}

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({ transcript }) => {
  return (
    <div className="space-y-4">
      {/* Transcript Toolbar */}
      <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-950/60 border border-white/5 text-xs">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          <span className="font-semibold text-slate-200">
            Speech-to-Text Synchronized Audio Transcript
          </span>
        </div>
        <span className="text-slate-400 font-mono text-[11px]">{transcript.length} segments</span>
      </div>

      {/* Transcript Dialogue List */}
      <div className="space-y-3">
        {transcript.map((line, idx) => (
          <div
            key={line.id || idx}
            className="rounded-2xl p-4 bg-slate-950/40 border border-white/5 hover:border-white/10 transition-colors space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs font-mono text-[11px]">
              <span className="font-bold text-cyan-400">
                {line.speaker || `Speaker ${(idx % 3) + 1}`}
              </span>
              {line.timestamp && <span className="text-slate-400">{line.timestamp}</span>}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed pl-2">"{line.text}"</p>
          </div>
        ))}
      </div>
    </div>
  );
};
