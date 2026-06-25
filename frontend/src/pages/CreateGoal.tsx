import React, { useState } from 'react';
import { createGoal, Goal, Subtask, ScheduledBlock } from '../services/api';
import { Target, Calendar, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface CreateGoalProps {
  setCurrentPage: (page: string) => void;
  onGoalCreated: (goal: Goal, subtasks: Subtask[], blocks: ScheduledBlock[]) => void;
}

export default function CreateGoal({ setCurrentPage, onGoalCreated }: CreateGoalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !deadline || !priority) {
      setError('Title, deadline, and priority level are required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Sending goal payload to backend POST /goals...');
      const response = await createGoal({
        title,
        description,
        deadline: new Date(deadline).toISOString(),
        priority,
      });

      console.log('Goal created successfully:', response);
      // Callback to save to main app state
      onGoalCreated(response.goal, response.subtasks, response.scheduled_blocks);
      // Navigate to the AI breakdown page
      setCurrentPage('ai-breakdown');
    } catch (err: any) {
      console.error('Error creating goal:', err);
      setError('Failed to create goal. Make sure your server is online and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 px-6 py-12 flex items-center justify-center relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-1/4 left-1/2 w-80 h-80 bg-[#7C3AED]/5 blur-[100px] rounded-full pointer-events-none -translate-x-1/2" />

      <div className="max-w-lg w-full bg-[#111827] border border-slate-800 rounded-2xl p-6 md:p-8 z-10 space-y-6">
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full bg-[#7C3AED]/10 text-[#7C3AED] border border-[#7C3AED]/20 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
            <span>Autonomous Architect</span>
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Initialize Goal Trajectory</h2>
          <p className="text-xs text-slate-400 font-medium">
            Gemini will automatically partition your objective into timelines.
          </p>
        </div>

        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl flex items-center space-x-2 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Goal Title */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Goal Title</label>
            <div className="relative">
              <Target className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Integrate Stripe payment gateways"
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors"
              />
            </div>
          </div>

          {/* Goal Description */}
          <div className="space-y-1.5">
            <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Description (Optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, constraints, or sub-scopes to guide Gemini..."
              rows={3}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-[#06B6D4] transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Target Deadline */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Target Deadline</label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  required
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl py-3 pl-10 pr-4 text-sm text-slate-200 focus:outline-none focus:border-[#06B6D4] transition-colors"
                />
              </div>
            </div>

            {/* Goal Priority */}
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Priority Level</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-sm text-slate-300 focus:outline-none focus:border-[#06B6D4] transition-colors"
              >
                <option value="High">🔴 High Priority</option>
                <option value="Medium">🟡 Medium Priority</option>
                <option value="Low">🟢 Low Priority</option>
              </select>
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] text-sm font-extrabold text-white flex items-center justify-center space-x-2 shadow-lg shadow-[#7C3AED]/10 hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <span className="flex items-center space-x-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Gemini partitioning goals...</span>
              </span>
            ) : (
              <span className="flex items-center space-x-2">
                <span>Generate Subtask Breakdown</span>
                <ArrowRight className="w-4 h-4" />
              </span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
