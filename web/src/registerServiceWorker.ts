/**
 * Registro do Service Worker com Cache API para SynapseNotes
 * Permite funcionamento offline e precache de recursos e requisições à API
 */
export function registerServiceWorker(): void {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Monitora atualizações no service worker
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
}
