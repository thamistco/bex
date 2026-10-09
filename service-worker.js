/* Service worker for Family Activities.

   The page is rebuilt every night, so while there is a connection it must
   never be served stale: page loads go to the network first, revalidating
   past the browser's HTTP cache. The last good copy is the fallback, used
   when there is no connection, when the server errors, and when a weak
   signal has not answered within a few seconds (the network still
   refreshes the copy for next time). Icons and photos come from the cache
   and are refreshed in the background. Requests to other sites (fonts,
   provider pages) are left to the browser. */
const CACHE = 'family-activities-v3';
const NETWORK_TIMEOUT_MS = 4000;
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
  const network = fetch(request, { cache: 'no-cache' });
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
  const saved = () =>
    caches.open(CACHE).then((cache) => cache.match(key).then((hit) => hit || cache.match('./')));
  const slow = new Promise((resolve) => setTimeout(resolve, NETWORK_TIMEOUT_MS, 'slow'));
  const first = await Promise.race([network.catch(() => 'offline'), slow]);
  // A 404 is shown as it is: it means the page has gone, and an old copy would hide that.
  if (first !== 'slow' && first !== 'offline' && first.status < 500) return first;
  return (await saved()) || network;
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
