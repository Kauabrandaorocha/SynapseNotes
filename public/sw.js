// SynapseNotes Service Worker com suporte completo a Cache API e modo offline
const CACHE_STATIC_NAME = 'synapsenotes-static-v2';
const CACHE_DATA_NAME = 'synapsenotes-data-v2';

const STATIC_PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.png',
  '/pwa-192x192.png',
  '/pwa-512x512.png',
  '/assets/imagemlogo/logo_synapsenotes.png',
];

// Instalação: pré-carrega casca estática do aplicativo
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      return cache.addAll(STATIC_PRECACHE_URLS).catch((err) => {
        console.warn('[SW] Aviso ao pré-carregar recursos:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Ativação: remove caches antigos e assume controle imediato
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_STATIC_NAME && name !== CACHE_DATA_NAME) {
            return caches.delete(name);
          }
          return null;
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Interceptação de Requisições de Rede com Cache API
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Ignora requisições de esquemas não-HTTP (ex: chrome-extension:)
  if (!url.protocol.startsWith('http')) return;

  // 1. REQUISIÇÕES DE API (/api/...)
  if (url.pathname.startsWith('/api/')) {
    // Para operações de leitura (GET /api/notes, /api/tasks, /api/tags, etc.):
    // Estratégia Network-First com Cache API Fallback
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
            // Em caso de falha de conexão (offline), busca na Cache API
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }

            // Se for requisição de notas ou tarefas com parâmetros de busca, tenta casar com rota base
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

            // Fallback sintético estruturado para JSON em modo offline
            return new Response(
              JSON.stringify({
                success: true,
                data: [],
                offline: true,
                message: 'Você está no modo offline. Nenhum dado em cache disponível para esta consulta específica.',
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

    // Para requisições de escrita quando offline (POST, PUT, DELETE)
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'OFFLINE',
              message: 'Você está sem conexão com a internet. Conecte-se para salvar ou atualizar notas e tarefas no servidor.',
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

  // 2. NAVEGAÇÃO DE PÁGINAS (HTML)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
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
          const fallback = await caches.match('/index.html');
          if (fallback) return fallback;
          return caches.match('/');
        })
    );
    return;
  }

  // 3. RECURSOS ESTÁTICOS (JS, CSS, Imagens, Fontes)
  // Estratégia Stale-While-Revalidate com Cache API
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_STATIC_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => null);

      return cachedResponse || fetchPromise;
    })
  );
});
