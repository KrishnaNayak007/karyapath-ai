import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColorClass?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

export default function StatsCard({ title, value, description, icon: Icon, iconColorClass = 'text-[#7C3AED]', trend }: StatsCardProps) {
  return (
    <div className="bg-[#111827] border border-slate-800 p-5 rounded-xl shadow-sm flex items-start justify-between">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</span>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-white tracking-tight">{value}</span>
          {trend && (
            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${trend.isPositive ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              {trend.value}
            </span>
          )}
        </div>
        {description && <p className="text-xs text-slate-500 font-medium">{description}</p>}
      </div>

      <div className={`p-3 rounded-lg bg-slate-900 border border-slate-800/80 ${iconColorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}
