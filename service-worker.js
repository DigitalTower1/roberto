const staticCacheName = 'roberto-esposito-card-v2';

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
  // Risorse locali aggiunte per il funzionamento offline
  'particles.min.js',
  'css/all.min.css',
  'webfonts/fa-solid-900.woff2',
  'webfonts/fa-brands-400.woff2'
  // IMPORTANTE: Aggiungi qui i percorsi a TUTTI gli altri file .woff2 presenti nella cartella webfonts
];

// Evento 'install': il service worker viene installato e mette in cache gli asset
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(assetsToCache).catch(error => {
        console.error('Service Worker: Failed to cache some assets.', error);
      });
    })
  );
});

// Evento 'activate': pulisce le vecchie cache
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(keys
        .filter(key => key !== staticCacheName)
        .map(key => caches.delete(key))
      );
    })
  );
});

// Evento 'fetch': intercetta le richieste di rete, servendo dalla cache se disponibile
self.addEventListener('fetch', event => {
  // Ignora richieste non-GET
  if (event.request.method !== 'GET') {
    return;
  }
  
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Se la risorsa è in cache, la restituisce. Altrimenti, la scarica dalla rete.
      return cachedResponse || fetch(event.request);
    })
  );
});
