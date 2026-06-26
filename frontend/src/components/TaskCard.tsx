import React from 'react';
import { 
  CheckCircle2, 
  Clock, 
  Sparkles, 
  Zap, 
  AlertCircle, 
  Play, 
  Pause, 
  RotateCcw,
  UploadCloud
} from 'lucide-react';
import { 
  Subtask, 
  completeSubtask, 
  generateSubtaskDraft, 
  toggleSubtaskCrisis,
  verifySubtaskProof
} from '../services/api';

interface TaskCardProps {
  key?: React.Key;
  subtask: Subtask;
  onCompleted: () => void;
}

export default function TaskCard({ subtask, onCompleted }: TaskCardProps) {
  const [completing, setCompleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // AI, Crisis, & Proof-of-Work States
  const [draft, setDraft] = React.useState<string | null>(subtask.action_draft || null);
  const [loadingDraft, setLoadingDraft] = React.useState(false);
  const [isCrisis, setIsCrisis] = React.useState(subtask.is_crisis_active || false);
  const [secondsLeft, setSecondsLeft] = React.useState(15 * 60); // 15 Minute micro-burst
  const [timerActive, setTimerActive] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);

  // Focus Timer Logic
  React.useEffect(() => {
    let interval: any = null;
    if (timerActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (secondsLeft === 0) {
      setTimerActive(false);
      alert("⏱️ Micro-burst complete! You beat the procrastination block!");
    }
    return () => clearInterval(interval);
  }, [timerActive, secondsLeft]);

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

  // Generate Proactive Draft
  const handleGetDraft = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setLoadingDraft(true);
    setError(null);
    try {
      const data = await generateSubtaskDraft(subtask.id);
      setDraft(data.action_draft);
    } catch (err) {
      console.error('Error generating draft:', err);
      setError('Failed to load action draft.');
    } finally {
      setLoadingDraft(false);
    }
  };

  // Toggle Emergency Crisis Mode
  const handleToggleCrisis = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      const data = await toggleSubtaskCrisis(subtask.id);
      setIsCrisis(data.is_crisis_active);
      if (!data.is_crisis_active) {
        setTimerActive(false);
        setSecondsLeft(15 * 60);
      }
    } catch (err) {
      console.error('Error toggling crisis mode:', err);
      setError('Failed to toggle crisis mode.');
    }
  };

  // Handle Screenshot Upload Verification
  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);
    try {
      const res = await verifySubtaskProof(subtask.id, file);
      if (res.success) {
        alert("🎉 Work verified! The task has been marked complete.");
        onCompleted(); // Refreshes page state via callback
      } else {
        setError(res.message || "Could not verify your submission.");
      }
    } catch (err: any) {
      console.error('Error verifying work:', err);
      setError(err.response?.data?.message || 'Verification failed. Upload a clearer completion screenshot.');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isCompleted = subtask.status === 'completed';

  return (
    <div 
      id={`task-card-${subtask.id}`}
      className={`border rounded-xl p-4 transition-all duration-300 ${
        isCompleted 
          ? 'bg-slate-900/40 border-slate-800/60 opacity-60' 
          : isCrisis
            ? 'bg-slate-950 border-rose-600 shadow-xl shadow-rose-950/20'
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

      {/* Action Row */}
      {!isCompleted && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/40">
          <button
            onClick={handleGetDraft}
            disabled={loadingDraft}
            className="flex items-center space-x-1 text-xs bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2.5 py-1.5 rounded-lg transition active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>{loadingDraft ? "Drafting..." : draft ? "View Draft" : "⚡ Get AI Draft"}</span>
          </button>

          <button
            onClick={handleToggleCrisis}
            className={`flex items-center space-x-1 text-xs px-2.5 py-1.5 rounded-lg border transition active:scale-95 cursor-pointer ${
              isCrisis 
                ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30' 
                : 'bg-slate-800/60 hover:bg-slate-700/80 text-slate-300 border-slate-700/60'
            }`}
          >
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{isCrisis ? "Focusing" : "Crisis Mode"}</span>
          </button>

          {/* AI Screenshot Verification Upload Trigger */}
          <label className="flex items-center space-x-1 text-xs bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/20 px-2.5 py-1.5 rounded-lg transition active:scale-95 cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>{uploading ? "Verifying..." : "Verify Proof"}</span>
            <input 
              type="file" 
              accept="image/*" 
              onChange={handleProofUpload} 
              className="hidden" 
              disabled={uploading}
            />
          </label>
        </div>
      )}

      {/* AI Action Starter Expandable Panel */}
      {draft && !isCompleted && (
        <div className="mt-3 p-3 bg-slate-950/70 border border-emerald-950/80 rounded-lg text-xs font-mono text-slate-300">
          <div className="flex justify-between items-center mb-1.5 pb-1 border-b border-emerald-950/40 text-emerald-400 font-bold uppercase tracking-wider text-[9px]">
            <span>AI Action Starter</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(draft);
                alert("Action Starter Draft Copied!");
              }}
              className="bg-emerald-950/50 hover:bg-emerald-900/60 px-1.5 py-0.5 rounded border border-emerald-800/60 text-[9px] cursor-pointer"
            >
              Copy
            </button>
          </div>
          <p className="whitespace-pre-line leading-relaxed">{draft}</p>
        </div>
      )}

      {/* Crisis Mode Focus Countdown Panel */}
      {isCrisis && !isCompleted && (
        <div className="mt-3 border-t border-rose-950/40 pt-3">
          <div className="flex items-center justify-between bg-slate-950 border border-rose-950/40 p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xl font-mono font-bold text-rose-400">
                {formatTime(secondsLeft)}
              </span>
            </div>
            
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setTimerActive(!timerActive)}
                className={`p-1.5 rounded-md transition border cursor-pointer ${
                  timerActive 
                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/20' 
                    : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/20'
                }`}
              >
                {timerActive ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  setTimerActive(false);
                  setSecondsLeft(15 * 60);
                }}
                className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 rounded-md border border-slate-800 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}