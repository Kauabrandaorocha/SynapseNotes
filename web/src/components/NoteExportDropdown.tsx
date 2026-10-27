import React, { useState, useEffect, useRef } from 'react';
import { Download, ChevronDown, FileText } from 'lucide-react';
import type { ApiNote, ApiRelation } from '../services/api.ts';
import { exportNoteToPDF, exportNoteToMarkdown } from '../utils/exportNote.ts';

export interface NoteExportDropdownProps {
  note: ApiNote;
  relations?: ApiRelation[];
  onSuccess?: (message: string) => void;
  onError?: (error: string) => void;
}

export function NoteExportDropdown({
  note,
  relations = [],
  onSuccess,
  onError,
}: NoteExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fecha o dropdown ao clicar fora ou pressionar tecla Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleExportPDF = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    try {
      exportNoteToPDF(note, relations);
      onSuccess?.('Nota exportada em PDF com sucesso!');
    } catch (err: any) {
      console.error('Erro ao exportar nota para PDF:', err);
      onError?.('Falha ao gerar o documento PDF.');
    }
  };

  const handleExportMarkdown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    try {
      exportNoteToMarkdown(note, relations);
      onSuccess?.('Nota exportada em Markdown (.md) com sucesso!');
    } catch (err: any) {
      console.error('Erro ao exportar nota para Markdown:', err);
      onError?.('Falha ao gerar o arquivo Markdown.');
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-sans font-medium rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] hover:border-[var(--accent)]/50 shadow-2xs transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[var(--accent)]"
        title="Exportar nota em PDF ou Markdown"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Download className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span>Exportar</span>
        <ChevronDown
          className={`h-3 w-3 text-[var(--text-muted)] transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div
          role="menu"
          aria-orientation="vertical"
          className="absolute right-0 mt-1.5 w-56 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border)] shadow-[var(--shadow-popover)] p-1 z-50 animate-in fade-in zoom-in-95 duration-100"
        >
          <div className="px-2.5 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border-subtle)] mb-1">
            Opções de Exportação
          </div>

          <button
            type="button"
            role="menuitem"
            onClick={handleExportPDF}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-left rounded-[var(--radius-xs)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-[var(--radius-xs)] bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FileText className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-none text-[var(--text-primary)]">
                Exportar como PDF
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Layout estilizado para leitura (.pdf)
              </p>
            </div>
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-2.5 px-2.5 py-2 text-xs text-left rounded-[var(--radius-xs)] text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors cursor-pointer group"
          >
            <div className="h-7 w-7 rounded-[var(--radius-xs)] bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Download className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium leading-none text-[var(--text-primary)]">
                Exportar como Markdown (.md)
              </p>
              <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                Sintaxe limpa com headers e tags
              </p>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
