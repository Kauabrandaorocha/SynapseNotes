import * as React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface AlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'info' | 'success' | 'warning' | 'error';
  title?: string;
}

export function Alert({
  variant = 'info',
  title,
  className,
  children,
  ...props
}: AlertProps) {
  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertTriangle,
    error: AlertCircle,
  };

  const IconComponent = icons[variant];

  const variants = {
    info: 'border-[var(--border)] bg-[var(--surface-subtle)] text-[var(--text-primary)]',
    success: 'border-[var(--success)]/30 bg-[var(--success-subtle)] text-[var(--success)]',
    warning: 'border-[var(--warning)]/30 bg-[var(--warning-subtle)] text-[var(--warning)]',
    error: 'border-[var(--error)]/30 bg-[var(--error-subtle)] text-[var(--error)]',
  };

  const isCritical = variant === 'error' || variant === 'warning';

  return (
    <div
      role={isCritical ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-[var(--radius-sm)] border p-3 text-xs leading-relaxed max-w-full overflow-hidden min-w-0',
        variants[variant],
        className,
      )}
      {...props}
    >
      <IconComponent className="h-4 w-4 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0 space-y-0.5 break-words">
        {title && <h5 className="font-semibold leading-tight break-words">{title}</h5>}
        <div className="text-xs opacity-90 break-words">{children}</div>
      </div>
    </div>
  );
}
