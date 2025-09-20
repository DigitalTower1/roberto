// Incrementa la versione per forzare l'aggiornamento!
const staticCacheName = 'roberto-esposito-card-v3'; 

// CONTROLLA OGNI SINGOLO PERCORSO IN QUESTA LISTA. DEVE ESSERE PERFETTO.
const assetsToCache = [
  './',
  'index.html',
  'manifest.json',
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
  // ESEMPIO: Questi percorsi devono corrispondere ESATTAMENTE ai tuoi file
  'webfonts/fa-solid-900.woff2', 
  'webfonts/fa-brands-400.woff2'
];

self.addEventListener('install', event => {
  console.log(`[Service Worker] Tentativo di installazione cache v: ${staticCacheName}`);
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('[Service Worker] Caching assets...');
      return cache.addAll(assetsToCache).catch(error => {
        // QUESTO LOG È FONDAMENTALE PER IL DEBUG
        console.error('[Service Worker] Impossibile mettere in cache gli assets. Uno o più percorsi sono errati.', error);
      });
    })
  );
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
});


self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
