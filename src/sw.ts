// Service Worker with Workbox
import { BackgroundSyncPlugin } from 'workbox-background-sync'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { clientsClaim, setCacheNameDetails } from 'workbox-core'
import { ExpirationPlugin } from 'workbox-expiration'
import { precacheAndRoute, createHandlerBoundToURL, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies'

declare const self: ServiceWorkerGlobalScope

// Cache version - increment this when making significant changes
const CACHE_VERSION = '1.1'

// Configure cache names with versioning
setCacheNameDetails({
	prefix: 'doit-brainstorming',
	suffix: CACHE_VERSION,
	precache: 'precache',
	runtime: 'runtime',
})

// Clean up outdated caches
cleanupOutdatedCaches()

// Use with precache injection
const manifestEntries: Array<string | { url: string; revision: string | null }> = self.__WB_MANIFEST

/**
 * Validate a URL for security
 * @param url URL to validate
 * @param requireSameOrigin Whether to require the URL to be from the same origin
 * @returns True if URL is valid and safe, false otherwise
 */
const isValidAndSafeUrl = (url: string, requireSameOrigin = false): boolean => {
	try {
		// For relative URLs that start with /, consider them valid
		if (url.startsWith('/') && !url.startsWith('//')) {
			return true
		}

		const parsedUrl = new URL(url)
		const selfOrigin = self.location.origin

		// Check if same origin is required
		if (requireSameOrigin && parsedUrl.origin !== selfOrigin) {
			console.warn(`URL ${url} is not from the same origin as ${selfOrigin}`)
			return false
		}

		// Only allow http: and https: protocols
		if (parsedUrl.protocol !== 'http:' && parsedUrl.protocol !== 'https:') {
			console.warn(`URL ${url} uses disallowed protocol: ${parsedUrl.protocol}`)
			return false
		}

		// Check for suspicious patterns
		const suspiciousPatterns = [
			/\.\./, // Directory traversal
			/^data:/i, // Data URLs
			/^javascript:/i, // JavaScript URLs
			/^vbscript:/i, // VBScript URLs
			/^file:/i, // File URLs
			/^blob:/i, // Blob URLs
			/^ftp:/i, // FTP URLs
		]

		for (const pattern of suspiciousPatterns) {
			if (pattern.test(url)) {
				console.warn(`URL ${url} contains suspicious pattern: ${pattern}`)
				return false
			}
		}

		// Check for username/password in URL (potential security issue)
		if (parsedUrl.username || parsedUrl.password) {
			console.warn(`URL ${url} contains credentials which is a security risk`)
			return false
		}

		return true
	} catch (error) {
		console.error(`Error validating URL ${url}:`, error)
		return false
	}
}

// Make sure index.html is in the precache manifest
const indexUrl = 'index.html'
const hasIndexHtml = manifestEntries.some((entry) => {
	return typeof entry === 'string' ? entry === indexUrl : entry.url === indexUrl
})

if (!hasIndexHtml) {
	manifestEntries.push({
		url: indexUrl,
		revision: new Date().toISOString(),
	})
}

precacheAndRoute(manifestEntries)

// Set up App Shell-style routing
const fileExtensionRegexp = new RegExp('/[^/?]+\\.[^/]+$')
registerRoute(
	// Return false to exempt requests from being fulfilled by index.html.
	({ request, url }: { request: Request; url: URL }) => {
		// If this is an API request, don't use the App Shell
		if (url.pathname.startsWith('/api/')) {
			return false
		}

		// If this is a resource that should be handled by workbox caching strategies, skip the App Shell
		if (request.mode !== 'navigate') {
			return false
		}

		// If this looks like a URL for a resource, because it contains a file extension, skip the App Shell
		if (url.pathname.match(fileExtensionRegexp)) {
			return false
		}

		return true
	},
	createHandlerBoundToURL('index.html'),
)

// Cache the Google Fonts stylesheets with a stale-while-revalidate strategy.
registerRoute(
	/^https:\/\/fonts\.googleapis\.com/,
	new StaleWhileRevalidate({
		cacheName: 'google-fonts-stylesheets',
	}),
)

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
	}),
)

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
		)
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
	}),
)

// API requests with network-first strategy and background sync for offline
const apiSyncPlugin = new BackgroundSyncPlugin('api-queue', {
	maxRetentionTime: 24 * 60, // Retry for up to 24 hours (specified in minutes)
	onSync: async ({ queue }) => {
		try {
			// Process all the queued requests
			await queue.replayRequests()

			// If we've successfully replayed all requests, notify the user
			self.registration.showNotification('Sync Complete', {
				body: 'Your offline changes have been successfully synchronized.',
				icon: '/pwa-192x192.png',
				badge: '/pwa-64x64.png',
				data: { url: '/' },
				tag: 'sync-success',
			})
		} catch (error) {
			console.error('Background sync failed:', error)

			// Show notification about the failure
			self.registration.showNotification('Sync Failed', {
				body: 'Some of your offline changes could not be synchronized. The app will try again later.',
				icon: '/pwa-192x192.png',
				badge: '/pwa-64x64.png',
				data: { url: '/' },
				tag: 'sync-error',
				requireInteraction: true,
			})

			// Re-throw the error to let workbox know the sync failed
			throw error
		}
	},
})

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
	}),
)

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
	}),
)

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
	}),
)

// Cache CSS and JavaScript Files
registerRoute(
	/\.(?:js|css)$/,
	new StaleWhileRevalidate({
		cacheName: 'static-resources',
	}),
)

// Background sync for offline operations
const offlineOperationsSyncPlugin = new BackgroundSyncPlugin('offline-operations-queue', {
	maxRetentionTime: 24 * 60, // Retry for up to 24 Hours (specified in minutes)
	// Implement exponential backoff for retries
	maxRetries: 5,
	onSync: async ({ queue }) => {
		let failedItems = 0
		let successItems = 0

		try {
			// Process all the queued requests with custom replay
			await queue.replayRequests(async (entry) => {
				try {
					// Try to replay the request
					await fetch(entry.request.clone())
					successItems++
					return true // Request succeeded
				} catch (error) {
					failedItems++
					console.error(`Failed to replay queued request:`, error)

					// Check if we should stop retrying based on the error
					if (error.name === 'TypeError' || error.name === 'NetworkError') {
						// Network errors should be retried
						return false // Keep in the queue
					}

					if (error.name === 'AbortError') {
						// Request was aborted, might be a timeout
						return false // Keep in the queue
					}

					// For other errors (like 4xx responses), we might want to remove from queue
					if (error.response && error.response.status >= 400 && error.response.status < 500) {
						console.warn(`Removing failed request with status ${error.response.status} from queue`)
						return true // Remove from queue
					}

					return false // Keep in the queue for other errors
				}
			})

			// Show notification about the sync results
			if (successItems > 0) {
				self.registration.showNotification('Sync Complete', {
					body: `${successItems} item${successItems !== 1 ? 's' : ''} synchronized successfully${failedItems > 0 ? `, ${failedItems} failed` : ''}.`,
					icon: '/pwa-192x192.png',
					badge: '/pwa-64x64.png',
					data: { url: '/' },
					tag: 'sync-result',
				})
			} else if (failedItems > 0) {
				throw new Error(`All ${failedItems} sync operations failed`)
			}
		} catch (error) {
			console.error('Background sync failed:', error)

			// Show notification about the failure
			self.registration.showNotification('Sync Issues', {
				body: `Some of your changes couldn't be synchronized (${failedItems} failed). The app will retry later.`,
				icon: '/pwa-192x192.png',
				badge: '/pwa-64x64.png',
				data: { url: '/' },
				tag: 'sync-error',
				requireInteraction: true,
			})

			// Re-throw the error to let workbox know the sync failed
			throw error
		}
	},
})

// Register a route for API requests that will use background sync when offline
registerRoute(
	/\/api\/sync/,
	new NetworkFirst({
		cacheName: 'api-requests',
		plugins: [offlineOperationsSyncPlugin],
		networkTimeoutSeconds: 10,
	}),
	'POST',
)

// This allows the web app to trigger skipWaiting via
// registration.waiting.postMessage({type: 'SKIP_WAITING'})
self.addEventListener('message', (event) => {
	if (event.data && event.data.type === 'SKIP_WAITING') {
		self.skipWaiting()
	}
})

// Any other custom service worker logic can go here.
self.addEventListener('install', (event) => {
	console.log('Service worker installed')

	// Ensure offline.html is cached during installation
	event.waitUntil(
		caches.open('offline-fallbacks').then((cache) => {
			return cache.addAll(['/offline.html', '/pwa-192x192.png', '/pwa-64x64.png'])
		}),
	)
})

self.addEventListener('activate', (event) => {
	console.log('Service worker activated')

	// Clean up old caches that aren't in our current cache list
	event.waitUntil(
		caches.keys().then((cacheNames) => {
			const currentCacheNames = [
				'offline-fallbacks',
				'google-fonts-stylesheets',
				'google-fonts-webfonts',
				'static-assets',
				'api-responses',
				'documents',
				'images',
				'static-resources',
				'api-requests',
				`doit-brainstorming-precache-${CACHE_VERSION}`,
				`doit-brainstorming-runtime-${CACHE_VERSION}`,
			]

			return Promise.all(
				cacheNames.map((cacheName) => {
					if (!currentCacheNames.includes(cacheName)) {
						console.log('Deleting outdated cache:', cacheName)
						return caches.delete(cacheName)
					}
					return Promise.resolve()
				}),
			)
		}),
	)
})

// Claim clients so that the very first page load is controlled by the service worker
clientsClaim()

// Listen for push notifications
self.addEventListener('push', (event) => {
	try {
		const data = event.data?.json() ?? {}
		const title = data.title || 'd.o.it.brainstorming'
		const options = {
			body: data.body || 'New notification from d.o.it.brainstorming',
			icon: '/pwa-192x192.png',
			badge: '/pwa-64x64.png',
			data: data.data || {},
		}

		// Validate data for security
		if (data.data?.url && !isValidAndSafeUrl(data.data.url)) {
			console.error('Invalid or unsafe URL in push notification:', data.data.url)
			// Remove the unsafe URL
			options.data = { ...data.data }
			delete options.data.url
		}

		event.waitUntil(self.registration.showNotification(title, options))
	} catch (_) {
		console.error('Error processing push notification')
		// Show a generic notification instead
		event.waitUntil(
			self.registration.showNotification('New Notification', {
				body: 'You have a new notification',
				icon: '/pwa-192x192.png',
				badge: '/pwa-64x64.png',
			}),
		)
	}
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
	event.notification.close()

	// This looks to see if the current is already open and focuses if it is
	event.waitUntil(
		self.clients
			.matchAll({ type: 'window', includeUncontrolled: true })
			.then((clientList) => {
				const hadWindowToFocus = clientList.some((client) => {
					return client.url.includes(self.location.origin) && 'focus' in client
						? (client.focus(), true)
						: false
				})

				// If no window is already open, open a new one
				if (!hadWindowToFocus) {
					// Get URL from notification data
					const urlToOpen = event.notification.data?.url || '/'

					// Validate URL before opening - for notifications, we require same-origin URLs
					// for security (prevent phishing)
					if (!isValidAndSafeUrl(urlToOpen, true)) {
						console.error('Invalid or unsafe URL in notification click:', urlToOpen)
						// Log this security issue
						console.warn('Security warning: Attempted to open potentially unsafe URL from notification')
						// Redirect to home page instead
						return self.clients.openWindow('/')
					}

					return self.clients.openWindow(urlToOpen)
				}
				return Promise.resolve()
			})
			.catch((_) => {
				console.error('Error handling notification click')
				return self.clients.openWindow('/')
			}),
	)
})

// Handle fetch errors with improved offline fallback
self.addEventListener('fetch', (event) => {
	// Let Workbox handle most fetches, but add some error handling
	if (event.request.mode === 'navigate') {
		event.respondWith(
			fetch(event.request).catch((error) => {
				console.warn('Navigation fetch failed:', error)

				// If offline and navigating, serve the offline fallback
				return caches
					.match('offline.html')
					.then((response) => {
						if (response) {
							return response
						}

						// If offline.html is not in cache, create a basic offline response
						console.warn('Offline fallback page not found in cache, generating basic response')
						return new Response(
							`<!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>You are offline</title>
                  <style>
                    body { font-family: sans-serif; text-align: center; padding: 20px; }
                    h1 { color: #d32f2f; }
                    .container { max-width: 600px; margin: 0 auto; }
                    .retry-btn { background: #2196f3; color: white; border: none; padding: 10px 20px;
                                 border-radius: 4px; cursor: pointer; font-size: 16px; }
                  </style>
                </head>
                <body>
                  <div class="container">
                    <h1>You are offline</h1>
                    <p>The app cannot connect to the internet. Please check your connection and try again.</p>
                    <button class="retry-btn" onclick="window.location.reload()">Retry</button>
                  </div>
                </body>
                </html>`,
							{
								headers: { 'Content-Type': 'text/html' },
							},
						)
					})
					.catch((cacheError) => {
						console.error('Error serving offline fallback:', cacheError)
						return new Response(
							'<html><body><h1>Offline</h1><p>Unable to load page. Please check your connection.</p></body></html>',
							{ headers: { 'Content-Type': 'text/html' } },
						)
					})
			}),
		)
	}

	// For API requests that fail, return a JSON error response with more details
	if (event.request.url.includes('/api/')) {
		event.respondWith(
			fetch(event.request).catch((error) => {
				console.warn(`API request failed for ${event.request.url}:`, error)

				// Check if this is a POST/PUT request that should be queued
				const shouldQueue = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(event.request.method)

				return new Response(
					JSON.stringify({
						error: true,
						message: shouldQueue
							? 'You are offline. This request will be retried when you are back online.'
							: 'You are offline. Please try again when you have an internet connection.',
						offlineQueued: shouldQueue,
						timestamp: new Date().toISOString(),
						path: new URL(event.request.url).pathname,
					}),
					{
						status: 503, // Service Unavailable
						headers: {
							'Content-Type': 'application/json',
							'Cache-Control': 'no-store',
						},
					},
				)
			}),
		)
	}
})
