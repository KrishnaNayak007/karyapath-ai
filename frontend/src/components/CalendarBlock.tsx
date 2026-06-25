import React from 'react';
import { Calendar, Clock, RotateCcw, AlertCircle } from 'lucide-react';
import { ScheduledBlock, Subtask } from '../services/api';

interface CalendarBlockProps {
  key?: React.Key;
  block: ScheduledBlock;
  subtask: Subtask;
  onClick?: () => void;
}

export default function CalendarBlock({ block, subtask, onClick }: CalendarBlockProps) {
  const start = new Date(block.start_time);
  const end = new Date(block.end_time);
  
  const isCompleted = subtask.status === 'completed';

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div
      id={`calendar-block-${block.id}`}
      onClick={onClick}
      className={`relative group border rounded-xl p-4 cursor-pointer transition-all duration-300 flex flex-col justify-between ${
        isCompleted
          ? 'bg-emerald-950/20 border-emerald-500/10 text-slate-500 opacity-60'
          : block.was_auto_rescheduled
            ? 'bg-[#111827] border-2 border-dashed border-[#7C3AED] shadow-md shadow-[#7C3AED]/5'
            : 'bg-[#111827] border-slate-800 hover:border-slate-700 hover:shadow-lg'
      }`}
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-1.5 flex-wrap">
          <span className="text-[10px] font-bold text-[#06B6D4] font-mono tracking-wider flex items-center gap-1">
            <Clock className="w-3 h-3 text-[#7C3AED]" />
            <span>{formatTime(start)} - {formatTime(end)}</span>
          </span>
          {block.was_auto_rescheduled && (
            <span className="flex items-center text-[9px] font-extrabold uppercase bg-[#7C3AED]/20 text-[#7C3AED] px-1.5 py-0.5 rounded border border-[#7C3AED]/30 animate-pulse">
              <RotateCcw className="w-2.5 h-2.5 mr-0.5" />
              <span>AI Replan</span>
            </span>
          )}
        </div>

        <h4 className={`text-xs font-bold leading-normal transition-colors duration-250 ${
          isCompleted ? 'line-through text-slate-500' : 'text-slate-200 group-hover:text-white'
        }`}>
          {subtask.title}
        </h4>
      </div>

      {block.was_auto_rescheduled && block.reschedule_reason && (
        <div className="mt-3 text-[10px] bg-slate-900/80 p-2 rounded-md border border-slate-800 text-slate-400 font-medium leading-relaxed italic line-clamp-2">
          "{block.reschedule_reason}"
        </div>
      )}

      {/* Footer details */}
      <div className="flex items-center justify-between text-[10px] text-slate-500 font-bold border-t border-slate-800/50 pt-2 mt-2">
        <span>{subtask.estimated_minutes} mins</span>
        <span className={isCompleted ? 'text-emerald-400' : 'text-amber-500'}>
          {isCompleted ? 'Done' : 'Pending'}
        </span>
      </div>
    </div>
  );
}
