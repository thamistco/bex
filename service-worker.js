/* Service worker for Family Activities.

   The page is rebuilt every night, so while there is a connection it must
   never be served stale: page loads go to the network first, revalidating
   past the browser's HTTP cache, and fall back to the last saved copy only
   when offline. Icons and photos come from the cache and are refreshed in
   the background. Requests to other sites (fonts, provider pages) are left
   to the browser, so its own caching of them keeps working. */
const CACHE = 'family-activities-v2';

self.addEventListener('install', () => {
  self.skipWaiting();
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
    event.respondWith(networkFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(event, request));
  }
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE);
  try {
    const response = await fetch(request, { cache: 'no-cache' });
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (offline) {
    const saved = (await cache.match(request, { ignoreSearch: true })) || (await cache.match('./'));
    if (saved) return saved;
    throw offline;
  }
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
