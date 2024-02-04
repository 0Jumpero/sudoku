const CACHE_NAME = 'sudoku-v1';

// Install the service worker and cache resources
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll([
        '/',
        '/index.html',
        '/script.js',
        '/style.css',
        '/manifest.json',
        '/service-worker.js',
        '/img/icon-72.png',
        '/img/icon-128.png',
        '/img/icon-144.png',
        '/img/icon-192.png',
        '/img/icon-512.png',
        '/img/icon.png'
      ]);
    })
  );
});

// Activate the service worker and clean up old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (cacheNames) {
      return Promise.all(
        cacheNames.map(function (cacheName) {
          if(cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
