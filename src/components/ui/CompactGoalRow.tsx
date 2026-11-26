import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface CompactGoalRowProps {
  title: string;
  primaryMetric?: React.ReactNode;
  leadingControl?: React.ReactNode;
  expanded?: boolean;
  defaultExpanded?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
  children?: React.ReactNode;
  className?: string;
}

export function CompactGoalRow({
  title,
  primaryMetric,
  leadingControl,
  expanded: controlledExpanded,
  defaultExpanded = false,
  onExpandedChange,
  children,
  className,
}: CompactGoalRowProps) {
  const [uncontrolledExpanded, setUncontrolledExpanded] = React.useState(defaultExpanded);
  const panelId = React.useId();

  const isControlled = controlledExpanded !== undefined;
  const isExpanded = isControlled ? controlledExpanded : uncontrolledExpanded;
  const hasDetails = Boolean(children);

  function handleToggle() {
    if (!hasDetails) return;
    const next = !isExpanded;
    if (!isControlled) {
      setUncontrolledExpanded(next);
    }
    onExpandedChange?.(next);
  }

  return (
    <div
      className={cn(
        'rounded-xl border bg-[#FFFFFF] transition-colors',
        isExpanded ? 'border-[#1D4ED8]/40' : 'border-[#E2E8F0]',
        className,
      )}
    >
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        {leadingControl ? <div className="shrink-0">{leadingControl}</div> : null}

        {hasDetails ? (
          <button
            type="button"
            aria-expanded={isExpanded}
            aria-controls={panelId}
            onClick={handleToggle}
            className={cn(
              'flex min-w-0 flex-1 items-center justify-between gap-3 rounded-lg text-right',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2',
            )}
          >
            <span className="min-w-0 flex-1 text-[15px] font-medium leading-[1.5] text-[#0F172A]">
              {title}
            </span>

            <span className="flex shrink-0 items-center gap-2.5">
              {primaryMetric ? (
                <span className="text-xs font-medium text-[#475569]">{primaryMetric}</span>
              ) : null}
              <ChevronDown
                className={cn(
                  'h-[18px] w-[18px] shrink-0 text-[#475569] transition-transform duration-150',
                  isExpanded && 'rotate-180 text-[#1D4ED8]',
                )}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
          </button>
        ) : (
          <div className="flex min-w-0 flex-1 items-center justify-between gap-3">
            <span className="min-w-0 flex-1 text-[15px] font-medium leading-[1.5] text-[#0F172A]">
              {title}
            </span>
            {primaryMetric ? (
              <span className="shrink-0 text-xs font-medium text-[#475569]">{primaryMetric}</span>
            ) : null}
          </div>
        )}
      </div>

      {hasDetails && isExpanded ? (
        <div
          id={panelId}
          className="border-t border-[#E2E8F0] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#475569] rounded-b-xl"
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
