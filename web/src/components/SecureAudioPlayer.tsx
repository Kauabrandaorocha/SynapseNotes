import { useEffect, useState, useRef } from 'react';
import { Volume2, ShieldCheck, AlertCircle } from 'lucide-react';
import { api } from '../services/api.ts';
import { Spinner } from './ui/spinner.tsx';

interface SecureAudioPlayerProps {
  noteId: string;
  sourceUrl?: string | null;
  durationSeconds?: number | null;
}

export function SecureAudioPlayer({ noteId, sourceUrl, durationSeconds }: SecureAudioPlayerProps) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    // Limpa Blob anterior se existir
    if (activeBlobUrlRef.current) {
      URL.revokeObjectURL(activeBlobUrlRef.current);
      activeBlobUrlRef.current = null;
    }
    setBlobUrl(null);

    const identifier = sourceUrl || noteId;
    if (!identifier) {
      setIsLoading(false);
      return;
    }

    api
      .fetchSecureAudioBlob(identifier)
      .then((url) => {
        if (!isMounted) {
          URL.revokeObjectURL(url);
          return;
        }
        activeBlobUrlRef.current = url;
        setBlobUrl(url);
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || 'Falha ao autenticar acesso ao áudio privado.');
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => {
      isMounted = false;
      if (activeBlobUrlRef.current) {
        URL.revokeObjectURL(activeBlobUrlRef.current);
        activeBlobUrlRef.current = null;
      }
    };
  }, [noteId, sourceUrl]);

  const formatDuration = (totalSeconds?: number | null) => {
    if (!totalSeconds || totalSeconds <= 0) return null;
    const mins = Math.floor(totalSeconds / 60);
    const secs = Math.round(totalSeconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-3.5 sm:p-4 rounded-[var(--radius-sm)] bg-[var(--surface-hover)] border border-[var(--border)] space-y-2.5">
      <div className="flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <div className="flex items-center gap-1.5 font-semibold text-[var(--accent)]">
          <Volume2 className="h-4 w-4 shrink-0" />
          <span>Gravação de Áudio Privada</span>
        </div>
        <div className="flex items-center gap-2">
          {formatDuration(durationSeconds) && (
            <span className="font-mono text-[11px] text-[var(--text-muted)]">
              {formatDuration(durationSeconds)}
            </span>
          )}
          <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-medium">
            <ShieldCheck className="h-3 w-3" /> Protegido via JWT
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center gap-2 py-3 text-xs text-[var(--text-muted)]">
          <Spinner size="sm" />
          <span>Autenticando e descriptografando stream de áudio...</span>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 p-2.5 rounded-[var(--radius-xs)] bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      ) : blobUrl ? (
        <div className="w-full">
          <audio
            controls
            src={blobUrl}
            preload="metadata"
            className="w-full h-9 outline-none focus:ring-1 focus:ring-[var(--accent)] rounded-lg"
          />
        </div>
      ) : null}
    </div>
  );
}
