import type { ApiTask } from '../services/api.ts';

/**
 * Exporta o histórico de tarefas concluídas para formato CSV com BOM UTF-8
 * Inclui descrição, nota de origem, prioridade, data e horário exato de conclusão
 */
export function exportCompletedTasksToCSV(
  tasks: ApiTask[],
  getTaskCompletedAt: (task: ApiTask) => string,
  sortOrder: 'desc' | 'asc' = 'desc'
): { count: number } {
  const completedTasks = tasks.filter((t) => t.isCompleted);
  if (completedTasks.length === 0) {
    return { count: 0 };
  }

  // Ordenação de acordo com a preferência do usuário
  completedTasks.sort((a, b) => {
    const timeA = new Date(getTaskCompletedAt(a)).getTime();
    const timeB = new Date(getTaskCompletedAt(b)).getTime();
    return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
  });

  const headers = [
    'Tarefa',
    'Nota de Origem',
    'Prioridade',
    'Data de Conclusão',
    'Hora de Conclusão',
    'Data e Hora Completa',
    'ID da Tarefa',
  ];

  const escapeCSV = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return '""';
    const stringValue = String(value);
    return `"${stringValue.replace(/"/g, '""')}"`;
  };

  const rows = completedTasks.map((task) => {
    const iso = getTaskCompletedAt(task);
    const d = new Date(iso);
    const dateFormatted = !isNaN(d.getTime())
      ? `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      : 'N/A';
    const timeFormatted = !isNaN(d.getTime())
      ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
      : 'N/A';
    const fullFormatted = !isNaN(d.getTime())
      ? `${dateFormatted} às ${timeFormatted}`
      : 'N/A';

    const priorityLabel =
      task.priorityBucket === 'focus_today'
        ? 'Foco Hoje'
        : task.priorityBucket === 'upcoming'
        ? 'Em Breve'
        : 'Algum Dia';

    return [
      escapeCSV(task.content),
      escapeCSV(task.noteTitle || 'Sem nota associada'),
      escapeCSV(priorityLabel),
      escapeCSV(dateFormatted),
      escapeCSV(timeFormatted),
      escapeCSV(fullFormatted),
      escapeCSV(task.id),
    ].join(';');
  });

  // Prefixo BOM UTF-8 (\uFEFF) para abertura sem distorção de caracteres acentuados no Excel
  const csvContent = '\uFEFF' + [headers.map(escapeCSV).join(';'), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const now = new Date();
  const dateStamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  link.setAttribute('download', `synapsenotes_tarefas_concluidas_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);

  return { count: completedTasks.length };
}
