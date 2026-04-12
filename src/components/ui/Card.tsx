import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
}

export function Card({ className, children, onClick }: CardProps) {
  return (
    <div
      className={cn(
        'bg-gray-800 border border-gray-700 rounded-xl p-4',
        onClick && 'cursor-pointer hover:border-gray-500 transition-colors',
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <h3 className={cn('text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3', className)}>
      {children}
    </h3>
  );
}
