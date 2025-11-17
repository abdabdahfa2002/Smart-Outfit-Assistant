
const CACHE_NAME = 'smart-outfit-assistant-v2'; // Version bumped
const URLS_TO_PRECACHE = [
  '/',
  '/index.html',
  // Key CDN assets for offline UI.
  // The service worker will also cache other assets (like React from aistudiocdn and images) 
  // on first load via the 'fetch' event handler.
  'https://cdn.tailwindcss.com',
  'https://cdnjs.cloudflare.com/ajax/libs/heroicons/2.1.3/24/outline/heroicons.min.css'
];

// Install a service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(URLS_TO_PRECACHE);
      })
  );
});

// Cache and return requests
self.addEventListener('fetch', event => {
    // We only want to handle GET requests.
    if (event.request.method !== 'GET') {
        return;
    }

    // Network-first for navigation requests (the HTML page).
    // This ensures the user always gets the latest version of the app shell if online.
    if (event.request.mode === 'navigate') {
        event.respondWith(
            fetch(event.request).catch(() => caches.match('/index.html'))
        );
        return;
    }
    
    // Cache-first for all other assets (CSS, JS, Images, etc.).
    // This makes the app load fast and work offline.
    event.respondWith(
        caches.match(event.request)
        .then(response => {
            // If we have a cached response, return it.
            if (response) {
                return response;
            }

            // Otherwise, fetch from the network.
            return fetch(event.request).then(
                response => {
                    // Check for a valid response.
                    if (!response || response.status !== 200 || (response.type !== 'basic' && response.type !== 'cors')) {
                        return response;
                    }
                    
                    // Clone the response to cache it for future use.
                    const responseToCache = response.clone();

                    caches.open(CACHE_NAME)
                        .then(cache => {
                            // Don't cache the API calls to Google.
                            if (event.request.url.includes('generativelanguage.googleapis.com')) {
                                return;
                            }
                            cache.put(event.request, responseToCache);
                        });

                    return response;
                }
            );
        })
    );
});


// Update a service worker: clean up old caches.
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
