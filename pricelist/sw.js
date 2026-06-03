const CACHE_NAME = 'ciccu-cache-v1';
const urlsToCache = [
  './index.html',
  './admin.html',
  './script.js',
  './manifest.json',
  './manifest-admin.json',
  './icon-192.png',
  './icon-512.png'
];

// Proses Install Cache
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

// Proses Fetch Data (Mengutamakan jaringan agar data selalu up-to-date)
self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request).catch(() => {
      return caches.match(event.request);
    })
  );
});

