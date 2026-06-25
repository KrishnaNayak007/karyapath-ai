import React, { useEffect, useState } from 'react';
import { getDashboard, ScheduledBlock, Subtask, Goal } from '../services/api';
import CalendarBlock from '../components/CalendarBlock';
import { Calendar as CalendarIcon, Clock, Sparkles, LayoutList, RefreshCw, AlertCircle } from 'lucide-react';

export default function Calendar() {
  const [data, setData] = useState<{
    goals: Goal[];
    subtasks: Subtask[];
    scheduled_blocks: ScheduledBlock[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'weekly' | 'monthly'>('weekly');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchCalendarData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setIsRefreshing(true);
    try {
      const res = await getDashboard();
      setData(res);
    } catch (err) {
      console.error('Error fetching calendar data:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCalendarData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-73px)] space-y-4 bg-[#0B1120] text-slate-200">
        <div className="w-12 h-12 border-4 border-[#06B6D4] border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-semibold text-slate-400">Loading scheduled workspace calendar...</p>
      </div>
    );
  }

  const blocks = data?.scheduled_blocks || [];
  const subtasks = data?.subtasks || [];
  const goals = data?.goals || [];

  // Group blocks by date
  const groupBlocksByDate = () => {
    const groups: { [key: string]: ScheduledBlock[] } = {};
    
    // Sort blocks chronologically
    const sorted = [...blocks].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );

    sorted.forEach((block) => {
      const dateStr = new Date(block.start_time).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
      if (!groups[dateStr]) {
        groups[dateStr] = [];
      }
      groups[dateStr].push(block);
    });

    return groups;
  };

  const dateGroups = groupBlocksByDate();
  const dateKeys = Object.keys(dateGroups);

  return (
    <div className="min-h-screen bg-[#0B1120] text-slate-100 p-6 space-y-8 pb-20">
      
      {/* Header section */}
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-[#06B6D4] uppercase tracking-widest flex items-center space-x-1.5 mb-1">
            <CalendarIcon className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Schedule Planner</span>
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
            Schedules & Time Allocations
          </h2>
        </div>

        {/* View Mode controls */}
        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="bg-[#111827] border border-slate-800 rounded-lg p-1 flex">
            <button
              onClick={() => setViewMode('weekly')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'weekly' ? 'bg-[#7C3AED]/20 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Weekly Agenda</span>
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'monthly' ? 'bg-[#7C3AED]/20 text-[#06B6D4]' : 'text-slate-400 hover:text-white'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Monthly Calendar</span>
            </button>
          </div>

          <button
            onClick={() => fetchCalendarData(true)}
            disabled={isRefreshing}
            className="p-2 rounded-lg bg-[#111827] border border-slate-800 text-slate-400 hover:text-white disabled:opacity-50 cursor-pointer"
            title="Refresh schedule"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto">
        
        {viewMode === 'weekly' ? (
          /* WEEKLY AGENDA VIEW */
          blocks.length === 0 ? (
            <div className="bg-[#111827] border border-slate-800 p-12 text-center rounded-2xl max-w-lg mx-auto space-y-4">
              <CalendarIcon className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="font-bold text-lg">No focus blocks scheduled</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                You haven't initialized any goals yet. Setup a goal path and let Gemini arrange your calendar.
              </p>
            </div>
          ) : (
            <div className="space-y-8">
              {dateKeys.map((dateStr) => (
                <div key={dateStr} className="space-y-4">
                  {/* Day header */}
                  <div className="flex items-center space-x-3 border-b border-slate-850 pb-2">
                    <span className="font-extrabold text-slate-200 text-sm">{dateStr}</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-[#06B6D4]" />
                    <span className="text-xs text-slate-500 font-semibold uppercase">
                      {dateGroups[dateStr].length} tasks scheduled
                    </span>
                  </div>

                  {/* Day blocks grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
                    {dateGroups[dateStr].map((block) => {
                      const subtask = subtasks.find((t) => t.id === block.subtask_id);
                      if (!subtask) return null;
                      return (
                        <CalendarBlock 
                          key={block.id} 
                          block={block} 
                          subtask={subtask} 
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          /* MONTHLY GRID CALENDAR (Polished representation) */
          <div className="bg-[#111827] border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <span className="font-extrabold text-slate-200 text-lg">June 2026</span>
              <div className="flex items-center space-x-1 text-xs text-slate-500 font-bold uppercase">
                <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span>Gemini Autopilot Active</span>
              </div>
            </div>

            {/* Calendar Days name row */}
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 uppercase pb-2">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar grid representation */}
            <div className="grid grid-cols-7 gap-2 text-sm">
              {/* Generate calendar padding for leading days before start date (June 1 is a Monday) */}
              <div className="bg-slate-900/10 min-h-[85px] p-2 border border-slate-900/40 rounded-lg text-slate-600 font-semibold select-none">
                31
              </div>

              {/* Day numbers 1 to 30 */}
              {Array.from({ length: 30 }).map((_, index) => {
                const dayNum = index + 1;
                // Highlight days that have scheduled work blocks
                // June is the month in 2026. Let's find blocks matching June {dayNum}
                const blocksThisDay = blocks.filter((block) => {
                  const d = new Date(block.start_time);
                  return d.getMonth() === 5 && d.getDate() === dayNum; // 5 is June
                });

                const hasRescheduled = blocksThisDay.some((b) => b.was_auto_rescheduled);
                const hasPending = blocksThisDay.some((b) => {
                  const st = subtasks.find((t) => t.id === b.subtask_id);
                  return st && st.status === 'pending';
                });

                return (
                  <div 
                    key={dayNum} 
                    className={`min-h-[90px] p-2 border rounded-xl flex flex-col justify-between transition-all duration-200 ${
                      blocksThisDay.length > 0
                        ? hasRescheduled
                          ? 'border-[#7C3AED] bg-[#7C3AED]/5 shadow-sm'
                          : 'border-slate-800 bg-[#111827]/40 hover:border-slate-700'
                        : 'border-slate-900 bg-slate-900/20 text-slate-500'
                    }`}
                  >
                    <span className={`font-bold text-xs ${blocksThisDay.length > 0 ? 'text-slate-100' : 'text-slate-600'}`}>
                      {dayNum}
                    </span>

                    {/* Indicators of tasks */}
                    {blocksThisDay.length > 0 && (
                      <div className="space-y-1">
                        <div className={`text-[10px] font-extrabold truncate px-1.5 py-0.5 rounded ${
                          hasRescheduled 
                            ? 'bg-[#7C3AED]/20 text-[#06B6D4]' 
                            : 'bg-slate-800 text-slate-300'
                        }`}>
                          {blocksThisDay.length} {blocksThisDay.length === 1 ? 'Slot' : 'Slots'}
                        </div>
                        {hasRescheduled && (
                          <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping mx-auto" />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

    </div>
  );
}
