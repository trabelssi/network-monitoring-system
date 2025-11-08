const CACHE_NAME = 'glpi-cache-v3';

// Assets that should be cached immediately
const PRECACHE_ASSETS = [
    '/',
    '/favicon.ico',
    '/glpi-logo.png'
];

// Install event - precache critical assets
self.addEventListener('install', event => {
    console.log('Service Worker installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(PRECACHE_ASSETS);
            })
            .catch(error => {
                console.error('Precaching failed:', error);
            })
    );
    // Activate new service worker immediately
    self.skipWaiting();
});

// Activate event - cleanup old caches
self.addEventListener('activate', event => {
    console.log('Service Worker activating...');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    // Ensure service worker takes control immediately
    self.clients.claim();
});

// Fetch event - serve from cache, falling back to network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    // Skip non-HTTP(S) requests
    if (!event.request.url.startsWith('http')) return;

    // Skip Chrome extensions and other special URLs
    if (event.request.url.startsWith('chrome-extension://') || 
        event.request.url.includes('chrome://') ||
        event.request.url.includes('moz-extension://')) {
        return;
    }

    // Skip WebSocket connections and development server URLs
    if (event.request.url.includes('ws://') || 
        event.request.url.includes('wss://') ||
        event.request.url.includes(':5173') ||
        event.request.url.includes(':5174') ||
        event.request.url.includes('hot-update')) {
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Return cached version if available
                if (response) {
                    return response;
                }

                // Try to fetch from network
                return fetch(event.request)
                    .then(response => {
                        // Don't cache non-successful responses
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        // Skip caching for certain file types and dynamic content
                        const url = event.request.url;
                        if (url.includes('/api/') || 
                            url.includes('?') || 
                            url.includes('.json') ||
                            url.includes('csrf-token') ||
                            url.includes('_token=')) {
                            return response;
                        }

                        // Clone the response for caching
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            })
                            .catch(error => {
                                console.warn('Failed to cache response:', error);
                            });

                        return response;
                    })
                    .catch(error => {
                        console.warn('Fetch failed for:', event.request.url, error);
                        
                        // Return a meaningful offline page or fallback
                        if (event.request.mode === 'navigate') {
                            return caches.match('/') || new Response('Offline', {
                                status: 503,
                                statusText: 'Service Unavailable',
                                headers: new Headers({
                                    'Content-Type': 'text/plain'
                                })
                            });
                        }
                        
                        // For other requests, return a generic error response
                        return new Response('Resource not available offline', {
                            status: 503,
                            statusText: 'Service Unavailable',
                            headers: new Headers({
                                'Content-Type': 'text/plain'
                            })
                        });
                    });
            })
            .catch(error => {
                console.error('Cache match failed:', error);
                // Fallback to network
                return fetch(event.request).catch(() => {
                    return new Response('Service Worker Error', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
    );
});

// Handle service worker updates
self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});
