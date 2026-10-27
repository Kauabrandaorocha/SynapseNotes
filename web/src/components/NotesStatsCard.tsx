import { useMemo } from 'react';
import { FileText, Mic, Tag as TagIcon } from 'lucide-react';
import { Card } from './ui/card.tsx';
import type { ApiNote, ApiTag } from '../services/api.ts';

interface NotesStatsCardProps {
  notes: ApiNote[];
  tags: ApiTag[];
  selectedSourceType?: string | null;
  onSelectSourceType?: (type: string | null) => void;
}

export function NotesStatsCard({
  notes,
  tags,
  selectedSourceType,
  onSelectSourceType,
}: NotesStatsCardProps) {
  const totalNotes = notes.length;
  const totalAudios = useMemo(
    () => notes.filter((n) => n.hasAudio || n.sourceType === 'audio').length,
    [notes]
  );

  // Calcula contagem de tags exclusivas entre tags cadastradas e tags associadas às notas
  const uniqueTagsCount = useMemo(() => {
    const uniqueSet = new Set<string>();
    tags.forEach((t) => {
      if (t.name?.trim()) uniqueSet.add(t.name.trim().toLowerCase());
    });
    notes.forEach((n) => {
      n.tags?.forEach((t) => {
        if (t.name?.trim()) uniqueSet.add(t.name.trim().toLowerCase());
      });
    });
    return uniqueSet.size;
  }, [notes, tags]);

  const statItems = [
    {
      id: 'notes',
      label: 'Total de Notas',
      value: totalNotes,
      subtext: totalNotes === 1 ? '1 nota registrada' : `${totalNotes} notas registradas`,
      icon: FileText,
      iconColor: 'text-amber-500 dark:text-amber-400',
      iconBg: 'bg-amber-500/10 border-amber-500/20',
      active: selectedSourceType === null,
      onClick: () => onSelectSourceType?.(null),
      ariaLabel: 'Ver todas as notas',
    },
    {
      id: 'audios',
      label: 'Total de Áudios',
      value: totalAudios,
      subtext: totalAudios === 1 ? '1 gravação de áudio' : `${totalAudios} gravações de áudio`,
      icon: Mic,
      iconColor: 'text-orange-500 dark:text-orange-400',
      iconBg: 'bg-orange-500/10 border-orange-500/20',
      active: selectedSourceType === 'audio',
      onClick: () => onSelectSourceType?.('audio'),
      ariaLabel: 'Filtrar notas com áudio',
    },
    {
      id: 'tags',
      label: 'Tags Exclusivas',
      value: uniqueTagsCount,
      subtext: uniqueTagsCount === 1 ? '1 categoria única' : `${uniqueTagsCount} categorias únicas`,
      icon: TagIcon,
      iconColor: 'text-emerald-500 dark:text-emerald-400',
      iconBg: 'bg-emerald-500/10 border-emerald-500/20',
      active: false,
      onClick: undefined,
      ariaLabel: 'Tags exclusivas catalogadas',
    },
  ];

  return (
    <div
      aria-label="Métricas e resumo das notas"
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 w-full min-w-0"
    >
      {statItems.map((item) => {
        const Icon = item.icon;
        const isClickable = Boolean(item.onClick);

        return (
          <Card
            key={item.id}
            onClick={item.onClick}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={
              isClickable
                ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      item.onClick?.();
                    }
                  }
                : undefined
            }
            className={`p-4 transition-all duration-200 border border-[var(--border)] bg-[var(--surface)] select-none ${
              isClickable
                ? 'cursor-pointer hover:border-[var(--accent)]/50 hover:shadow-xs active:scale-[0.99]'
                : ''
            } ${
              item.active && selectedSourceType !== null
                ? 'ring-1 ring-[var(--accent)] border-[var(--accent)]'
                : ''
            }`}
          >
            <div className="flex items-center justify-between gap-3 min-w-0">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[var(--text-secondary)] tracking-tight">
                  {item.label}
                </p>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] leading-none">
                    {item.value}
                  </span>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--text-muted)] truncate font-normal">
                  {item.subtext}
                </p>
              </div>

              <div
                className={`h-11 w-11 rounded-[var(--radius-md)] border flex items-center justify-center shrink-0 ${item.iconBg} ${item.iconColor}`}
              >
                <Icon className="h-5 w-5" />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
