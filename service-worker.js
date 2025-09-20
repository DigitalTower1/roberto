const staticCacheName = 'roberto-esposito-card-v1';

// IMPORTANTE: Elenca qui TUTTI i file che la tua pagina deve caricare.
const assetsToCache = [
  './',
  'index.html',
  'profile.jpg',
  'logo.png',
  'qr-code-share-card.png',
  'button-click.mp3',
  'card-flip.mp3',
  'prompt-open.mp3',
  'roberto_personal.vcf',
  'roberto_business.vcf',
  'icons/icon-192x192.png',
  'icons/icon-512x512.png',
  'background-music.mp3',
  'favicon.ico',
  'favicon.png',
  'logo.png',
  'profile.png',
  'profile.jpg',
  'qr-code-personale.png',
  'qr-code-business.png',
  'roberto_esposito.vcf'
  // Aggiungi qui altri file se necessario (es. favicon.ico)
];

// Evento 'install': il service worker viene installato
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(assetsToCache);
    })
  );
});

// Evento 'activate': pulisce le vecchie cache se ce ne sono
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


// Evento 'fetch': intercetta le richieste di rete
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      // Restituisce la risposta dalla cache se presente, altrimenti fa una richiesta di rete
      return cachedResponse || fetch(event.request);
    })
  );
});
