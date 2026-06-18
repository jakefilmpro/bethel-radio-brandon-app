const CACHE_NAME = 'bethel-radio-v2';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles.css?v=1',
  '/app.js?v=1',
  '/pwa-install.js?v=1',
  '/images/Asset 1.webp',
  '/images/fallback.webp',
  '/images/favicon.ico',
  '/images/icon_180x180.png',
  '/images/icon_192x192.png',
  '/images/icon_512x512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;

  e.respondWith(
    fetch(e.request).catch(() => {
      return caches.match(e.request);
    })
  );
});
