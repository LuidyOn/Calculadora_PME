// service-worker.js

const CACHE_NAME = 'simulador-financeiro-cache-v1'; // Nome do cache (mude 'v1' se atualizar os arquivos)
const urlsToCache = [
  '/', // Atalho para o index.html na raiz
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
  // Adicione aqui os caminhos para seus ÍCONES (essencial!)
  '/icons/logo_newholland_192px.jpg',
  '/icons/logo_newholland_512px.jpg',
  // logos
  '/logos/LOGO_AMARELA.png',
  // Adicione quaisquer outras imagens ou fontes que seu site use
  // '/images/logo.png', 
  // '/fonts/meufonte.woff2',

  // NÃO adicione aqui os scripts de bibliotecas externas (jsPDF, html2canvas) via CDN.
  // O Service Worker focará nos seus arquivos locais.
];

// Evento 'install': Ocorre quando o Service Worker é instalado pela primeira vez.
// Aqui nós abrimos o cache e adicionamos nossos arquivos essenciais.
self.addEventListener('install', event => {
  console.log('Service Worker: Instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Abrindo cache e adicionando arquivos...');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Service Worker: Arquivos adicionados ao cache com sucesso!');
        return self.skipWaiting(); // Força a ativação imediata do novo SW
      })
      .catch(error => {
        console.error('Service Worker: Falha ao adicionar arquivos ao cache', error);
      })
  );
});

// Evento 'activate': Ocorre quando o Service Worker é ativado.
// Aqui limpamos caches antigos para evitar conflitos.
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
       console.log('Service Worker: Ativado com sucesso!');
       return self.clients.claim(); // Garante que o SW controle as páginas abertas imediatamente
    })
  );
});

// Evento 'fetch': Ocorre toda vez que a página tenta buscar um recurso (arquivo, imagem, etc.).
// Esta é a mágica do offline: tentamos pegar do cache primeiro.
self.addEventListener('fetch', event => {
  // Ignora requisições que não são GET (como POSTs para um servidor, se houvesse)
  if (event.request.method !== 'GET') {
      return;
  }

  // Ignora requisições para extensões do Chrome
  if (event.request.url.startsWith('chrome-extension://')) {
      return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se encontrarmos o arquivo no cache, retorna ele imediatamente.
        if (response) {
          // console.log('Service Worker: Recurso encontrado no cache:', event.request.url);
          return response;
        }

        // Se não encontrar no cache, tenta buscar na rede.
        // console.log('Service Worker: Recurso não encontrado no cache, buscando na rede:', event.request.url);
        return fetch(event.request).then(
          networkResponse => {
            // Se a busca na rede falhar (offline), não fazemos nada (poderíamos mostrar uma página offline genérica aqui)
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
               // console.log('Service Worker: Falha ao buscar na rede ou resposta inválida:', event.request.url);
               return networkResponse; // Retorna a resposta de erro (ex: 'offline')
            }

            // Opcional: Se quiser que novos arquivos sejam cacheados dinamicamente
            // let responseToCache = networkResponse.clone();
            // caches.open(CACHE_NAME)
            //   .then(cache => {
            //     cache.put(event.request, responseToCache);
            //   });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Service Worker: Erro ao buscar na rede', error);
            // Aqui você poderia retornar uma resposta offline personalizada, se quisesse
            // return new Response('Você está offline.', { status: 503, statusText: 'Service Unavailable' });
        });
      })
  );
});