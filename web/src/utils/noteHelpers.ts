/**
 * Funções utilitárias puras para notas, títulos, links e durações
 * Extraídas para evitar dependência circular entre App.tsx e utilitários de exportação.
 */

export function formatAudioDuration(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || isNaN(seconds) || seconds <= 0) {
    return 'Áudio';
  }
  const totalSeconds = Math.round(seconds);
  const mins = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  if (mins === 0) {
    return `${secs}s`;
  }
  if (secs === 0) {
    return `${mins}m`;
  }
  return `${mins}m ${secs.toString().padStart(2, '0')}s`;
}

export function cleanNoteTitle(title?: string | null): string {
  if (!title) return '';
  return title.replace(/^Gravação de Voz\s*—\s*\d{1,2}\/\d{1,2}\/\d{2,4}$/i, 'Gravação de Voz');
}

export function getNoteLink(
  note?: { sourceType?: string; sourceUrl?: string | null; rawContent?: string | null; hasAudio?: boolean } | null,
): string | null {
  if (!note) return null;
  // Áudios gravados e mídias privadas nunca devem ser tratados como link externo
  if (note.sourceType === 'audio' || note.hasAudio) return null;
  if (note.sourceUrl && typeof note.sourceUrl === 'string' && note.sourceUrl.trim()) {
    const trimmed = note.sourceUrl.trim();
    // Bloqueia qualquer rota interna de API (/api/ ou /media/) de ser exposta na UI
    if (trimmed.startsWith('/api/') || trimmed.startsWith('api/') || trimmed.includes('/media/')) {
      return null;
    }
    return trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
  }
  if (note.rawContent && typeof note.rawContent === 'string') {
    const match = note.rawContent.trim().match(/https?:\/\/[^\s]+/i);
    if (match && !match[0].includes('/api/') && !match[0].includes('/media/')) {
      return match[0];
    }
  }
  return null;
}
