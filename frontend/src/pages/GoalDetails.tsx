import React, { useEffect, useState } from 'react';
import { getDashboard, Goal, Subtask, ScheduledBlock, ReplanLog } from '../services/api';
import TaskCard from '../components/TaskCard';
import CalendarBlock from '../components/CalendarBlock';
import ProgressBar from '../components/ProgressBar';
import AIReasoningCard from '../components/AIReasoningCard';
import { Target, Calendar, Clock, AlertCircle, ArrowLeft, History, ShieldCheck, Sparkles, AlertTriangle } from 'lucide-react';

interface GoalDetailsProps {
  key?: React.Key;
  goalId: string;
  setCurrentPage: (page: string) => void;
}

export default function GoalDetails({ goalId, setCurrentPage }: GoalDetailsProps) {
  const [data, setData] = useState<{
    goals: Goal[];
    subtasks: Subtask[];
    scheduled_blocks: ScheduledBlock[];
    replan_logs: ReplanLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);

  const fetchGoalData = async () => {
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoalData();
  }, [goalId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] space-y-4 bg-[#0B1120]">
        <div className="w-12 h-12 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading goal trajectory details...</p>
      </div>
    );
  }

  const goal = data?.goals.find(g => g.id === goalId);
  if (!goal) {
    return (
      <div className="min-h-[calc(100vh-73px)] bg-[#0B1120] text-slate-100 flex flex-col items-center justify-center p-6 space-y-4">
        <p className="text-slate-400 font-medium">Trajectory ID not found.</p>
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="px-4 py-2 bg-[#7C3AED] rounded-lg text-sm font-bold hover:bg-violet-600 transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const goalSubtasks = data?.subtasks.filter(t => t.goal_id === goalId) || [];
  const completedCount = goalSubtasks.filter(t => t.status === 'completed').length;
  const totalCount = goalSubtasks.length;
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // Filter blocks belonging to this goal's subtasks
  const subtaskIds = goalSubtasks.map(t => t.id);
  const goalBlocks = data?.scheduled_blocks.filter(b => subtaskIds.includes(b.subtask_id)) || [];

  // Replan history logs for this specific goal
  const goalLogs = data?.replan_logs.filter(log => log.goal_title === goal.title) || [];

  const priorityColor = {
    High: 'bg-rose-500/15 text-rose-400 border-rose-500/20',
    Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    Low: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  }[goal.priority] || 'bg-slate-500/15 text-slate-400 border-slate-500/20';

  const daysLeft = Math.ceil((new Date(goal.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
  const isOverdue = daysLeft < 0;

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 pb-20">
      
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Back control */}
        <button
          onClick={() => setCurrentPage('dashboard')}
          className="flex items-center space-x-1.5 text-xs font-bold text-slate-400 hover:text-white bg-slate-900 border border-slate-800 hover:border-slate-700 px-3.5 py-2 rounded-lg transition-all cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Control Center</span>
        </button>

        {/* Hero Goal Trajectory Info */}
        <div className="bg-[#111827] border border-slate-800 p-6 md:p-8 rounded-2xl space-y-6 relative overflow-hidden">
          {/* Subtle glow accent */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#7C3AED]/5 blur-2xl rounded-full" />
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2.5">
                <Target className="w-6 h-6 text-[#7C3AED]" />
                <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{goal.title}</h2>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-3xl">
                {goal.description || 'No additional description provided.'}
              </p>
            </div>

            <div className="flex items-center space-x-3.5 shrink-0 self-start md:self-auto">
              <span className={`px-3 py-1 rounded-full text-xs font-bold border ${priorityColor}`}>
                {goal.priority}
              </span>
              <span className="text-xs text-slate-500 font-bold font-mono">
                Trajectory ID: {goal.id}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-800/80">
            {/* Stats list */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deadline Goal</span>
              <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm">
                <Calendar className="w-4 h-4 text-[#06B6D4]" />
                <span>{new Date(goal.deadline).toLocaleString()}</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Remaining Duration</span>
              <div className="flex items-center space-x-2 text-slate-200 font-semibold text-sm">
                <Clock className="w-4 h-4 text-emerald-400" />
                {isOverdue ? (
                  <span className="text-rose-400 flex items-center space-x-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Overdue</span>
                  </span>
                ) : (
                  <span>{daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Path Completion</span>
              <ProgressBar progress={progress} showLabel={false} size="sm" />
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {completedCount} of {totalCount} checkpoints completed ({Math.round(progress)}%)
              </div>
            </div>
          </div>
        </div>

        {/* Two Columns Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* Left Column: Subtask checklist */}
          <div className="md:col-span-7 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200 text-base">Checkpoints Checklist</h3>
              <span className="text-xs text-slate-500 font-semibold">
                Completed {completedCount}/{totalCount}
              </span>
            </div>

            <div className="space-y-4">
              {goalSubtasks.map((task) => (
                <TaskCard 
                  key={task.id} 
                  subtask={task} 
                  onCompleted={fetchGoalData} 
                />
              ))}
            </div>
          </div>

          {/* Right Column: Focus Schedule Blocks */}
          <div className="md:col-span-5 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-slate-200 text-base">Calendar Allocation Blocks</h3>
              <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2 py-0.5 rounded font-bold font-mono">
                {goalBlocks.length} Blocks
              </span>
            </div>

            <div className="space-y-4">
              {goalBlocks.map((block) => {
                const task = goalSubtasks.find(t => t.id === block.subtask_id);
                if (!task) return null;
                return (
                  <CalendarBlock 
                    key={block.id} 
                    block={block} 
                    subtask={task} 
                  />
                );
              })}
            </div>
          </div>

        </div>

        {/* AI Reasoning history specific to this goal trajectory */}
        <div className="space-y-4 pt-6 border-t border-slate-800">
          <h3 className="font-bold text-slate-200 text-base flex items-center space-x-2">
            <History className="w-4 h-4 text-[#06B6D4]" />
            <span>Trajectory AI Decision Logs ({goalLogs.length})</span>
          </h3>

          <div className="space-y-4">
            {goalLogs.map((log) => (
              <AIReasoningCard 
                key={log.id}
                reasoning={log.ai_reasoning}
                title={log.trigger_reason}
                timestamp={log.triggered_at}
              />
            ))}

            {goalLogs.length === 0 && (
              <div className="bg-slate-900/10 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-sm">
                No automatic replanning events logged for this trajectory.
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
