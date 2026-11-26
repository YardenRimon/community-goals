import * as React from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, hint, error, id, rows = 3, ...props }, ref) => {
    const generatedId = React.useId();
    const textareaId = id ?? generatedId;
    const errorId = error ? `${textareaId}-error` : undefined;
    const hintId = hint ? `${textareaId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label ? (
          <label htmlFor={textareaId} className="text-sm font-medium text-[#0F172A]">
            {label}
          </label>
        ) : null}
        <textarea
          ref={ref}
          id={textareaId}
          rows={rows}
          aria-invalid={error ? 'true' : undefined}
          aria-describedby={[hintId, errorId].filter(Boolean).join(' ') || undefined}
          className={cn(
            'w-full rounded-lg border bg-[#FFFFFF] px-3 py-2 text-sm leading-relaxed text-[#0F172A]',
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

Textarea.displayName = 'Textarea';
