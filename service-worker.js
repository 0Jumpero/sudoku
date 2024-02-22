// Cache name and resources to cache
const CACHE_NAME = 'sudoku-v3';
const RES = [
  '.',
  '/favicon.ico',
  'index.html',
  'script.js',
  'style.css',
  'manifest.json',
  'service-worker.js',
  'img/icon-72.png',
  'img/icon-128.png',
  'img/icon-144.png',
  'img/icon-192.png',
  'img/icon-512.png',
  'img/icon.png'
];

// Install the service worker and cache resources
self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(RES)));
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((cacheNames) => Promise.all(cacheNames.map((cacheName) => {
    if(cacheName !== CACHE_NAME) {
      return caches.delete(cacheName);
    }
  }))));
});

// Fetch intercept to load resources from cache
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if(cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request);
    }),
  );
});
