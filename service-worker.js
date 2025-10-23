// service-worker.js (VERSÃO ATUALIZADA)

const CACHE_NAME = 'simulador-financeiro-cache-v1.2'; // Mantenha ou incremente a versão se mudar os arquivos cacheados
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
  // Adicione outros assets se necessário
];

// --- Evento 'install' (sem mudanças) ---
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abrindo cache...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Cache preenchido!');
        return self.skipWaiting();
      })
      .catch(error => console.error('Service Worker: Falha no cache', error))
  );
});

// --- Evento 'activate' (sem mudanças) ---
self.addEventListener('activate', event => {
  console.log('Service Worker: Ativando...');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: Limpando cache antigo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
       console.log('Service Worker: Ativado!');
       return self.clients.claim();
    })
  );
});

// --- Evento 'fetch' (LÓGICA ATUALIZADA) ---
self.addEventListener('fetch', event => {
  // Ignora requisições não-GET ou de extensões
  if (event.request.method !== 'GET' || event.request.url.startsWith('chrome-extension://')) {
      return;
  }

  // Estratégia: Cache first, then network, with fallback for navigation
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Se encontrar no cache, retorna imediatamente
        if (cachedResponse) {
          // console.log('SW: Servindo do cache:', event.request.url);
          return cachedResponse;
        }

        // Se não encontrar no cache, busca na rede
        // console.log('SW: Buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Se a busca na rede funcionou, retorna a resposta da rede
            // (Opcional: você poderia clonar e colocar no cache aqui se quisesse)
            return networkResponse;
          }
        ).catch(error => {
          // <<< A MÁGICA ESTÁ AQUI >>>
          // Se a busca na rede FALHAR (estamos offline)...
          console.log('SW: Fetch falhou; offline?', event.request.url, error);
          
          // ...verifica se é uma requisição de NAVEGAÇÃO (ex: digitar URL, clicar link)
          if (event.request.mode === 'navigate') {
            // Se for navegação, retorna SEMPRE o index.html principal do cache.
            // Isso garante que o "aplicativo" sempre abra, mesmo offline.
            console.log('SW: Falha na navegação, servindo /index.html do cache.');
            return caches.match('/'); // Ou '/index.html', dependendo do que você cacheou como raiz
          }
          
          // Se não for navegação (ex: falha ao buscar uma imagem não cacheada), 
          // apenas retorna o erro (ou poderia retornar uma imagem placeholder).
          // Retornar 'undefined' aqui geralmente resulta no erro padrão "sem conexão" do navegador para aquele recurso específico.
          return undefined; 
        });
      })
  );
});