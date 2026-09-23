const CACHE_NAME = 'vedic-astrology-lesson-v4-astronomy-engine';
const CORE_ASSETS = [
  './',
  './index.html',
  './install.html',
  './assets/vedic-style.css?v=17',
  './assets/vedic-data.js?v=16',
  './assets/vedic-engine.mjs',
  './assets/astronomy-engine.mjs',
  './assets/LICENSE-Astronomy-Engine.txt',
  './license.html',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((key) => key.startsWith('vedic-astrology-lesson-') && key !== CACHE_NAME).map((key) => caches.delete(key))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).then((response) => {
        const copy = response.clone();
        if(response.ok && new URL(event.request.url).origin === self.location.origin) caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      }).catch(() => event.request.mode === 'navigate' ? caches.match('./index.html') : Response.error());
    })
  );
});
