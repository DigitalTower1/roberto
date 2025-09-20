const staticCacheName = 'roberto-esposito-card-v1';

const assetsToCache = [
  './',
  'index.html',
  'manifest.json', // Aggiunto: il manifest è essenziale per la PWA
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
  'icons/icon-512x512.png'
];

// Evento 'install': il service worker viene installato
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(assetsToCache).catch(error => {
        console.error('Service Worker: Failed to cache assets.', error);
      });
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
  if (event.request.method !== 'GET') {
    return; // Ignora le richieste che non sono di tipo GET (es. POST)
  }
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(response => {
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(staticCacheName).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(error => {
        console.error('Fetch failed:', error);
        // Puoi restituire una pagina offline qui se lo desideri
      });
    })
  );
});
