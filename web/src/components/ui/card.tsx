import * as React from 'react';
import { cn } from '../../lib/utils.ts';

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-subtle)] transition-colors duration-150 max-w-full overflow-hidden min-w-0',
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('flex flex-col space-y-1.5 p-4 sm:p-5 min-w-0', className)} {...props} />;
}

export function CardTitle({ className, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      style={{ fontFamily: 'Plus Jakarta Sans, var(--font-sans)', ...style }}
      className={cn(
        'text-base font-semibold leading-snug tracking-tight text-[var(--text-primary)] break-words min-w-0 font-sans',
        className,
      )}
      {...props}
    />
  );
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-xs text-[var(--text-secondary)] leading-relaxed break-words min-w-0', className)}
      {...props}
    />
  );
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('p-4 sm:p-5 pt-0 min-w-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex items-center p-4 sm:p-5 pt-0 border-t border-[var(--border-subtle)] min-w-0', className)}
      {...props}
    />
  );
}
