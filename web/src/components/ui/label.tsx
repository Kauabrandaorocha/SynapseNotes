import * as React from 'react';
import { cn } from '../../lib/utils.ts';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, required, children, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cn(
          'text-xs font-semibold leading-none text-[var(--text-primary)] select-none flex items-center gap-1',
          className,
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="text-[var(--accent)] font-bold text-xs" aria-hidden="true">
            *
          </span>
        )}
      </label>
    );
  },
);

Label.displayName = 'Label';
