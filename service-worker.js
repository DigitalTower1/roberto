const STATIC_CACHE = 're-card-v7';

const ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'service-worker.js',

  // CSS & Fonts
  'css/style.css',
  'css/all.min.css',
  'webfonts/fa-solid-900.woff2',
  'webfonts/fa-brands-400.woff2',

  // JS
  'js/main.js',
  'particles.min.js',

  // Media & Icons
  'roberto_personal.vcf',
  'roberto_business.vcf',
  'og-card-logo.png',     // <-- aggiornata all'immagine nuova
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
  'icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== STATIC_CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
