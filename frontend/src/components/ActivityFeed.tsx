import React from 'react';
import { AlertCircle, Calendar, CheckCircle2, History, Sparkles, Zap } from 'lucide-react';
import { ReplanLog } from '../services/api';

interface ActivityFeedProps {
  logs: ReplanLog[];
}

export default function ActivityFeed({ logs }: ActivityFeedProps) {
  // Sort logs by triggered_at descending so newest actions are on top
  const sortedLogs = [...logs].sort(
    (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime()
  );

  return (
    <div className="bg-[#111827] border border-slate-800 p-6 rounded-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center space-x-2">
          <History className="w-5 h-5 text-[#06B6D4]" />
          <h3 className="font-bold text-slate-100 text-base">AI Autonomous Activity Feed</h3>
        </div>
        <span className="text-xs bg-[#7C3AED]/10 text-[#7C3AED] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider flex items-center space-x-1 border border-[#7C3AED]/10">
          <Zap className="w-3.5 h-3.5 mr-0.5" />
          <span>Agent Live</span>
        </span>
      </div>

      {sortedLogs.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">
          No autonomous decisions logged yet. Create a goal to trigger schedules.
        </div>
      ) : (
        <div className="relative border-l-2 border-slate-800 ml-3 pl-6 space-y-6">
          {sortedLogs.map((log, index) => {
            const isMissed = log.trigger_reason.toLowerCase().includes('missed');
            const isCompleted = log.trigger_reason.toLowerCase().includes('completed') || log.trigger_reason.toLowerCase().includes('completed');
            
            // Choose colors based on event type
            let iconColor = 'text-[#7C3AED] bg-[#7C3AED]/10 border-[#7C3AED]/20';
            let Icon = Sparkles;
            
            if (isMissed) {
              iconColor = 'text-amber-400 bg-amber-500/15 border-amber-500/20';
              Icon = AlertCircle;
            } else if (isCompleted) {
              iconColor = 'text-emerald-400 bg-emerald-500/15 border-emerald-500/20';
              Icon = CheckCircle2;
            }

            return (
              <div key={log.id || index} className="relative group">
                {/* Visual timeline bullet */}
                <span className={`absolute -left-[35px] top-1 flex items-center justify-center w-6 h-6 rounded-full border shadow-sm transition-transform duration-300 group-hover:scale-110 ${iconColor}`}>
                  <Icon className="w-3.5 h-3.5" />
                </span>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <span className={`text-sm font-extrabold ${isMissed ? 'text-amber-400' : 'text-slate-100'}`}>
                      {log.trigger_reason}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono font-bold">
                      {new Date(log.triggered_at).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </span>
                  </div>

                  {log.task_title && (
                    <div className="text-xs text-[#06B6D4] font-semibold">
                      Target Task: <span className="text-slate-300 font-medium">{log.task_title}</span>
                    </div>
                  )}

                  <p className="text-sm text-slate-400 leading-relaxed font-medium bg-slate-900/40 p-3 rounded-lg border border-slate-800/50">
                    {log.ai_reasoning}
                  </p>

                  <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    <span>Trigger: {log.was_automatic ? 'Autonomous Scheduler' : 'Manual Trigger'}</span>
                    <span>•</span>
                    <span className="flex items-center text-[#7C3AED]">
                      <Sparkles className="w-3 h-3 mr-0.5 text-[#06B6D4]" />
                      <span>Gemini Verified</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
