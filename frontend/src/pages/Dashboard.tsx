import React, { useEffect, useState } from 'react';
import { getDashboard, Goal, Subtask, ReplanLog, ScheduledBlock } from '../services/api';
import StatsCard from '../components/StatsCard';
import GoalCard from '../components/GoalCard';
import TaskCard from '../components/TaskCard';
import ActivityFeed from '../components/ActivityFeed';
import ReplanAlert from '../components/ReplanAlert';
import { Target, CheckCircle, Clock, Sparkles, AlertTriangle, ArrowRight, RefreshCw, LayoutGrid } from 'lucide-react';

interface DashboardProps {
  key?: React.Key;
  setCurrentPage: (page: string) => void;
  setSelectedGoalId: (id: string) => void;
}

export default function Dashboard({ setCurrentPage, setSelectedGoalId }: DashboardProps) {
  const [data, setData] = useState<{
    goals: Goal[];
    subtasks: Subtask[];
    scheduled_blocks: ScheduledBlock[];
    replan_logs: ReplanLog[];
    new_replans: ReplanLog[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchDashboardData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    
    setError(null);
    try {
      const res = await getDashboard();
      setData(res);
      
      // If there are new replan logs returned, show the alert toast
      if (res.new_replans && res.new_replans.length > 0) {
        setShowAlert(true);
      }
    } catch (err) {
      console.error('Error fetching dashboard:', err);
      setError('Could not connect to KaryaPath backend APIs. Ensure your dev server is running.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] space-y-4 bg-[#0B1120] text-slate-200">
        <div className="w-12 h-12 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400 animate-pulse">
          Autonomous Agent analyzing work blocks & planning schedules...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] space-y-4 bg-[#0B1120] text-slate-200 p-6">
        <div className="p-3 bg-rose-500/15 text-rose-400 rounded-full border border-rose-500/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h3 className="font-bold text-lg">Backend API Connection Lost</h3>
        <p className="text-sm text-slate-400 max-w-md text-center">
          {error}
        </p>
        <button
          onClick={() => fetchDashboardData()}
          className="px-5 py-2 rounded-lg bg-[#7C3AED] hover:bg-violet-600 font-bold transition-all cursor-pointer text-sm"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const goals = data?.goals || [];
  const subtasks = data?.subtasks || [];
  const replanLogs = data?.replan_logs || [];
  const newReplans = data?.new_replans || [];

  // Stats calculation
  const totalGoals = goals.length;
  const completedTasks = subtasks.filter(t => t.status === 'completed').length;
  const pendingTasks = subtasks.filter(t => t.status === 'pending').length;
  const totalTasks = subtasks.length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  const totalMinutes = subtasks.reduce((acc, t) => acc + t.estimated_minutes, 0);

  const handleGoalClick = (goalId: string) => {
    setSelectedGoalId(goalId);
    setCurrentPage('goal-details');
  };

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 space-y-8 pb-20">
      
      {/* Header section */}
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-widest flex items-center space-x-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Workspace Overview</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            KaryaPath Active Control Center
          </h2>
        </div>

        {/* Refresh button */}
        <button
          onClick={() => fetchDashboardData(true)}
          disabled={isRefreshing}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-[#111827] text-sm font-semibold text-slate-300 border border-slate-800 hover:border-slate-700 hover:text-white transition-all disabled:opacity-50 self-start md:self-auto cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 text-[#06B6D4] ${isRefreshing ? 'animate-spin' : ''}`} />
          <span>{isRefreshing ? 'Re-scanning...' : 'Scan For Missed Tasks'}</span>
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Active Goals" 
          value={totalGoals} 
          description="Total active trajectories"
          icon={Target}
          iconColorClass="text-[#7C3AED]"
        />
        <StatsCard 
          title="Completion Rate" 
          value={`${completionRate}%`} 
          description={`${completedTasks} of ${totalTasks} subtasks done`}
          icon={CheckCircle}
          iconColorClass="text-[#06B6D4]"
          trend={{ value: '+8%', isPositive: true }}
        />
        <StatsCard 
          title="Pending Tasks" 
          value={pendingTasks} 
          description="Awaiting scheduling slots"
          icon={AlertTriangle}
          iconColorClass="text-amber-400"
        />
        <StatsCard 
          title="Planned Hours" 
          value={Math.round(totalMinutes / 60)} 
          description={`Across ${totalTasks} work blocks`}
          icon={Clock}
          iconColorClass="text-emerald-400"
        />
      </div>

      {/* Main Content Dashboard Layout */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column: Goals & Tasks (8 grid spans) */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Active Goals section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold text-slate-200 text-lg flex items-center space-x-2">
                <Target className="w-4 h-4 text-[#7C3AED]" />
                <span>Goal Trajectories</span>
              </h3>
              <button 
                onClick={() => setCurrentPage('create-goal')} 
                className="text-xs font-bold text-[#06B6D4] hover:text-[#7C3AED] flex items-center space-x-1 transition-colors"
              >
                <span>+ Create Goal</span>
              </button>
            </div>

            {goals.length === 0 ? (
              <div className="bg-[#111827] border border-slate-800 rounded-xl p-8 text-center space-y-3">
                <p className="text-slate-400 text-sm">No active goals found. Let's create your first trajectory!</p>
                <button
                  onClick={() => setCurrentPage('create-goal')}
                  className="px-4 py-2 rounded-lg bg-[#7C3AED] text-xs font-bold text-white hover:bg-violet-600 transition-all cursor-pointer"
                >
                  Create Goal Path
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {goals.map((goal) => (
                  <GoalCard 
                    key={goal.id} 
                    goal={goal} 
                    subtasks={subtasks} 
                    onClick={() => handleGoalClick(goal.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Upcoming tasks section */}
          <div className="space-y-4">
            <h3 className="font-extrabold text-slate-200 text-lg flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-[#06B6D4]" />
              <span>Schedules Checklist</span>
            </h3>

            {subtasks.filter(t => t.status === 'pending').length === 0 ? (
              <div className="bg-slate-900/20 border border-slate-800/80 rounded-xl p-6 text-center text-slate-500 text-sm">
                No upcoming work blocks. You are fully up to date!
              </div>
            ) : (
              <div className="space-y-3">
                {subtasks
                  .filter(t => t.status === 'pending')
                  .slice(0, 5)
                  .map((task) => (
                    <TaskCard 
                      key={task.id} 
                      subtask={task} 
                      onCompleted={() => fetchDashboardData(true)} 
                    />
                  ))}
              </div>
            )}
          </div>

        </div>

        {/* Right column: Centerpiece AI activity feed (5 grid spans) */}
        <div className="lg:col-span-5">
          <div className="sticky top-28">
            <ActivityFeed logs={replanLogs} />
          </div>
        </div>

      </div>

      {/* Dynamic Toast/Banner Alert for Replan events */}
      <ReplanAlert 
        newReplans={newReplans} 
        onDismiss={() => setShowAlert(false)} 
      />

    </div>
  );
}
