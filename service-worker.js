// Incrementa la versione per forzare l'aggiornamento!
const staticCacheName = 'roberto-esposito-card-v4'; // Versione incrementata

// CONTROLLA OGNI SINGOLO PERCORSO IN QUESTA LISTA. DEVE ESSERE PERFETTO.
const assetsToCache = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css', // AGGIUNTO nuovo file CSS
  'js/main.js',    // AGGIUNTO nuovo file JS
  'roberto_personal.vcf',
  'roberto_business.vcf',
  'button-click.mp3',
  'card-flip.mp3',
  'prompt-open.mp3',
  'profile.jpg',
  'logo.png',
  'qr-code-share-card.png',
  'favicon.ico',
  'favicon.png',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'particles.min.js',
  'css/all.min.css',
  'webfonts/fa-solid-900.woff2',  
  'webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', event => {
  console.log(`[Service Worker] Tentativo di installazione cache v: ${staticCacheName}`);
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('[Service Worker] Caching assets...');
      return cache.addAll(assetsToCache).catch(error => {
        console.error('[Service Worker] Impossibile mettere in cache uno o più assets. Controlla i percorsi.', error);
      });
    })
  );
  self.skipWaiting(); // Forza l'attivazione del nuovo service worker
});

self.addEventListener('activate', event => {
    console.log(`[Service Worker] Attivazione nuova versione: ${staticCacheName}`);
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName)
                .map(key => {
                    console.log(`[Service Worker] Rimozione vecchia cache: ${key}`);
                    return caches.delete(key);
                })
            );
        })
    );
    return self.clients.claim(); // Prende il controllo immediato della pagina
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  // Strategia: Cache-First
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Se la risorsa è in cache, la restituisco. Altrimenti, la scarico dalla rete.
      return cachedResponse || fetch(event.request).then(fetchResponse => {
          // Opzionale: potresti voler mettere in cache anche le nuove richieste
          return fetchResponse;
      });
    })
  );
});
