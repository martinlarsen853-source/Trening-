import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface StatBadgeProps {
  label: string;
  value: ReactNode;
  unit?: string;
  colorClass?: string;
  sub?: string;
}

export function StatBadge({ label, value, unit, colorClass = 'text-white', sub }: StatBadgeProps) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-400 mb-1">{label}</span>
      <span className={cn('text-2xl font-bold tabular-nums', colorClass)}>
        {value}
        {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
      </span>
      {sub && <span className="text-xs text-gray-500 mt-0.5">{sub}</span>}
    </div>
  );
}
