import React, { useState } from 'react';
import { Calendar, Clock, Sparkles, Check, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Goal, Subtask, ScheduledBlock } from '../services/api';

interface ReviewScheduleProps {
  goal: Goal | null;
  subtasks: Subtask[];
  blocks: ScheduledBlock[];
  setCurrentPage: (page: string) => void;
  currentUser: { email: string; name: string; avatarUrl: string } | null;
}

export default function ReviewSchedule({ goal, subtasks, blocks, setCurrentPage, currentUser }: ReviewScheduleProps) {
  const [synced, setSynced] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [approved, setApproved] = useState(false);

  if (!goal) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-slate-400 font-medium">No goal currently loaded for review.</p>
        <button
          onClick={() => setCurrentPage('create-goal')}
          className="px-4 py-2 bg-[#7C3AED] rounded-lg text-sm font-bold hover:bg-violet-600 transition-colors cursor-pointer"
        >
          Create Goal
        </button>
      </div>
    );
  }

  const handleSync = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSynced(true);
    }, 1500);
  };

  const handleApprove = () => {
    setApproved(true);
    setTimeout(() => {
      setCurrentPage('dashboard');
    }, 1000);
  };

  const formatDateTime = (isoStr: string) => {
    const d = new Date(isoStr);
    return {
      date: d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' }),
      time: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 px-6 py-12 relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#7C3AED]/5 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-3xl mx-auto space-y-8 z-10 relative">
        {/* Header */}
        <div className="space-y-3">
          <div className="flex items-center space-x-2 text-[#06B6D4]">
            <Calendar className="w-5 h-5 text-[#7C3AED]" />
            <span className="text-xs font-bold uppercase tracking-widest">Autonomous Scheduler</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Review Calendar Allocation</h2>
          <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-2xl">
            Gemini has allocated separate blocks of focus time for each subtask between now and your deadline.
          </p>
        </div>

        {/* Schedule grid timeline */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-widest text-slate-400">Scheduled Focus Blocks</h3>
            <span className="text-xs bg-[#06B6D4]/10 text-[#06B6D4] px-2 py-0.5 rounded font-mono font-bold">
              {blocks.length} Blocks Created
            </span>
          </div>

          <div className="space-y-3 relative before:absolute before:top-2 before:bottom-2 before:left-[105px] before:w-[1px] before:bg-slate-800">
            {blocks.map((block, idx) => {
              const subtask = subtasks.find(t => t.id === block.subtask_id) || { title: 'Unknown Task', estimated_minutes: 60 };
              const { date, time } = formatDateTime(block.start_time);
              const endTime = formatDateTime(block.end_time).time;

              return (
                <div key={block.id || idx} className="flex gap-6 relative group">
                  {/* Left Column: Date / Time badge */}
                  <div className="w-[85px] shrink-0 text-right space-y-1 pt-1.5">
                    <div className="text-xs font-extrabold text-[#06B6D4] uppercase tracking-wide">{date}</div>
                    <div className="text-[10px] font-bold text-slate-500 font-mono">{time}</div>
                  </div>

                  {/* Visual bullet on timeline line */}
                  <span className="absolute left-[101px] top-[14px] w-2.5 h-2.5 rounded-full bg-[#7C3AED] border border-[#0B1120] group-hover:scale-125 transition-transform" />

                  {/* Right Column: Card element */}
                  <div className="flex-1 bg-[#111827] border border-slate-800 hover:border-slate-700/80 p-4 rounded-xl transition-all duration-300 flex items-start justify-between gap-4">
                    <div className="space-y-2">
                      <h4 className="font-bold text-sm text-slate-100 group-hover:text-white transition-colors">
                        {subtask.title}
                      </h4>
                      <div className="flex items-center space-x-3 text-xs text-slate-400 font-medium">
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>{subtask.estimated_minutes} mins</span>
                        </span>
                        <span>•</span>
                        <span className="text-slate-500 font-mono">End: {endTime}</span>
                      </div>
                    </div>

                    <div className="px-2 py-1 rounded bg-[#7C3AED]/5 border border-[#7C3AED]/10 text-[10px] font-extrabold text-[#7C3AED] uppercase tracking-wider select-none">
                      Focus Slot
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sync panel */}
        <div className="bg-[#111827]/80 border border-slate-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5 shadow-inner">
          <div className="space-y-1">
            <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-1.5">
              <Sparkles className="w-4 h-4 text-[#06B6D4]" />
              <span>Google Calendar Sync</span>
            </h4>
            <p className="text-xs text-slate-400 font-medium">
              Push these Focus Slots automatically to Google Calendar {currentUser ? `(${currentUser.email})` : ''} as active appointments.
            </p>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing || synced}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
              synced
                ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                : syncing
                  ? 'bg-slate-800 text-slate-400 border border-slate-700 animate-pulse'
                  : 'bg-[#111827] text-white border border-slate-700 hover:border-white hover:bg-slate-900'
            }`}
          >
            {synced ? (
              <span className="flex items-center space-x-1">
                <Check className="w-3.5 h-3.5" />
                <span>Synced to Calendar</span>
              </span>
            ) : syncing ? (
              <span>Syncing Slots...</span>
            ) : (
              <span>Sync with Google Calendar</span>
            )}
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-800/80 pt-6">
          <button
            onClick={() => setCurrentPage('ai-breakdown')}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-5 py-3 rounded-xl text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-900/50 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Breakdown</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={approved}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 px-8 py-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-extrabold text-white hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer shadow-lg shadow-[#7C3AED]/15 group disabled:opacity-50"
          >
            {approved ? (
              <span className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 animate-bounce" />
                <span>Schedule Locked!</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Approve & Lock Schedule</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
