/* Service worker: enables PWA installability.
   Always bypasses the HTTP cache so the daily-updated page is never stale:
   every launch fetches the live version from the network. */
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request, { cache: 'no-store' }));
});
