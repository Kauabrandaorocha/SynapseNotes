import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <aside
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 rounded-full bg-amber-600/95 dark:bg-amber-600 text-white px-4 py-2 text-xs font-medium shadow-lg backdrop-blur-xs border border-amber-500/30 animate-in fade-in slide-in-from-bottom-2 duration-200"
    >
      <span className="relative flex h-2.5 w-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white" />
      </span>
      <WifiOff className="h-3.5 w-3.5 shrink-0" />
      <span>Modo Offline — Visualizando notas e tarefas salvas em cache local</span>
    </aside>
  );
};
