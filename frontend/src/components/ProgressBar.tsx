import React from 'react';

interface ProgressBarProps {
  progress: number; // 0 to 100
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export default function ProgressBar({ progress, size = 'md', showLabel = true }: ProgressBarProps) {
  const percentage = Math.max(0, Math.min(100, progress));

  const heightClass = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }[size];

  return (
    <div className="w-full">
      {showLabel && (
        <div className="flex justify-between items-center mb-1.5 text-xs font-semibold">
          <span className="text-slate-400">Path Completion</span>
          <span className="text-[#06B6D4] bg-[#06B6D4]/10 px-2 py-0.5 rounded-full font-mono">{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={`w-full bg-slate-800 rounded-full overflow-hidden ${heightClass} border border-slate-700/50`}>
        <div 
          className="h-full bg-gradient-to-r from-[#7C3AED] via-violet-500 to-[#06B6D4] rounded-full transition-all duration-500 ease-out"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
