import React from 'react';
import { Sparkles, Brain, Clock, ShieldCheck, ArrowRight, ArrowLeft } from 'lucide-react';
import { Goal, Subtask } from '../services/api';

interface AIBreakdownProps {
  goal: Goal | null;
  subtasks: Subtask[];
  setCurrentPage: (page: string) => void;
}

export default function AIBreakdown({ goal, subtasks, setCurrentPage }: AIBreakdownProps) {
  if (!goal) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-slate-400 font-medium">No goal currently loaded for breakdown.</p>
        <button
          onClick={() => setCurrentPage('create-goal')}
          className="px-4 py-2 bg-[#7C3AED] rounded-lg text-sm font-bold hover:bg-violet-600 transition-colors cursor-pointer"
        >
          Create Goal
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 px-6 py-12 relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#06B6D4]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 z-10 relative">
        {/* Header summary */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#06B6D4]">
            <Brain className="w-5 h-5 text-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-widest">Goal Breakdown Complete</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Gemini Partition Strategy: {goal.title}
          </h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
            Google Gemini has parsed your goal: <span className="text-slate-300">"{goal.description}"</span> and partitioned it into individual actionable milestones to guarantee compliance with your deadline on {new Date(goal.deadline).toLocaleDateString()}.
          </p>
        </div>

        {/* Subtask listing */}
        <div className="space-y-4">
          <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Action Plan Milestones</h3>
          
          <div className="space-y-3">
            {subtasks.map((task, idx) => (
              <div 
                key={task.id || idx}
                className="bg-[#111827] border border-slate-800 p-5 rounded-xl hover:border-slate-700/80 transition-all duration-300 flex items-start justify-between gap-4 group"
              >
                <div className="flex items-start space-x-4">
                  {/* Step counter */}
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 font-mono text-xs font-bold text-[#06B6D4] group-hover:border-[#7C3AED]/30 group-hover:text-white transition-all">
                    0{idx + 1}
                  </span>
                  
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-100 group-hover:text-white text-base">
                      {task.title}
                    </h4>
                    <div className="flex items-center space-x-4 text-xs text-slate-400 font-medium">
                      <span className="flex items-center space-x-1.5">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>{task.estimated_minutes} minutes estimated</span>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Confidence indicator badge */}
                {task.confidence && (
                  <span className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#06B6D4]/10 text-[#06B6D4] border border-[#06B6D4]/10 text-xs font-bold font-mono self-center">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#7C3AED]" />
                    <span>{task.confidence} Match</span>
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
          <button
            onClick={() => setCurrentPage('create-goal')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Re-configure Goal</span>
          </button>

          <button
            onClick={() => setCurrentPage('review-schedule')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-extrabold text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/10 group"
          >
            <span>Proceed to Schedule Review</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
