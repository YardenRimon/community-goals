import * as React from 'react';
import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '@/lib/cn';

export const TooltipProvider = RadixTooltip.Provider;

export interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  align?: 'start' | 'center' | 'end';
  className?: string;
}

export function Tooltip({
  content,
  children,
  side = 'top',
  align = 'center',
  className,
}: TooltipProps) {
  return (
    <RadixTooltip.Root>
      <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
      <RadixTooltip.Portal>
        <RadixTooltip.Content
          dir="rtl"
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          className={cn(
            'z-50 max-w-xs rounded-lg border border-[#E2E8F0] bg-[#0F172A] px-2.5 py-1.5 text-xs font-medium text-[#FFFFFF] shadow-md',
            className,
          )}
        >
          {content}
          <RadixTooltip.Arrow className="fill-[#0F172A]" />
        </RadixTooltip.Content>
      </RadixTooltip.Portal>
    </RadixTooltip.Root>
  );
}
