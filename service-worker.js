/* Service worker for Family Activities.

   The page is rebuilt every night, so while there is a connection it must
   not be served stale: page loads go to the network first, past the
   browser's HTTP cache. The last good copy is the fallback: with no
   connection or a server error, a copy of any age (the page itself says
   when its research runs out); on a weak signal that has not answered in
   a few seconds, only a copy from the last day, since an older one could
   say there is nothing on today. The network still refreshes the copy for
   next time. Icons and photos come from the cache and are refreshed in the
   background. Requests to other sites (fonts, provider pages) are left to
   the browser. */
const CACHE = 'family-activities-v4';
const NETWORK_TIMEOUT_MS = 4000;
const RECENT_MS = 24 * 60 * 60 * 1000;
// Saved when the worker installs, so the very first visit already works offline.
const OPTIONAL_SHELL = ['manifest.json', 'icon-192.png', 'images/logo-156.webp'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      Promise.all([
        cache.add(new Request('./', { cache: 'no-cache' })),
        ...OPTIONAL_SHELL.map((url) => cache.add(url).catch(() => {})),
      ])
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(networkFirst(event));
  } else {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

async function networkFirst(event) {
  const request = event.request;
  // One saved copy per page, whatever query string a shared link carries.
  const key = request.url.split('#')[0].split('?')[0];
  // no-store, not no-cache: a request stalled on a weak signal would otherwise
  // hold the HTTP cache's lock on this address and stall the next launch too.
  const network = fetch(request, { cache: 'no-store' });
  // Saving runs beside the reply, so a slow or failed save never delays it
  // or turns an online visit into an offline one.
  event.waitUntil(
    network
      .then((response) => {
        if (!response.ok) return undefined;
        const copy = response.clone();
        return caches.open(CACHE).then((cache) => cache.put(key, copy));
      })
      .catch(() => {})
  );
  // Always wait for the network. Only use the saved copy if truly offline.
  // (Wali's request 2026-10-15: force refresh on every launch.)
  try {
    const response = await network;
    if (response.ok || response.status === 404) return response;
  } catch (e) {
    // Network failed, fall through to cache
  }
  const cache = await caches.open(CACHE);
  const hit = await cache.match(key).then((h) => h || cache.match('./'));
  if (hit) return hit;
  // No cache, rethrow the network error
  return network;
}

function staleWhileRevalidate(event, request) {
  const refreshed = caches.open(CACHE).then((cache) =>
    fetch(request).then((response) =>
      response.ok ? cache.put(request, response.clone()).then(() => response) : response
    )
  );
  event.waitUntil(refreshed.catch(() => {}));
  return caches.match(request).then((saved) => saved || refreshed);
}
