// SynapseNotes Service Worker com suporte a Cache API e modo offline seguro
const CACHE_STATIC_NAME = 'synapsenotes-static-v4';
const CACHE_DATA_NAME = 'synapsenotes-data-v4';

const STATIC_PRECACHE_URLS = [
  '/',
  '/manifest.json',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/assets/imagemlogo/logo_synapsenotes.png',
];

// Instalação: ativa imediatamente sem esperar
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Aviso ao pré-carregar recursos:', err);
      });
    })
  );
});

// Ativação: remove todos os caches antigos imediatamente e assume controle
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_STATIC_NAME && name !== CACHE_DATA_NAME) {
            console.info('[SW] Removendo cache obsoleto:', name);
            return caches.delete(name);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições de Rede com Network-First prioritário
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora esquemas não-HTTP
  if (!url.protocol.startsWith('http')) return;

  // Ignora completamente recursos de desenvolvimento do Vite e arquivos TypeScript dinâmicos
  if (
    url.pathname.includes('/@vite/') ||
    url.pathname.includes('/@fs/') ||
    url.pathname.includes('/@id/') ||
    url.pathname.includes('/node_modules/') ||
    url.pathname.endsWith('.tsx') ||
    url.pathname.endsWith('.ts') ||
    url.search.includes('v=')
  ) {
    return;
  }

  // 1. REQUISIÇÕES DE API (/api/...)
  if (url.pathname.startsWith('/api/')) {
    if (request.method === 'GET') {
      event.respondWith(
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_DATA_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          })
          .catch(async () => {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }

            if (url.pathname.startsWith('/api/notes')) {
              const baseMatch = await caches.match('/api/notes');
              if (baseMatch) return baseMatch;
            }
            if (url.pathname.startsWith('/api/tasks')) {
              const baseMatch = await caches.match('/api/tasks');
              if (baseMatch) return baseMatch;
            }
            if (url.pathname.startsWith('/api/tags')) {
              const baseMatch = await caches.match('/api/tags');
              if (baseMatch) return baseMatch;
            }

            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                offline: true,
                message: 'Você está no modo offline. Nenhum dado em cache disponível.',
              }),
              {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Synapse-Offline': 'true' },
              }
            );
          })
      );
      return;
    }

    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'OFFLINE',
              message: 'Você está sem conexão com a internet.',
              status: 503,
            },
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      })
    );
    return;
  }

  // 2. NAVEGAÇÃO E RECURSOS ESTÁTICOS: Network-First (com fallback offline)
  // Garante que o usuário receba a versão mais recente e nunca trave em cache quebrado
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && request.method === 'GET') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_STATIC_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (request.mode === 'navigate') {
          const indexFallback = await caches.match('/index.html');
          if (indexFallback) return indexFallback;
          return caches.match('/');
        }
        return new Response('Offline', { status: 503 });
      })
  );
});
