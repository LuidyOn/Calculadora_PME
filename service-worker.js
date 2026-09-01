// service-worker.js (VERSÃO ROBUSTA)

const CACHE_NAME = 'simulador-financeiro-cache-v2.2.0'; // !!!!!!!!SEMPRE ATUALIZE A VERSÃO AQUI E NO INDEX ANTES DE SUBIR A APLICAÇÃO COM MUDANÇAS!!!!!!!!!
const urlsToCache = [
  '/Calculadora_PME/',
  '/Calculadora_PME/index.html',
  '/Calculadora_PME/manifest.json',
  '/Calculadora_PME/style/style.css',

  '/Calculadora_PME/script/main.js',
  '/Calculadora_PME/script/table-sticky-header.js',
  '/Calculadora_PME/script/pdf-documento.js',
  '/Calculadora_PME/script/agriculas/pronaf.js',
  '/Calculadora_PME/script/agriculas/moderfrota.js',
  '/Calculadora_PME/script/agriculas/tfbd.js',
  '/Calculadora_PME/script/construcao/cdc-ce.js',
  '/Calculadora_PME/script/construcao/mais-inovacao-ce.js',

  '/Calculadora_PME/HTMLs/agriculas/pronaf.html',
  '/Calculadora_PME/HTMLs/agriculas/moderfrota.html',
  '/Calculadora_PME/HTMLs/agriculas/tfbd.html',
  '/Calculadora_PME/HTMLs/construcao/cdc-ce.html',
  '/Calculadora_PME/HTMLs/construcao/mais-inovacao-ce.html',

  '/Calculadora_PME/vendor/html2canvas.min.js',
  '/Calculadora_PME/vendor/jspdf.umd.min.js',

  '/Calculadora_PME/icons/logo_newholland_192px.jpg',
  '/Calculadora_PME/icons/logo_newholland_512px.jpg',
  '/Calculadora_PME/logos/LOGO_AMARELA.png',
  '/Calculadora_PME/img/banner-home.jpg',
  '/Calculadora_PME/icons/whatsapp.png',
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

// --- Evento 'fetch' (STALE-WHILE-REVALIDATE) ---
//
// A estratégia anterior era "cache first" puro: uma vez que o arquivo entrava
// no cache, ele NUNCA mais era atualizado enquanto o cache existisse. Depois de
// uma publicação, o celular continuava recebendo o style.css antigo junto com o
// HTML/JS novos — mistura que quebrava o layout.
//
// Agora: entrega o cache na hora (rápido e funciona offline) e, em paralelo,
// busca a versão nova na rede e regrava o cache. A próxima abertura já vem
// correta, mesmo que o próprio service worker não tenha mudado.
self.addEventListener('fetch', event => {
  const request = event.request;

  // Ignora requisições não-GET, de extensões e de outras origens
  if (request.method !== 'GET') return;
  if (!request.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cachedResponse => {
        const redeEmParalelo = fetch(request)
          .then(networkResponse => {
            // Só guarda respostas próprias e bem-sucedidas
            if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
              cache.put(request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch(error => {
            // Offline (ou erro de rede)
            if (!cachedResponse && request.mode === 'navigate') {
              console.warn('SW: Falha de navegação, servindo index.html do cache.', error);
              return caches.match('/Calculadora_PME/index.html');
            }
            if (!cachedResponse) console.warn('SW: Fetch falhou:', request.url, error);
            return undefined;
          });

        // Tem cache? Entrega já; a revalidação segue em segundo plano.
        if (cachedResponse) {
          event.waitUntil(redeEmParalelo);
          return cachedResponse;
        }

        return redeEmParalelo;
      })
    )
  );
});
