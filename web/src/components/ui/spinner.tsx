import * as React from 'react';
import { cn } from '../../lib/utils.ts';

export interface SpinnerProps extends React.SVGAttributes<SVGSVGElement> {
  size?: 'xs' | 'sm' | 'default' | 'lg';
  label?: string;
}

export function Spinner({
  size = 'default',
  label = 'Carregando...',
  className,
  ...props
}: SpinnerProps) {
  const sizes = {
    xs: 'w-3 h-3',
    sm: 'w-3.5 h-3.5',
    default: 'w-4 h-4',
    lg: 'w-6 h-6',
  };

  return (
    <svg
      role="status"
      aria-label={label}
      className={cn('animate-spin text-[var(--accent)] shrink-0', sizes[size], className)}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      {...props}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="3"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
      <span className="sr-only">{label}</span>
    </svg>
  );
}
