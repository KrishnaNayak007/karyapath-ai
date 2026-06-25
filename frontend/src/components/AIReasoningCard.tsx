import React from 'react';
import { Brain, Sparkles, MessageSquare } from 'lucide-react';

interface AIReasoningCardProps {
  key?: React.Key;
  reasoning: string;
  title?: string;
  triggerReason?: string;
  timestamp?: string;
}

export default function AIReasoningCard({ reasoning, title = 'Autonomous Agent Logic', triggerReason, timestamp }: AIReasoningCardProps) {
  return (
    <div className="bg-[#111827] border border-[#7C3AED]/30 rounded-xl p-5 relative overflow-hidden shadow-md shadow-[#7C3AED]/5">
      {/* Decorative pulse glow */}
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 blur-xl rounded-full" />

      <div className="flex items-start space-x-3.5">
        <div className="p-2 rounded-lg bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20">
          <Brain className="w-5 h-5 animate-pulse" />
        </div>
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h4 className="font-extrabold text-sm text-slate-100 flex items-center space-x-1.5">
              <span>{title}</span>
              <span className="flex items-center space-x-0.5 bg-[#06B6D4]/15 text-[#06B6D4] text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5 mr-0.5" />
                <span>Gemini 3.5</span>
              </span>
            </h4>
            {timestamp && (
              <span className="text-[10px] font-semibold text-slate-500 font-mono">
                {new Date(timestamp).toLocaleDateString()} {new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>

          {triggerReason && (
            <div className="text-xs font-bold text-amber-400 bg-amber-500/5 px-2 py-0.5 rounded-md border border-amber-500/10 inline-block">
              Trigger: {triggerReason}
            </div>
          )}

          <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-800/60 mt-2">
            <p className="text-sm text-slate-300 leading-relaxed font-medium italic flex items-start gap-2">
              <MessageSquare className="w-4 h-4 text-[#06B6D4] shrink-0 mt-0.5" />
              <span>"{reasoning}"</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
