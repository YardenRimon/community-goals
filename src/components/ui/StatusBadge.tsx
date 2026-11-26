import * as React from 'react';
import { cn } from '@/lib/cn';

export type StatusTone = 'neutral' | 'primary' | 'success' | 'warning';

export interface StatusBadgeProps {
  tone?: StatusTone;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

const toneClasses: Record<StatusTone, string> = {
  neutral: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  primary: 'bg-[#EFF6FF] text-[#1D4ED8] border-[#BFDBFE]',
  success: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
  warning: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
};

export function StatusBadge({
  tone = 'neutral',
  icon,
  children,
  className,
}: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-tight whitespace-nowrap',
        toneClasses[tone],
        className,
      )}
    >
      {icon ? <span className="shrink-0">{icon}</span> : null}
      <span>{children}</span>
    </span>
  );
}
