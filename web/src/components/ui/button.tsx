import * as React from 'react';
import { cn } from '../../lib/utils.ts';
import { Spinner } from './spinner.tsx';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'default' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'default',
      size = 'default',
      loading = false,
      loadingText,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const variants = {
      default:
        'bg-[var(--accent)] text-[var(--accent-foreground)] hover:bg-[var(--accent-hover)] shadow-[var(--shadow-subtle)] active:scale-[0.98]',
      secondary:
        'bg-[var(--surface-hover)] text-[var(--text-primary)] hover:bg-[var(--border)] active:scale-[0.98]',
      outline:
        'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--border-hover)] active:scale-[0.98]',
      ghost:
        'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]',
      destructive:
        'bg-[var(--error)] text-white hover:bg-[#a12424] shadow-[var(--shadow-subtle)] active:scale-[0.98]',
    };

    const sizes = {
      sm: 'h-8 px-2.5 text-xs gap-1.5',
      default: 'h-9 px-3.5 text-xs gap-2',
      lg: 'h-10 px-4 text-sm gap-2',
      icon: 'h-9 w-9 p-0 justify-center',
    };

    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        aria-busy={loading ? 'true' : undefined}
        aria-disabled={isDisabled ? 'true' : undefined}
        className={cn(
          'inline-flex items-center justify-center font-semibold rounded-[var(--radius-sm)] transition-all duration-150 select-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-1 shrink-0',
          variants[variant],
          sizes[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <>
            <Spinner size={size === 'sm' ? 'xs' : 'sm'} className="shrink-0" />
            {loadingText ? <span>{loadingText}</span> : children}
          </>
        ) : (
          children
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';
