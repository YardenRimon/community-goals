import { cn } from '@/lib/cn';

export type GoalStrengthLevel = 'strong' | 'medium' | 'low';

export interface StrengthBadgeProps {
  level: GoalStrengthLevel;
  className?: string;
}

const strengthConfig: Record<
  GoalStrengthLevel,
  {
    label: string;
    containerClass: string;
    dotClass: string;
  }
> = {
  strong: {
    label: 'חזק',
    containerClass: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0]',
    dotClass: 'bg-[#15803D]',
  },
  medium: {
    label: 'בינוני',
    containerClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
    dotClass: 'bg-[#B45309]',
  },
  low: {
    label: 'נמוך',
    containerClass: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
    dotClass: 'bg-[#475569]',
  },
};

export function StrengthBadge({ level, className }: StrengthBadgeProps) {
  const config = strengthConfig[level];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium leading-tight whitespace-nowrap',
        config.containerClass,
        className,
      )}
    >
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', config.dotClass)}
        aria-hidden="true"
      />
      <span>{config.label}</span>
    </span>
  );
}
