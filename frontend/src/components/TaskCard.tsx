import React from 'react';
import { CheckCircle2, Clock, Sparkles } from 'lucide-react';
import { Subtask, completeSubtask } from '../services/api';

interface TaskCardProps {
  key?: React.Key;
  subtask: Subtask;
  onCompleted: () => void;
}

export default function TaskCard({ subtask, onCompleted }: TaskCardProps) {
  const [completing, setCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleComplete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (subtask.status === 'completed' || completing) return;

    setCompleting(true);
    setError(null);
    try {
      await completeSubtask(subtask.id);
      onCompleted();
    } catch (err) {
      console.error('Error completing task:', err);
      setError('Failed to update task.');
    } finally {
      setCompleting(false);
    }
  };

  const isCompleted = subtask.status === 'completed';

  return (
    <div 
      id={`task-card-${subtask.id}`}
      className={`border rounded-xl p-4 transition-all duration-300 ${
        isCompleted 
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
          : 'bg-[#111827] border-slate-800 hover:border-slate-700/80 hover:shadow-md hover:shadow-black/20'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start space-x-3 flex-1 min-w-0">
          {/* Custom interactive checkbox */}
          <button
            onClick={handleComplete}
            disabled={isCompleted || completing}
            className={`mt-0.5 w-5 h-5 rounded-md flex items-center justify-center border transition-all duration-200 cursor-pointer ${
              isCompleted 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : completing
                  ? 'border-slate-600 animate-pulse'
                  : 'border-slate-700 hover:border-[#06B6D4] bg-slate-900'
            }`}
          >
            {isCompleted && <CheckCircle2 className="w-4 h-4" />}
            {completing && <span className="w-2.5 h-2.5 rounded-full bg-[#06B6D4] animate-ping" />}
          </button>

          <div className="flex-1 min-w-0">
            <h4 className={`font-semibold text-sm transition-all duration-300 ${
              isCompleted ? 'text-slate-500 line-through' : 'text-slate-200'
            }`}>
              {subtask.title}
            </h4>

            {error && <span className="text-rose-400 text-xs mt-1 block">{error}</span>}

            <div className="flex items-center space-x-4 mt-2.5 text-xs text-slate-400 font-medium">
              <span className="flex items-center space-x-1">
                <Clock className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>{subtask.estimated_minutes} min</span>
              </span>

              {subtask.confidence && (
                <span className="flex items-center space-x-1 bg-[#7C3AED]/5 text-[#7C3AED] border border-[#7C3AED]/10 px-1.5 py-0.5 rounded">
                  <Sparkles className="w-3 h-3 text-[#06B6D4]" />
                  <span>{subtask.confidence} Gemini confidence</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
