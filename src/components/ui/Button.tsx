import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'icon';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[#1D4ED8] text-white border border-transparent hover:bg-[#1E40AF] active:bg-[#1E3A8A]',
  secondary:
    'bg-[#F1F5F9] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#E2E8F0]/70',
  outline:
    'bg-[#FFFFFF] text-[#0F172A] border border-[#E2E8F0] hover:bg-[#F8FAFC] hover:border-[#CBD5E1]',
  ghost:
    'bg-transparent text-[#475569] border border-transparent hover:bg-[#F1F5F9] hover:text-[#0F172A]',
  danger:
    'bg-[#FEF2F2] text-[#B91C1C] border border-[#FECACA] hover:bg-[#FEE2E2]',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'min-h-9 px-3 py-1.5 text-sm',
  md: 'min-h-10 px-4 py-2 text-sm',
  icon: 'h-9 w-9 p-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      type = 'button',
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = Boolean(disabled || loading);

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8FAFC]',
          'disabled:pointer-events-none disabled:opacity-50',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 className="h-[18px] w-[18px] animate-spin" strokeWidth={1.75} aria-hidden="true" />
        ) : null}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';
