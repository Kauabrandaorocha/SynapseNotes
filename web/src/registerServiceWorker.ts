/**
 * Registro do Service Worker com Cache API para SynapseNotes
 * Permite funcionamento offline e precache de recursos e requisições à API
 */
export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  // Em ambiente de desenvolvimento do Vite (compilação dinâmica de módulos TypeScript),
  // desregistra qualquer Service Worker ativo e limpa caches para evitar tela branca por módulos defasados.
  if (import.meta.env.DEV) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const reg of registrations) {
        reg.unregister().then(() => {
          console.info('[SW] Service Worker desregistrado para desenvolvimento contínuo.');
        });
      }
    });

    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const key of keys) {
          caches.delete(key);
        }
      });
    }
    return;
  }

  // Em produção, registra o SW com atualização automática
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        registration.update();
        registration.onupdatefound = () => {
          const installingWorker = registration.installing;
          if (installingWorker) {
            installingWorker.onstatechange = () => {
              if (installingWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  console.info('[SW] Nova versão do SynapseNotes em cache.');
                } else {
                  console.info('[SW] Conteúdo pré-armazenado em cache para uso offline.');
                }
              }
            };
          }
        };
      })
      .catch((err) => {
        console.warn('[SW] Não foi possível registrar o Service Worker:', err);
      });
  });
}
