// Basic service worker for PWA caching

const CACHE_NAME = 'vocalnote-cache-v1';
const urlsToCache = [
  '/',
  '/auth',
  '/account',
  '/manifest.json',
  // Ensure you have these icon files in public/icons/
  // '/icons/icon-192x192.png', 
  // '/icons/icon-512x512.png',
  'https://fonts.googleapis.com/css2?family=Inter&display=swap',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        const cachePromises = urlsToCache.map((urlToCache) => {
          return cache.add(urlToCache).catch(err => {
            console.warn(`Failed to cache ${urlToCache}:`, err);
          });
        });
        return Promise.all(cachePromises);
      })
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          (networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200 ) {
               // Don't cache non-200 responses directly
               // For 'opaque' and 'cors' types, they might be valid but check status
               if (networkResponse.type !== 'opaque' && networkResponse.type !== 'cors') {
                 return networkResponse;
               }
            }
            
            // For basic type, it's from your origin, cache it.
            // For cors/opaque, it's a cross-origin request, also cache if status is 200.
            if (networkResponse.status === 200 && (networkResponse.type === 'basic' || networkResponse.type === 'cors' || networkResponse.type === 'opaque')) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                  });
            }
            return networkResponse;
          }
        ).catch(error => {
          console.error('Fetching failed:', error);
          throw error;
        });
      })
  );
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
});
