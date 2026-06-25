import React from 'react';
import { Calendar, Target, AlertTriangle } from 'lucide-react';
import ProgressBar from './ProgressBar';
import { Goal, Subtask } from '../services/api';

interface GoalCardProps {
  key?: React.Key;
  goal: Goal;
  subtasks: Subtask[];
  onClick?: () => void;
}

export default function GoalCard({ goal, subtasks, onClick }: GoalCardProps) {
  const goalSubtasks = subtasks.filter(t => t.goal_id === goal.id);
  const completed = goalSubtasks.filter(t => t.status === 'completed').length;
  const total = goalSubtasks.length;
  const progress = total > 0 ? (completed / total) * 100 : 0;

  const priorityColor = {
    High: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    Medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    Low: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  }[goal.priority] || 'bg-slate-500/10 text-slate-400 border-slate-500/20';

  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <div 
      id={`goal-card-${goal.id}`}
      onClick={onClick}
      className="bg-[#111827] border border-slate-800 hover:border-slate-700/80 p-5 rounded-xl cursor-pointer hover:shadow-lg hover:shadow-[#7C3AED]/5 transition-all duration-300 flex flex-col justify-between group"
    >
      <div>
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Target className="w-5 h-5 text-[#7C3AED] group-hover:scale-110 transition-transform duration-300" />
            <h3 className="font-bold text-slate-100 group-hover:text-white text-lg transition-colors duration-250">
              {goal.title}
            </h3>
          </div>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${priorityColor}`}>
            {goal.priority}
          </span>
        </div>

        <p className="text-sm text-slate-400 line-clamp-2 mb-4 leading-relaxed">
          {goal.description || 'No additional description provided.'}
        </p>
      </div>

      <div className="space-y-4">
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Info stats footer */}
        <div className="flex items-center justify-between text-xs border-t border-slate-800/80 pt-3">
          <div className="flex items-center space-x-1.5 text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>
              {new Date(goal.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          </div>

          <div className="flex items-center space-x-1 font-medium">
            {isOverdue ? (
              <span className="flex items-center space-x-1 text-rose-400 bg-rose-500/5 px-2 py-0.5 rounded-md border border-rose-500/10">
                <AlertTriangle className="w-3 h-3" />
                <span>Overdue</span>
              </span>
            ) : (
              <span className={`px-2 py-0.5 rounded-md ${daysLeft <= 2 ? 'text-amber-400 bg-amber-500/10' : 'text-slate-400 bg-slate-800/50'}`}>
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </span>
            )}
            <span className="text-slate-500 ml-1">
              ({completed}/{total} tasks)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
