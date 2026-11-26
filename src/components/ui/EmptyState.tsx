import * as React from 'react';
import { cn } from '@/lib/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-xl border border-dashed border-[#E2E8F0] bg-[#FFFFFF] px-5 py-8 text-center',
        className,
      )}
    >
      {icon ? (
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-[#F1F5F9] text-[#475569]">
          {icon}
        </div>
      ) : null}
      <h3 className="text-[15px] font-medium text-[#0F172A]">{title}</h3>
      {description ? (
        <p className="mt-1 max-w-md text-sm leading-relaxed text-[#475569]">{description}</p>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
