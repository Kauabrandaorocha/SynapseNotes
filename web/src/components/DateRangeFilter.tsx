import React, { useState, useEffect, useRef } from 'react';
import { Calendar, X, ChevronDown, Check } from 'lucide-react';

export interface DateRange {
  startDate: string | null; // Formato YYYY-MM-DD
  endDate: string | null;   // Formato YYYY-MM-DD
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
  className?: string;
}

type PresetKey = 'today' | '7days' | '30days' | 'this_month';

export function DateRangeFilter({ value, onChange, className = '' }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState<PresetKey | null>(null);
  
  // Estados locais para inputs customizados
  const [tempStart, setTempStart] = useState<string>(value.startDate || '');
  const [tempEnd, setTempEnd] = useState<string>(value.endDate || '');

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sincroniza estados temporários quando o valor externo mudar
  useEffect(() => {
    setTempStart(value.startDate || '');
    setTempEnd(value.endDate || '');
    if (!value.startDate && !value.endDate) {
      setActivePreset(null);
    }
  }, [value.startDate, value.endDate]);

  // Fecha o popover ao clicar fora ou pressionar Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Formata data ISO (YYYY-MM-DD) para exibição compacta (DD/MM/AAAA)
  const formatDateBR = (iso: string): string => {
    if (!iso) return '';
    const parts = iso.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return iso;
  };

  const toLocalDateString = (d: Date): string => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Aplica presets rápidos
  const applyPreset = (preset: PresetKey) => {
    const now = new Date();
    const todayStr = toLocalDateString(now);
    let startStr = todayStr;
    const endStr = todayStr;

    if (preset === 'today') {
      startStr = todayStr;
    } else if (preset === '7days') {
      const past = new Date();
      past.setDate(past.getDate() - 6);
      startStr = toLocalDateString(past);
    } else if (preset === '30days') {
      const past = new Date();
      past.setDate(past.getDate() - 29);
      startStr = toLocalDateString(past);
    } else if (preset === 'this_month') {
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      startStr = toLocalDateString(firstDay);
    }

    setActivePreset(preset);
    setTempStart(startStr);
    setTempEnd(endStr);
    onChange({ startDate: startStr, endDate: endStr });
    setIsOpen(false);
  };

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    setActivePreset(null);
    onChange({
      startDate: tempStart || null,
      endDate: tempEnd || null,
    });
    setIsOpen(false);
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActivePreset(null);
    setTempStart('');
    setTempEnd('');
    onChange({ startDate: null, endDate: null });
    setIsOpen(false);
  };

  const hasActiveFilter = Boolean(value.startDate || value.endDate);

  // Rótulo para o botão de gatilho
  const getButtonLabel = (): string => {
    if (activePreset === 'today') return 'Hoje';
    if (activePreset === '7days') return 'Últimos 7 dias';
    if (activePreset === '30days') return 'Últimos 30 dias';
    if (activePreset === 'this_month') return 'Este mês';

    if (value.startDate && value.endDate) {
      if (value.startDate === value.endDate) {
        return formatDateBR(value.startDate);
      }
      return `${formatDateBR(value.startDate)} - ${formatDateBR(value.endDate)}`;
    }
    if (value.startDate) {
      return `A partir de ${formatDateBR(value.startDate)}`;
    }
    if (value.endDate) {
      return `Até ${formatDateBR(value.endDate)}`;
    }
    return 'Período';
  };

  return (
    <div className={`relative inline-block text-left shrink-0 ${className}`} ref={dropdownRef}>
      {/* Botão de Disparo */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        className={`h-9 px-3 rounded-[var(--radius-sm)] text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer select-none border whitespace-nowrap shadow-2xs ${
          hasActiveFilter
            ? 'bg-[var(--accent-subtle)] text-[var(--accent)] border-[var(--accent)]/50 hover:bg-[var(--accent-subtle)]/80 font-semibold ring-1 ring-[var(--accent)]/30'
            : 'bg-[var(--surface)] text-[var(--text-secondary)] border-[var(--border)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
        }`}
        title={hasActiveFilter ? `Filtrando por: ${getButtonLabel()}` : 'Filtrar notas por período de criação'}
      >
        <Calendar className={`h-3.5 w-3.5 shrink-0 ${hasActiveFilter ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`} />
        <span className="max-w-[130px] sm:max-w-[180px] truncate">{getButtonLabel()}</span>

        {hasActiveFilter ? (
          <span
            role="button"
            tabIndex={0}
            onClick={handleClear}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClear();
              }
            }}
            aria-label="Limpar filtro de data"
            className="p-0.5 -mr-1 rounded-full hover:bg-[var(--accent)]/20 text-[var(--accent)] transition-colors cursor-pointer"
            title="Remover filtro de período"
          >
            <X className="h-3 w-3" />
          </span>
        ) : (
          <ChevronDown className="h-3 w-3 shrink-0 text-[var(--text-muted)]" />
        )}
      </button>

      {/* Popover de Seleção */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Seletor de período"
          className="absolute right-0 sm:left-0 sm:right-auto mt-2 w-[290px] sm:w-[320px] rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--surface)] text-[var(--foreground)] shadow-[var(--shadow-popover)] z-50 p-3 sm:p-4 animate-in fade-in zoom-in-95 duration-100"
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between pb-2 mb-3 border-b border-[var(--border-subtle)]">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--text-primary)]">
              <Calendar className="h-3.5 w-3.5 text-[var(--accent)]" />
              <span>Filtrar por Criação</span>
            </div>
            {hasActiveFilter && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[11px] text-[var(--accent)] hover:underline font-medium cursor-pointer"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Atalhos Rápidos (Presets) */}
          <div className="mb-3">
            <span className="block text-[11px] font-medium text-[var(--text-muted)] mb-1.5">
              Atalhos rápidos:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => applyPreset('today')}
                className={`px-2 py-1.5 text-xs rounded-[var(--radius-xs)] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activePreset === 'today'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>Hoje</span>
                {activePreset === 'today' && <Check className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset('7days')}
                className={`px-2 py-1.5 text-xs rounded-[var(--radius-xs)] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activePreset === '7days'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>Últimos 7 dias</span>
                {activePreset === '7days' && <Check className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset('30days')}
                className={`px-2 py-1.5 text-xs rounded-[var(--radius-xs)] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activePreset === '30days'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>Últimos 30 dias</span>
                {activePreset === '30days' && <Check className="h-3 w-3" />}
              </button>

              <button
                type="button"
                onClick={() => applyPreset('this_month')}
                className={`px-2 py-1.5 text-xs rounded-[var(--radius-xs)] border text-left flex items-center justify-between transition-colors cursor-pointer ${
                  activePreset === 'this_month'
                    ? 'bg-[var(--accent)] text-white border-[var(--accent)] font-semibold'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-secondary)] border-[var(--border-subtle)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
                }`}
              >
                <span>Este mês</span>
                {activePreset === 'this_month' && <Check className="h-3 w-3" />}
              </button>
            </div>
          </div>

          {/* Intervalo Personalizado */}
          <form onSubmit={handleApplyCustom} className="space-y-2.5 pt-2 border-t border-[var(--border-subtle)]">
            <span className="block text-[11px] font-medium text-[var(--text-muted)]">
              Intervalo personalizado:
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                  Data Inicial:
                </label>
                <input
                  type="date"
                  value={tempStart}
                  max={tempEnd || undefined}
                  onChange={(e) => setTempStart(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>

              <div>
                <label className="block text-[10px] text-[var(--text-muted)] mb-1">
                  Data Final:
                </label>
                <input
                  type="date"
                  value={tempEnd}
                  min={tempStart || undefined}
                  onChange={(e) => setTempEnd(e.target.value)}
                  className="w-full text-xs px-2 py-1.5 rounded-[var(--radius-xs)] border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--accent)]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-2.5 py-1 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-[var(--radius-xs)] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!tempStart && !tempEnd}
                className="px-3 py-1 text-xs font-medium text-white bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-40 disabled:cursor-not-allowed rounded-[var(--radius-xs)] transition-colors shadow-2xs cursor-pointer"
              >
                Aplicar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
