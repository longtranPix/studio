// Basic service worker for VocalNote
const CACHE_NAME = 'vocalnote-cache-v1';
const urlsToCache = [
  '/',
  '/manifest.json',
  // Add paths to your crucial JS/CSS bundles once known
  // e.g., '/_next/static/css/main.css', '/_next/static/chunks/main-app.js'
  // Add paths to icons
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .catch(err => {
        console.error('Failed to open cache or add URLs:', err);
      })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // For navigation requests, try network first, then cache, then offline page
  if (event.request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(event.request);
          return networkResponse;
        } catch (error) {
          console.log('Network request failed, trying cache for:', event.request.url);
          const cache = await caches.open(CACHE_NAME);
          const cachedResponse = await cache.match(event.request);
          // TODO: Create an offline.html page to serve here
          // if (cachedResponse) return cachedResponse;
          // const offlinePage = await cache.match('/offline.html');
          // if (offlinePage) return offlinePage;
          return cachedResponse || new Response("You are offline. Please check your internet connection.", { status: 503, statusText: "Service Unavailable", headers: { 'Content-Type': 'text/plain' } });
        }
      })()
    );
  } else {
    // For other requests (assets), try cache first, then network
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          return response || fetch(event.request).then(networkResponse => {
            // Optionally cache new assets on the fly
            // if (networkResponse && networkResponse.status === 200) {
            //   const cache = await caches.open(CACHE_NAME);
            //   cache.put(event.request, networkResponse.clone());
            // }
            return networkResponse;
          }).catch(error => {
            console.log('Fetch failed for asset:', event.request.url, error);
            // Optionally return a placeholder for images/assets if they fail and are not in cache
          });
        })
    );
  }
});
