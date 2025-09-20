const staticCacheName = 'roberto-esposito-card-v2'; // Incrementa la versione!

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
  // === NUOVI FILE DA METTERE IN CACHE ===
  'particles.min.js',
  'css/all.min.css',
  // Aggiungi qui anche i file dei webfont di Font Awesome
  'webfonts/fa-solid-900.woff2',
  'webfonts/fa-brands-400.woff2',
  // NOTA: controlla i nomi esatti dei file .woff2 nella cartella webfonts che hai scaricato
];

// L'evento 'install' rimane invariato, ma ora metterà in cache le risorse corrette
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(staticCacheName).then(cache => {
      console.log('Service Worker: Caching assets...');
      return cache.addAll(assetsToCache);
    })
  );
});

// L'evento 'activate' va bene così com'è, pulirà la vecchia cache 'v1'
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


// Anche l'evento 'fetch' va bene. La differenza è che ora troverà all.min.css e particles.min.js nella cache.
// Per Google Fonts, il browser gestisce la cache in modo efficiente, ma per un'app 100% offline dovresti scaricare anche quelli.
// Per ora, questa configurazione è già abbastanza robusta da soddisfare i criteri di installabilità.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request);
    })
  );
});
