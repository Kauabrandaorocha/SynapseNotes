import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils.ts';
import { Button } from './button.tsx';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?: 'sm' | 'default' | 'lg' | 'xl';
}

export function Modal({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  maxWidth = 'default',
}: ModalProps) {
  const titleId = React.useId();
  const descId = React.useId();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidths = {
    sm: 'sm:max-w-sm',
    default: 'sm:max-w-md',
    lg: 'sm:max-w-xl',
    xl: 'sm:max-w-2xl',
  };

  return (
    <div
      role="presentation"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto bg-black/50 backdrop-blur-[2px] transition-opacity"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descId : undefined}
        className={cn(
          'relative w-full max-w-[95vw] sm:w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-popover)] transition-all flex flex-col max-h-[90vh] overflow-hidden my-auto',
          maxWidths[maxWidth],
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 sm:p-5 border-b border-[var(--border-subtle)] shrink-0 gap-3">
          <div className="space-y-1 min-w-0 flex-1">
            {title && (
              <h2 id={titleId} className="text-base font-semibold leading-snug tracking-tight text-[var(--text-primary)] break-words">
                {title}
              </h2>
            )}
            {description && (
              <div id={descId} className="text-xs text-[var(--text-secondary)] leading-relaxed break-words">
                {description}
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Fechar modal"
            className="h-8 w-8 text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body com Scroll Suave */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 min-w-0 overscroll-contain">
          {children}
        </div>

        {/* Footer */}
        {footer && (
          <div className="flex flex-wrap items-center justify-end gap-2 p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--surface-subtle)] shrink-0 min-w-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
