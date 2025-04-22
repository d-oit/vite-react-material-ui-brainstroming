/// <reference lib="webworker" />
declare let self: ServiceWorkerGlobalScope

declare module 'workbox-core' {
	export const clientsClaim: () => void
	export const setCacheNameDetails: (options: { prefix: string }) => void
}

declare module 'workbox-precaching' {
	export function precacheAndRoute(entries: Array<string | PrecacheEntry>): void
	export function cleanupOutdatedCaches(): void

	interface PrecacheEntry {
		url: string
		revision?: string | null
	}
}

declare module 'workbox-routing' {
	export function registerRoute(
		capture: ((options: { url: URL }) => boolean) | RegExp | string,
		handler: RouteHandler,
		method?: string,
	): void
}

declare module 'workbox-strategies' {
	export class NetworkFirst implements Strategy {
		constructor(options?: NetworkFirstOptions)
		handle(options: HandleOptions): Promise<Response>
	}

	export class CacheFirst implements Strategy {
		constructor(options?: CacheFirstOptions)
		handle(options: HandleOptions): Promise<Response>
	}

	interface Strategy {
		handle(options: HandleOptions): Promise<Response>
	}

	interface HandleOptions {
		request: Request
		event: FetchEvent
	}

	interface NetworkFirstOptions {
		cacheName?: string
		plugins?: WorkboxPlugin[]
		networkTimeoutSeconds?: number
	}

	interface CacheFirstOptions {
		cacheName?: string
		plugins?: WorkboxPlugin[]
	}
}

declare module 'workbox-expiration' {
	export class ExpirationPlugin implements WorkboxPlugin {
		constructor(config: { maxEntries?: number; maxAgeSeconds?: number; purgeOnQuotaError?: boolean })
	}
}

declare module 'workbox-background-sync' {
	export class BackgroundSyncPlugin implements WorkboxPlugin {
		constructor(config: { maxRetentionTime?: number; queueName: string })
	}

	export class Queue {
		constructor(name: string, options?: QueueOptions)
		pushRequest(entry: { request: Request }): Promise<void>
	}

	interface QueueOptions {
		maxRetentionTime?: number
		onSync?: (queue: Queue) => Promise<void>
	}
}

declare module 'workbox-cacheable-response' {
	export class CacheableResponsePlugin implements WorkboxPlugin {
		constructor(config: { statuses: number[]; headers?: { [key: string]: string } })
	}
}

interface WorkboxPlugin {
	cacheWillUpdate?: (options: {
		request: Request
		response: Response
		event?: ExtendableEvent
	}) => Promise<Response | null>

	cacheDidUpdate?: (options: {
		cacheName: string
		request: Request
		oldResponse?: Response
		newResponse: Response
		event?: ExtendableEvent
	}) => void

	fetchDidFail?: (options: { error: Error; request: Request; event?: ExtendableEvent }) => void
}
