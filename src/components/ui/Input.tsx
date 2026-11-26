import * as React from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id ?? generatedId;
    const errorId = error ? `${inputId}-error` : undefined;
    const hintId = hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={inputId} className="text-sm font-medium text-[#0F172A]">
            {label}
          </label>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'min-h-10 w-full rounded-lg border bg-[#FFFFFF] px-3 py-2 text-sm text-[#0F172A]',
            'placeholder:text-[#475569]/70 transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1D4ED8] focus-visible:ring-offset-1',
            error ? 'border-[#DC2626]' : 'border-[#E2E8F0] focus-visible:border-[#1D4ED8]',
            'disabled:cursor-not-allowed disabled:bg-[#F8FAFC] disabled:opacity-60',
            className,
          )}
          {...props}
        />
        {hint && !error ? (
          <span id={hintId} className="text-xs text-[#475569]">
            {hint}
          </span>
        ) : null}
        {error ? (
          <span id={errorId} className="text-xs font-medium text-[#B91C1C]">
            {error}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';
