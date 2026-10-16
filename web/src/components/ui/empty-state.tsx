import * as React from 'react';
import { type LucideIcon, FolderOpen } from 'lucide-react';
import { cn } from '../../lib/utils.ts';

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  secondaryAction?: React.ReactNode;
}

export function EmptyState({
  icon: Icon = FolderOpen,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center p-6 sm:p-10 rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] space-y-3 w-full max-w-full overflow-hidden min-w-0',
        className,
      )}
      {...props}
    >
      <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--accent)] shadow-[var(--shadow-subtle)] shrink-0">
        <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
      </div>

      <div className="space-y-1 max-w-md w-full px-2 min-w-0">
        <h4 className="text-sm font-semibold text-[var(--text-primary)] leading-tight break-words">{title}</h4>
        {description && (
          <p className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">
            {description}
          </p>
        )}
      </div>

      {(action || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-full min-w-0">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
