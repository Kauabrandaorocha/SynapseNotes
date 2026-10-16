import * as React from 'react';
import { cn } from '../../lib/utils.ts';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', hasError, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        aria-invalid={hasError ? true : undefined}
        className={cn(
          'flex h-9 w-full rounded-[var(--radius-sm)] border bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-muted)] transition-colors focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 min-w-0 max-w-full',
          hasError
            ? 'border-[var(--error)] focus-visible:border-[var(--error)] focus-visible:ring-[var(--error)]'
            : 'border-[var(--border)] focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent)]',
          className,
        )}
        {...props}
      />
    );
  },
);

Input.displayName = 'Input';
