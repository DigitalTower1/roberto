const staticCacheName = 'roberto-esposito-card-v5';

const assetsToCache = [
  './',
  'index.html',
  'manifest.json',
  'css/style.css',
  'js/main.js',
  'roberto_personal.vcf',
  'roberto_business.vcf',
  'button-click.mp3',
  'card-flip.mp3',
  'prompt-open.mp3',
  'profile.jpg',
  'logo.png',
  'qr-code-share-card.png',
  'share_icon.png',
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
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      return cache.addAll(assetsToCache);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(keys
                .filter(key => key !== staticCacheName)
                .map(key => caches.delete(key))
            );
        })
    );
    return self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
