import React from 'react';
import { Target, Sparkles, Clock, BellRing, ArrowRight, Brain, Zap, ArrowUpRight } from 'lucide-react';

interface LandingProps {
  setCurrentPage: (page: string) => void;
}

export default function Landing({ setCurrentPage }: LandingProps) {
  return (
    <div className="relative min-h-[calc(100vh-73px)] flex flex-col justify-between overflow-hidden bg-[#0B1120] text-slate-100 px-6 py-12 md:py-20">
      {/* Decorative ambient blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#06B6D4]/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full z-10 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-1 px-3 py-1 bg-gradient-to-r from-[#7C3AED]/25 to-[#06B6D4]/25 border border-[#7C3AED]/35 rounded-full text-xs font-bold text-white tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Autonomous Agent Companion</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            The Autonomous Goal Companion that{' '}
            <span className="bg-gradient-to-r from-[#7C3AED] via-violet-400 to-[#06B6D4] bg-clip-text text-transparent">
              Replans Itself.
            </span>
          </h1>

          <p className="text-base md:text-xl text-slate-400 leading-relaxed max-w-2xl mx-auto font-medium">
            Unlike standard calendar apps, KaryaPath AI breaks down your goals, builds schedules, and automatically shifts missed tasks in real-time to guarantee on-time completion.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setCurrentPage('create-goal')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-extrabold text-white shadow-lg shadow-[#7C3AED]/15 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer group"
            >
              <span>Create Your First Goal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => setCurrentPage('dashboard')}
              className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-[#111827] text-sm font-bold text-slate-200 border border-slate-800 hover:border-slate-700 hover:text-white transition-all cursor-pointer"
            >
              <span>View Workspace</span>
              <ArrowUpRight className="w-4 h-4 text-[#06B6D4]" />
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-6 pt-8">
          {/* Card 1 */}
          <div className="bg-[#111827] border border-slate-800/85 p-6 rounded-2xl hover:border-[#7C3AED]/30 transition-all duration-300 group">
            <div className="p-3 bg-[#7C3AED]/10 text-[#7C3AED] rounded-xl w-fit border border-[#7C3AED]/20 mb-5 group-hover:scale-105 transition-all">
              <Brain className="w-6 h-6 text-[#06B6D4]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Gemini Breakdown</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Simply express a goal. Gemini parses details, estimates subtask durations, and maps schedules optimally.
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-[#111827] border border-slate-800/85 p-6 rounded-2xl hover:border-[#06B6D4]/30 transition-all duration-300 group">
            <div className="p-3 bg-[#06B6D4]/10 text-[#06B6D4] rounded-xl w-fit border border-[#06B6D4]/20 mb-5 group-hover:scale-105 transition-all">
              <Clock className="w-6 h-6 text-[#7C3AED]" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Google Calendar Integration</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              Auto-generate calendar schedules. Get customized work blocks pushed straight to your planner.
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-[#111827] border border-[#7C3AED]/20 p-6 rounded-2xl hover:border-[#7C3AED]/50 transition-all duration-300 shadow-lg shadow-[#7C3AED]/5 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-[#7C3AED]/5 blur-2xl rounded-full pointer-events-none" />
            <div className="p-3 bg-rose-500/10 text-rose-400 rounded-xl w-fit border border-rose-500/20 mb-5 group-hover:scale-105 transition-all">
              <Zap className="w-6 h-6 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2 flex items-center space-x-1.5">
              <span>Autonomous Replanning</span>
              <span className="text-[10px] bg-rose-500/10 text-rose-400 px-1.5 py-0.5 rounded font-bold">Agent</span>
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              If a work block passes but the task is not complete, KaryaPath's agent detects it and replans slots automatically.
            </p>
          </div>
        </div>

        {/* Demo Section */}
        <div className="bg-[#111827]/60 border border-slate-800/80 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center space-x-2 text-amber-400">
              <BellRing className="w-5 h-5 animate-pulse" />
              <span className="font-bold text-sm tracking-wide uppercase">Centerpiece Innovation: AI Activity Feed</span>
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-white">Full Transparency Into Autonomous Decisions</h3>
            <p className="text-sm text-slate-400 leading-relaxed font-medium">
              No behind-the-scenes magic. Every rescheduling decision is explained in clear, friendly plain language with estimated time changes.
            </p>
          </div>
          <button
            onClick={() => setCurrentPage('dashboard')}
            className="w-full md:w-auto px-6 py-3 rounded-lg bg-slate-800 border border-slate-700 text-sm font-semibold hover:bg-slate-700/80 hover:text-white transition-all whitespace-nowrap cursor-pointer"
          >
            Launch Experience
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-xs text-slate-600 mt-12 pt-6 border-t border-slate-900">
        &copy; {new Date().getFullYear()} KaryaPath AI • Powered by Google Gemini. All rights reserved.
      </footer>
    </div>
  );
}
