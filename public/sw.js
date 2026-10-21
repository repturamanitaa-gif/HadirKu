const CACHE_NAME = 'hadirku-cache-v3';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Relative caching that works in both localhost and /HadirKu/ subfolder
      return cache.addAll([
        './',
        './index.html',
        './manifest.webmanifest',
        './favicon.svg',
        './icon-192x192.png',
        './icon-512x512.png',
      ]).catch((err) => {
        console.warn('SW cache pre-fetch warning:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = request.url;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Do not cache sensitive endpoints (Firebase Auth, Firestore, APIs)
  if (BYPASS_URL_PATTERNS.some((pattern) => pattern.test(url))) {
    return;
  }

  // 1. Navigation requests (HTML / SPA routes): Network-first with fallback to cached index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          const cachedNavigate = await caches.match(request);
          if (cachedNavigate) return cachedNavigate;
          const cachedIndex = await caches.match('./index.html');
          if (cachedIndex) return cachedIndex;
          return caches.match('./');
        })
    );
    return;
  }

  // 2. Static Vite build assets & fonts: Stale-while-revalidate or Cache-first
  if (
    url.includes('/assets/') ||
    url.endsWith('.js') ||
    url.endsWith('.css') ||
    url.endsWith('.png') ||
    url.endsWith('.svg') ||
    url.includes('fonts.googleapis.com') ||
    url.includes('fonts.gstatic.com')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Revalidate in background
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
          return cachedResponse;
        }

        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 3. Default fallback: Network-first
  event.respondWith(
    fetch(request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(request);
      })
  );
});
