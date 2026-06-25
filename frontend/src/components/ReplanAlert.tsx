import React from 'react';
import { AlertCircle, ArrowRight, BellRing, Sparkles, X } from 'lucide-react';
import { ReplanLog } from '../services/api';

interface ReplanAlertProps {
  newReplans: ReplanLog[];
  onDismiss: () => void;
}

export default function ReplanAlert({ newReplans, onDismiss }: ReplanAlertProps) {
  if (newReplans.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-[#111827] border-2 border-[#7C3AED] shadow-2xl shadow-[#7C3AED]/20 rounded-xl p-5 relative overflow-hidden">
        {/* Glow accent */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/10 blur-2xl rounded-full -mr-8 -mt-8 pointer-events-none" />
        
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-[#06B6D4]">KaryaPath Autonomous Agent</span>
              <h4 className="text-sm font-extrabold text-white">Dynamic Replan Interventions ({newReplans.length})</h4>
            </div>
          </div>
          <button 
            onClick={onDismiss} 
            className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
          {newReplans.map((replan, idx) => (
            <div 
              key={replan.id || idx} 
              className="border-l-2 border-[#06B6D4] bg-slate-900/60 p-3 rounded-r-lg space-y-2 border border-slate-800/40"
            >
              <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                <span className="flex items-center space-x-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{replan.trigger_reason}</span>
                </span>
                <span className="text-slate-500 font-mono">
                  {new Date(replan.triggered_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-medium">
                {replan.ai_reasoning}
              </p>
              <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-800/80 pt-1.5">
                <span className="flex items-center space-x-1">
                  <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                  <span>Gemini Reasoning</span>
                </span>
                <span className="text-emerald-400 flex items-center space-x-0.5">
                  <span>Rescheduled</span>
                  <ArrowRight className="w-3 h-3 ml-0.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 flex justify-end">
          <button 
            onClick={onDismiss}
            className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-xs font-bold text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
          >
            Acknowledge Replan
          </button>
        </div>
      </div>
    </div>
  );
}
