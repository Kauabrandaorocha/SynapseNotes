import * as React from 'react';
import { cn } from '../../lib/utils.ts';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'secondary' | 'accent' | 'success' | 'warning' | 'error' | 'outline';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  const variants = {
    default:
      'bg-[var(--surface-hover)] text-[var(--text-primary)] border-[var(--border)]',
    secondary:
      'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)]',
    accent:
      'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/30',
    success:
      'bg-[var(--success-subtle)] text-[var(--success)] border-[var(--success)]/30',
    warning:
      'bg-[var(--warning-subtle)] text-[var(--warning)] border-[var(--warning)]/30',
    error:
      'bg-[var(--error-subtle)] text-[var(--error)] border-[var(--error)]/30',
    outline:
      'border-[var(--border)] bg-transparent text-[var(--text-primary)]',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-[var(--radius-xs)] border px-2 py-0.5 text-[11px] font-semibold tracking-tight leading-none select-none max-w-full break-words truncate',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
