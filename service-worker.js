// service-worker.js (VERSÃO ROBUSTA)

const CACHE_NAME = 'simulador-financeiro-cache-v1.6'; // Mantenha v2 ou incremente para v3 se já tinha subido a v2
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/style/style.css',
  '/script/main.js',
  '/script/pronaf.js',
  '/script/moderfrota.js',
  '/script/tfbd.js',
  '/HTMLs/pronaf.html',
  '/HTMLs/moderfrota.html',
  '/HTMLs/tfbd.html',
  '/icons/logo_newholland_192px.jpg',
  '/icons/logo_newholland_512px.jpg',
    // logos
  '/logos/LOGO_AMARELA.png',
];

// --- Evento 'install' ---
self.addEventListener('install', event => {
  console.log('SW: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Pré-cacheando arquivos da App Shell...');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
      .catch(error => console.error('SW: Falha no pré-cache', error))
  );
});

// --- Evento 'activate' ---
self.addEventListener('activate', event => {
  console.log('SW: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => cacheName !== CACHE_NAME) // Filtra para deletar SÓ os caches antigos
                 .map(cacheName => {
                    console.log('SW: Deletando cache antigo:', cacheName);
                    return caches.delete(cacheName);
                  })
      );
    }).then(() => self.clients.claim())
  );
});

// --- Evento 'fetch' (ESTRATÉGIA ROBUSTA) ---
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET ou de extensões
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
    return;
  }

  // Estratégia: Cache first, fallback to network. For navigation errors, fallback to offline page (index.html).
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // 1. Encontrou no Cache? Entrega!
        if (cachedResponse) {
          // console.log('SW: Servindo do cache:', event.request.url);
          return cachedResponse;
        }

        // 2. Não achou no Cache? Tenta a Rede.
        // console.log('SW: Buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // 3. Rede funcionou? Entrega a resposta da rede.
            // console.log('SW: Servindo da rede:', event.request.url);
            // Opcional: guardar a resposta no cache aqui se desejar cache dinâmico.
            return networkResponse;
          }
        ).catch(error => {
          // 4. Rede FALHOU (Offline ou erro)?
          console.warn('SW: Fetch da rede falhou:', event.request.url, error);

          // 5. Se foi uma NAVEGAÇÃO, entrega o index.html do cache como fallback!
          if (event.request.mode === 'navigate') {
            console.log('SW: Falha de navegação. Servindo fallback /index.html do cache.');
            return caches.match('/'); // Ou '/index.html'
          }

          // 6. Se NÃO foi navegação (imagem, etc.), apenas retorna erro (ou um placeholder)
          // Retornar 'undefined' deixa o navegador mostrar o erro padrão para aquele recurso.
          return undefined; 
        });
      })
  );
});