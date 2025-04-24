/// <reference types="vite/client" />

declare module 'virtual:pwa-register' {
	export interface RegisterSWOptions {
		immediate?: boolean
		onNeedRefresh?: (updateFn: () => Promise<void>) => void
		onOfflineReady?: () => void
		onRegistered?: (registration: ServiceWorkerRegistration) => void
		onRegisterError?: (error: Error) => void
	}

	export function registerSW(
		options?: RegisterSWOptions
	): (reloadPage?: boolean) => Promise<void>
}

declare module 'workbox-window' {
	export class Workbox {
		constructor(scriptURL: string, options?: { scope?: string })
		register(): Promise<ServiceWorkerRegistration>
		addEventListener(event: string, callback: () => void): void
		messageSkipWaiting(): void
		active: ServiceWorker | null
	}
}

declare module 'workbox-precaching' {
	export interface PrecacheEntry {
		url: string
		revision?: string | null
	}

	export function precacheAndRoute(entries: Array<string | PrecacheEntry>): void
	export function cleanupOutdatedCaches(): void
	export function createHandlerBoundToURL(
		url: string
	): (options: { request: Request }) => Response
}

declare module 'workbox-routing' {
	export interface RouteHandlerCallbackOptions {
		url: URL
		request: Request
		event?: ExtendableEvent
	}

	export type RouteHandler = (options: RouteHandlerCallbackOptions) => Promise<Response>

	export class NavigationRoute {
		constructor(handler: RouteHandler, options?: { allowlist?: RegExp[]; denylist?: RegExp[] })
	}

	export function registerRoute(
		capture: ((options: { url: URL }) => boolean) | RegExp | string,
		handler: RouteHandler,
		method?: string,
	): void
}

declare module 'workbox-strategies' {
	export interface WorkboxPlugin {
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

		cacheKeyWillBeUsed?: (
			options: { request: Request; mode: string }
		) => Promise<Request | string>

		cachedResponseWillBeUsed?: (options: {
			cacheName: string
			request: Request
			matchOptions?: CacheQueryOptions
			cachedResponse?: Response
			event?: ExtendableEvent
		}) => Promise<Response | null>

		requestWillFetch?: (options: { request: Request }) => Promise<Request>

		fetchDidFail?: (
			options: { error: Error; request: Request; event?: ExtendableEvent }
		) => void
	}

	export interface StrategyOptions {
		cacheName?: string
		plugins?: WorkboxPlugin[]
		fetchOptions?: RequestInit
		matchOptions?: CacheQueryOptions
	}

	export interface Strategy {
		handle(options: { request: Request; event?: ExtendableEvent }): Promise<Response>
	}

	export class NetworkFirst implements Strategy {
		constructor(options?: StrategyOptions & { networkTimeoutSeconds?: number })
		handle(options: { request: Request; event?: ExtendableEvent }): Promise<Response>
	}

	export class CacheFirst implements Strategy {
		constructor(options?: StrategyOptions)
		handle(options: { request: Request; event?: ExtendableEvent }): Promise<Response>
	}

	export class StaleWhileRevalidate implements Strategy {
		constructor(options?: StrategyOptions)
		handle(options: { request: Request; event?: ExtendableEvent }): Promise<Response>
	}
}
