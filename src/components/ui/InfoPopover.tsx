import * as React from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Info, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface InfoPopoverProps {
  label?: string;
  title?: string;
  children: React.ReactNode;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  triggerClassName?: string;
}

export function InfoPopover({
  label = 'מידע נוסף',
  title,
  children,
  align = 'start',
  side = 'bottom',
  triggerClassName,
}: InfoPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-lg border border-[#E2E8F0] bg-[#FFFFFF] px-2.5 py-1.5',
            'text-sm font-medium text-[#475569] transition-colors',
            'hover:bg-[#F8FAFC] hover:text-[#0F172A]',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-1',
            triggerClassName,
          )}
        >
          <Info className="h-[18px] w-[18px] text-[#1D4ED8]" strokeWidth={1.75} aria-hidden="true" />
          <span>{label}</span>
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          dir="rtl"
          align={align}
          side={side}
          sideOffset={8}
          collisionPadding={16}
          className={cn(
            'z-50 w-[min(320px,calc(100vw-2rem))] rounded-xl border border-[#E2E8F0] bg-[#FFFFFF] p-3.5 text-right shadow-lg',
            'focus-visible:outline-none',
          )}
        >
          <div className="flex items-start justify-between gap-2">
            {title ? (
              <div className="text-[15px] font-medium leading-6 text-[#0F172A]">{title}</div>
            ) : (
              <span className="sr-only">{label}</span>
            )}
            <Popover.Close asChild>
              <button
                type="button"
                aria-label="סגור חלונית מידע"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-[#475569] hover:bg-[#F1F5F9] hover:text-[#0F172A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8]"
              >
                <X className="h-[18px] w-[18px]" strokeWidth={1.75} aria-hidden="true" />
              </button>
            </Popover.Close>
          </div>
          <div className="mt-1.5 text-sm leading-relaxed text-[#475569]">{children}</div>
          <Popover.Arrow className="fill-[#FFFFFF]" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
