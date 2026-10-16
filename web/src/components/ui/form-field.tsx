import * as React from 'react';
import { cn } from '../../lib/utils.ts';
import { Label } from './label.tsx';

export interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  id?: string;
  label?: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export function FormField({
  id,
  label,
  required,
  error,
  helperText,
  className,
  children,
  ...props
}: FormFieldProps) {
  const generatedId = React.useId();
  const fieldId = id || generatedId;
  const errorId = error ? `${fieldId}-error` : undefined;
  const helperId = helperText ? `${fieldId}-helper` : undefined;

  return (
    <div className={cn('space-y-1.5 text-left w-full min-w-0', className)} {...props}>
      {label && (
        <Label htmlFor={fieldId} required={required}>
          {label}
        </Label>
      )}

      <div className="w-full min-w-0">
        {React.Children.map(children, (child) => {
          if (React.isValidElement<any>(child)) {
            const isNativeDom = typeof child.type === 'string';
            const childProps = (child.props as any) || {};
            const extraProps: Record<string, any> = {
              id: childProps.id || fieldId,
              'aria-describedby':
                [errorId, helperId, childProps['aria-describedby']].filter(Boolean).join(' ') ||
                undefined,
            };
            if (isNativeDom) {
              if (error) {
                extraProps['aria-invalid'] = true;
              }
            } else {
              extraProps.hasError = Boolean(error) || childProps.hasError;
            }
            return React.cloneElement(child, extraProps);
          }
          return child;
        })}
      </div>

      {error ? (
        <p id={errorId} role="alert" className="text-[11px] font-medium text-[var(--error)] leading-tight break-words">
          {error}
        </p>
      ) : helperText ? (
        <p id={helperId} className="text-[11px] text-[var(--text-muted)] leading-tight break-words">
          {helperText}
        </p>
      ) : null}
    </div>
  );
}
