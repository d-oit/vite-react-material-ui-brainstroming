// Service Worker with Workbox
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';
import { BackgroundSyncPlugin } from 'workbox-background-sync';

declare const self: ServiceWorkerGlobalScope;

// Use with precache injection
precacheAndRoute(self.__WB_MANIFEST);

// Set up App Shell-style routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$');
registerRoute(
  // Return false to exempt requests from being fulfilled by index.html.
  ({ request, url }: { request: Request; url: URL }) => {
    // If this is an API request, don't use the App Shell
    if (url.pathname.startsWith('/api/')) {
      return false;
    }

    // If this is a resource that should be handled by workbox caching strategies, skip the App Shell
    if (request.mode !== 'navigate') {
      return false;
    }

    // If this looks like a URL for a resource, because it contains a file extension, skip the App Shell
    if (url.pathname.match(fileExtensionRegexp)) {
      return false;
    }

    return true;
  },
  createHandlerBoundToURL('/index.html')
);

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
  /^https:\/\/fonts\.googleapis\.com/,
  new StaleWhileRevalidate({
    cacheName: 'google-fonts-stylesheets',
  })
);

// Cache the underlying font files with a cache-first strategy for 1 year.
registerRoute(
  /^https:\/\/fonts\.gstatic\.com/,
  new CacheFirst({
    cacheName: 'google-fonts-webfonts',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
        maxEntries: 30,
      }),
    ],
  })
);

// Cache static assets with a cache-first strategy
registerRoute(
  ({ request }) => {
    return (
      // CSS
      request.destination === 'style' ||
      // JavaScript
      request.destination === 'script' ||
      // Web Workers
      request.destination === 'worker' ||
      // Images
      request.destination === 'image'
    );
  },
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 60,
      }),
    ],
  })
);

// API requests with network-first strategy and background sync for offline
const apiSyncPlugin = new BackgroundSyncPlugin('api-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (specified in minutes)
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses',
    plugins: [
      apiSyncPlugin,
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 1 day
        maxEntries: 50,
      }),
    ],
  })
);

// Fallback route for document requests - use network-first for HTML documents
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'documents',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache static assets with a cache-first strategy
registerRoute(
  ({ request }) => {
    return (
      // CSS
      request.destination === 'style' ||
      // JavaScript
      request.destination === 'script' ||
      // Web Workers
      request.destination === 'worker' ||
      // Images
      request.destination === 'image'
    );
  },
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        maxEntries: 60,
      }),
    ],
  })
);

// API requests with network-first strategy and background sync for offline
const apiSyncPlugin2 = new BackgroundSyncPlugin('api-queue-2', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 hours (specified in minutes)
});

registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-responses-2',
    plugins: [
      apiSyncPlugin2,
      new ExpirationPlugin({
        maxAgeSeconds: 60 * 60 * 24, // 1 day
        maxEntries: 50,
      }),
    ],
  })
);

// Fallback route for document requests - use network-first for HTML documents
registerRoute(
  ({ request }) => request.destination === 'document',
  new NetworkFirst({
    cacheName: 'documents',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  })
);

// Cache images
registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif)$/,
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  })
);

// Cache CSS and JavaScript Files
registerRoute(
  /\.(?:js|css)$/,
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Background sync for offline operations
const offlineOperationsSyncPlugin = new BackgroundSyncPlugin('offline-operations-queue', {
  maxRetentionTime: 24 * 60, // Retry for up to 24 Hours (specified in minutes)
});

// Register a route for API requests that will use background sync when offline
registerRoute(
  /\/api\/sync/,
  new NetworkFirst({
    cacheName: 'api-requests',
    plugins: [offlineOperationsSyncPlugin],
    networkTimeoutSeconds: 10,
  }),
  'POST'
);

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Any other custom service worker logic can go here.
self.addEventListener('install', () => {
  console.log('Service worker installed');
});

self.addEventListener('activate', () => {
  console.log('Service worker activated');
});

// Claim clients so that the very first page load is controlled by the service worker
clientsClaim();

// Listen for push notifications
self.addEventListener('push', event => {
  const data = event.data?.json() ?? {};
  const title = data.title || 'd.o.it.brainstorming';
  const options = {
    body: data.body || 'New notification from d.o.it.brainstorming',
    icon: '/pwa-192x192.png',
    badge: '/pwa-64x64.png',
    data: data.data || {},
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  event.notification.close();

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      const hadWindowToFocus = clientList.some(client => {
        return client.url.includes(self.location.origin) && 'focus' in client
          ? (client.focus(), true)
          : false;
      });

      // If no window is already open, open a new one
      if (!hadWindowToFocus) {
        const urlToOpen = event.notification.data?.url || '/';
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
