import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall.ts';

export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // Se já estiver rodando em modo standalone (app instalado), não exibe o botão
  if (isInstalled) {
    return null;
  }

  // Fluxo para Chromium / Android / Desktop com evento beforeinstallprompt
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors cursor-pointer whitespace-nowrap shadow-2xs ${className}`}
        title="Instalar SynapseNotes no seu dispositivo"
      >
        <Download className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
        <span className="hidden sm:inline">Instalar App</span>
      </button>
    );
  }

  // Fluxo guiado para iOS Safari
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-[var(--radius-sm)] text-xs font-medium bg-[var(--surface-subtle)] text-[var(--text-secondary)] hover:text-[var(--accent)] hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)] hover:border-[var(--border)] transition-colors cursor-pointer whitespace-nowrap shadow-2xs ${className}`}
          title="Como instalar no iPhone/iPad"
        >
          <Download className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
          <span className="hidden sm:inline">Instalar</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
            <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] text-[var(--foreground)] border border-[var(--border)] p-5 shadow-2xl space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-primary)]">Instalar no iPhone / iPad</h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                1. Toque no botão de <strong>Compartilhar</strong> na barra do Safari.<br />
                2. Role para baixo e selecione <strong>Adicionar à Tela de Início</strong>.<br />
                3. Pronto! O SynapseNotes funcionará como um app nativo, inclusive sem internet.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-semibold hover:bg-[var(--accent-hover)] transition-colors cursor-pointer mt-2"
              >
                Entendi
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
