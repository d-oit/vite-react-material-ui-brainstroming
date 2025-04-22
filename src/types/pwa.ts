// Service Worker Types
export type ServiceWorkerState = 'installing' | 'installed' | 'activating' | 'activated' | 'redundant'

export interface ServiceWorkerUpdate {
	type: 'pending' | 'available' | 'activated'
	registration: ServiceWorkerRegistration
}

export interface WorkboxWindow {
	messageSkipWaiting(): void
	register(): void
}

// Registration Options
export interface RegisterSWOptions {
	immediate?: boolean
	onNeedRefresh?: (updateFn: () => Promise<void>) => void
	onOfflineReady?: () => void
	onRegistered?: (registration: ServiceWorkerRegistration) => void
	onRegisterError?: (error: Error) => void
}

// Cache Strategy Types
export interface CacheStrategy {
	cacheName: string
	networkTimeoutSeconds?: number
	plugins?: Array<{
		cacheWillUpdate?: (options: { request: Request; response: Response; event?: Event }) => Promise<Response | null>
		cacheDidUpdate?: (options: {
			cacheName: string
			request: Request
			oldResponse?: Response
			newResponse: Response
			event?: Event
		}) => void
	}>
}

// PWA Configuration Types
export interface PWAConfig {
	registerType: 'autoUpdate' | 'prompt'
	workbox: {
		navigateFallback: string
		globPatterns: string[]
		cleanupOutdatedCaches: boolean
		clientsClaim: boolean
	}
	includeAssets: string[]
	manifest: {
		name: string
		short_name: string
		theme_color: string
		icons: Array<{
			src: string
			sizes: string
			type: string
			purpose?: string
		}>
		display: 'standalone' | 'fullscreen' | 'minimal-ui' | 'browser'
		orientation?: 'portrait' | 'landscape'
		start_url: string
		background_color: string
		categories: string[]
		description: string
	}
	devOptions: {
		enabled: boolean
		type: 'module' | 'classic'
	}
}
