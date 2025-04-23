/**
 * Network status interface with detailed connection information
 */
export interface NetworkStatus {
	online: boolean
	type: string // wifi, cellular, etc.
	effectiveType: string // slow-2g, 2g, 3g, 4g
	downlink?: number // Mbps
	rtt?: number // Round trip time in ms
	saveData?: boolean // Whether the user has requested reduced data usage
	signalStrength?: number // 0-4 signal strength indicator
	lastChecked: number // Timestamp of last check
	isReliable: boolean // Whether the connection is reliable
	isMetered?: boolean // Whether the connection is metered (limited data)
}

/**
 * Service for managing offline status and synchronization
 */
export class OfflineService {
	private static instance: OfflineService
	private isOnline: boolean = navigator.onLine
	private listeners: Array<(online: boolean) => void> = []
	private syncQueue: Array<() => Promise<void>> = []
	private syncInProgress: boolean = false
	private maxRetries: number = 5
	private syncInterval: number = 60000 // 1 minute
	private syncIntervalId: number | null = null
	private offlineModeEnabled: boolean = true
	private offlineFirstEnabled: boolean = true
	private networkStatusListeners: Array<(status: NetworkStatus) => void> = []
	private activeNetworkChecks: boolean = false
	private networkCheckInterval: number = 30000 // 30 seconds
	private networkCheckIntervalId: number | null = null
	private heartbeatEndpoint: string = '/api/heartbeat'
	private currentNetworkStatus: NetworkStatus = {
		online: navigator.onLine,
		type: 'unknown',
		effectiveType: 'unknown',
		downlink: undefined,
		rtt: undefined,
		saveData: undefined,
		signalStrength: undefined,
		lastChecked: Date.now(),
		isReliable: true,
		isMetered: false,
	}

	/**
	 * Notify all listeners about the current online status
	 */
	private notifyListeners(): void {
		this.listeners.forEach((listener) => {
			try {
				listener(this.isOnline)
			} catch (error) {
				console.error('Error in offline status listener:', error)
			}
		})
	}

	private constructor() {
		// Initialize online/offline event listeners
		window.addEventListener('online', this.handleOnlineStatusChange.bind(this))
		window.addEventListener('offline', this.handleOnlineStatusChange.bind(this))

		// Monitor network quality if available
		this.initNetworkQualityMonitoring()

		// Start active network checks
		this.startActiveNetworkChecks()

		// Initialize from stored settings
		this.loadSettings()
	}

	/**
	 * Load settings from localStorage
	 */
	private loadSettings(): void {
		try {
			const settings = localStorage.getItem('offlineServiceSettings')
			if (settings) {
				const parsed = JSON.parse(settings)
				this.offlineModeEnabled = parsed.offlineModeEnabled ?? true
				this.offlineFirstEnabled = parsed.offlineFirstEnabled ?? true
				this.activeNetworkChecks = parsed.activeNetworkChecks ?? false
				this.syncInterval = parsed.syncInterval ?? 60000
				this.networkCheckInterval = parsed.networkCheckInterval ?? 30000
			}
		} catch (error) {
			console.error('Failed to load offline service settings:', error)
		}
	}

	/**
	 * Save settings to localStorage
	 */
	private saveSettings(): void {
		try {
			const settings = {
				offlineModeEnabled: this.offlineModeEnabled,
				offlineFirstEnabled: this.offlineFirstEnabled,
				activeNetworkChecks: this.activeNetworkChecks,
				syncInterval: this.syncInterval,
				networkCheckInterval: this.networkCheckInterval,
			}
			localStorage.setItem('offlineServiceSettings', JSON.stringify(settings))
		} catch (error) {
			console.error('Failed to save offline service settings:', error)
		}
	}

	/**
	 * Start active network checks to detect actual connectivity
	 * beyond just the browser's online/offline events
	 */
	private startActiveNetworkChecks(): void {
		if (this.networkCheckIntervalId !== null) {
			return // Already running
		}

		// Do an immediate check
		void this.checkActualConnectivity()

		// Set up interval for regular checks
		this.networkCheckIntervalId = window.setInterval(() => {
			void this.checkActualConnectivity()
		}, this.networkCheckInterval)
	}

	/**
	 * Stop active network checks
	 */
	private stopActiveNetworkChecks(): void {
		if (this.networkCheckIntervalId !== null) {
			window.clearInterval(this.networkCheckIntervalId)
			this.networkCheckIntervalId = null
		}
	}

	/**
	 * Check actual connectivity by making a lightweight request
	 */
	private async checkActualConnectivity(): Promise<boolean> {
		// Update the last checked timestamp
		this.currentNetworkStatus.lastChecked = Date.now()

		// If the browser reports offline, don't bother checking
		if (!navigator.onLine) {
			this.updateNetworkStatus({
				...this.currentNetworkStatus,
				online: false,
				isReliable: false,
			})
			return false
		}

		try {
			// Add a cache-busting parameter
			const url = `${this.heartbeatEndpoint}?_=${Date.now()}`

			// Use a timeout to detect slow connections
			const controller = new AbortController()
			const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

			const response = await fetch(url, {
				method: 'HEAD',
				cache: 'no-store',
				signal: controller.signal,
			})

			clearTimeout(timeoutId)

			const isOnline = response.ok

			// Update network status
			this.updateNetworkStatus({
				...this.currentNetworkStatus,
				online: isOnline,
				isReliable: isOnline,
			})

			// If we're now online and we weren't before, trigger sync
			if (isOnline && !this.isOnline) {
				this.isOnline = true
				this.notifyListeners()
				void this.processSyncQueue()
			} else if (!isOnline && this.isOnline) {
				// If we're now offline and we weren't before, update status
				this.isOnline = false
				this.notifyListeners()
			}

			return isOnline
		} catch {
			// If the request was aborted due to timeout, mark as unreliable
			// Check if it's a timeout error
			// const isTimeout = error instanceof DOMException && error.name === 'AbortError';

			this.updateNetworkStatus({
				...this.currentNetworkStatus,
				online: false,
				isReliable: false,
			})

			// If we were previously online, notify listeners we're offline
			if (this.isOnline) {
				this.isOnline = false
				this.notifyListeners()
			}

			return false
		}
	}

	public static getInstance(): OfflineService {
		if (OfflineService.instance === undefined || OfflineService.instance === null) {
			OfflineService.instance = new OfflineService()
		}
		return OfflineService.instance
	}

	/**
	 * Get current online status
	 * @returns True if online, false if offline
	 */
	public getOnlineStatus(): boolean {
		return this.isOnline
	}

	/**
	 * Get current network status
	 * @returns NetworkStatus object
	 */
	public getNetworkStatus(): NetworkStatus {
		return { ...this.currentNetworkStatus }
	}

	/**
	 * Check network status manually
	 * This is useful for UI components that want to refresh the status
	 * @returns Promise that resolves with the online status
	 */
	public async checkNetworkStatus(): Promise<boolean> {
		return this.checkActualConnectivity()
	}

	/**
	 * Add a listener for online status changes
	 * @param listener Function to call when online status changes
	 * @returns Function to remove the listener
	 */
	public addOnlineStatusListener(listener: (online: boolean) => void): () => void {
		this.listeners.push(listener)
		// Immediately call with current status
		listener(this.isOnline)

		// Return function to remove listener
		return () => {
			this.listeners = this.listeners.filter((l) => l !== listener)
		}
	}

	/**
	 * Add an operation to the sync queue
	 * @param operation Function to execute when online
	 */
	public addToSyncQueue(operation: () => Promise<void>): void {
		this.syncQueue.push(operation)

		// If we're online, try to sync immediately
		if (this.isOnline && !this.syncInProgress) {
			void this.processSyncQueue()
		}
	}

	/**
	 * Start automatic synchronization
	 */
	public startAutoSync(): void {
		if (this.syncIntervalId !== null) {
			return // Already started
		}

		this.syncIntervalId = window.setInterval(() => {
			if (this.isOnline && !this.syncInProgress) {
				void this.processSyncQueue()
			}
		}, this.syncInterval)
	}

	/**
	 * Stop automatic synchronization
	 */
	public stopAutoSync(): void {
		if (this.syncIntervalId !== null) {
			window.clearInterval(this.syncIntervalId)
			this.syncIntervalId = null
		}
	}

	/**
	 * Configure the sync service
	 * @param config Configuration options
	 */
	public configure(config: {
		syncInterval?: number
		maxRetries?: number
		autoSync?: boolean
		offlineModeEnabled?: boolean
		offlineFirstEnabled?: boolean
	}): void {
		if (config.syncInterval !== undefined) {
			this.syncInterval = config.syncInterval

			// Restart auto-sync if it was running
			if (this.syncIntervalId !== null) {
				this.stopAutoSync()
				this.startAutoSync()
			}
		}

		if (config.maxRetries !== undefined) {
			this.maxRetries = config.maxRetries
		}

		if (config.autoSync !== undefined) {
			if (config.autoSync) {
				this.startAutoSync()
			} else {
				this.stopAutoSync()
			}
		}

		if (config.offlineModeEnabled !== undefined) {
			this.offlineModeEnabled = config.offlineModeEnabled
		}

		if (config.offlineFirstEnabled !== undefined) {
			this.offlineFirstEnabled = config.offlineFirstEnabled
		}
	}

	/**
	 * Get the number of pending operations in the sync queue
	 * @returns Number of pending operations
	 */
	public getPendingOperationsCount(): number {
		return this.syncQueue.length
	}

	/**
	 * Process the sync queue
	 * @returns Promise that resolves when all operations are processed
	 */
	public async processSyncQueue(): Promise<void> {
		if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
			return
		}

		this.syncInProgress = true

		try {
			// Process each operation in the queue
			const operations = [...this.syncQueue]
			this.syncQueue = []

			for (const operation of operations) {
				try {
					await this.executeWithRetry(operation)
				} catch (error) {
					console.error('Failed to process sync operation after retries:', error)
					// Put the failed operation back in the queue
					this.syncQueue.push(operation)
				}
			}
		} finally {
			this.syncInProgress = false

			// If there are still operations in the queue, try again later
			if (this.syncQueue.length > 0 && this.isOnline) {
				setTimeout(() => {
					void this.processSyncQueue()
				}, 5000)
			}
		}
	}

	/**
	 * Execute an operation with retry logic
	 * @param operation Function to execute
	 * @returns Promise that resolves when the operation succeeds
	 */
	private async executeWithRetry(operation: () => Promise<void>): Promise<void> {
		let retries = 0

		while (retries < this.maxRetries) {
			try {
				await operation()
				return // Success
			} catch (error) {
				retries++

				if (retries >= this.maxRetries) {
					throw error // Max retries reached
				}

				// Exponential backoff
				const delay = Math.pow(2, retries) * 1000
				await new Promise((resolve) => setTimeout(resolve, delay))
			}
		}
	}

	/**
	 * Handle online/offline status changes
	 */
	private handleOnlineStatusChange(): void {
		const newOnlineStatus = navigator.onLine

		if (this.isOnline !== newOnlineStatus) {
			this.isOnline = newOnlineStatus
			this.updateNetworkStatus({ online: newOnlineStatus })

			// Notify listeners
			this.listeners.forEach((listener) => {
				try {
					listener(this.isOnline)
				} catch (error) {
					console.error('Error in online status listener:', error)
				}
			})

			// If we're back online, process the sync queue
			if (this.isOnline) {
				void this.processSyncQueue()
			}
		}
	}

	/**
	 * Initialize network quality monitoring
	 */
	private initNetworkQualityMonitoring(): void {
		// Check if the Network Information API is available
		if ('connection' in navigator) {
			// Define NetworkInformation interface
			interface NetworkInformation {
				type: string
				effectiveType: string
				downlink: number
				rtt: number
				saveData: boolean
				addEventListener: (type: string, listener: EventListener) => void
				removeEventListener: (type: string, listener: EventListener) => void
			}

			const connection = (navigator as { connection: NetworkInformation }).connection

			// Update initial network status with all available properties
			this.updateNetworkStatus({
				type: connection.type,
				effectiveType: connection.effectiveType,
				downlink: connection.downlink,
				rtt: connection.rtt,
				saveData: connection.saveData,
			})

			// Listen for changes
			connection.addEventListener('change', () => {
				this.updateNetworkStatus({
					type: connection.type,
					effectiveType: connection.effectiveType,
					downlink: connection.downlink,
					rtt: connection.rtt,
					saveData: connection.saveData,
				})

				// Log network status change
				console.log('Network status changed:', this.currentNetworkStatus)
			})
		}
	}

	/**
	 * Update network status and notify listeners
	 */
	private updateNetworkStatus(partialStatus: Partial<NetworkStatus>): void {
		// Always update the lastChecked timestamp
		const now = Date.now()

		this.currentNetworkStatus = {
			...this.currentNetworkStatus,
			...partialStatus,
			lastChecked: partialStatus.lastChecked || now,
		}

		// Calculate signal strength based on effectiveType and downlink
		this.currentNetworkStatus.signalStrength = this.calculateSignalStrength(
			this.currentNetworkStatus.effectiveType,
			this.currentNetworkStatus.downlink,
		)

		// Determine if the connection is metered
		if ('connection' in navigator) {
			const connection = (navigator as { connection?: { saveData?: boolean } }).connection
			if (connection !== undefined && connection !== null && typeof connection.saveData === 'boolean') {
				this.currentNetworkStatus.isMetered = connection.saveData
			}
		}

		// Determine reliability based on connection type and speed
		if (partialStatus.isReliable === undefined) {
			// If reliability wasn't explicitly set, calculate it
			if (
				this.currentNetworkStatus.effectiveType === 'slow-2g' ||
				this.currentNetworkStatus.effectiveType === '2g'
			) {
				this.currentNetworkStatus.isReliable = false
			} else if (
				typeof this.currentNetworkStatus.downlink === 'number' &&
				this.currentNetworkStatus.downlink < 0.5
			) {
				// Less than 0.5 Mbps is considered unreliable
				this.currentNetworkStatus.isReliable = false
			} else if (typeof this.currentNetworkStatus.rtt === 'number' && this.currentNetworkStatus.rtt > 1000) {
				// RTT > 1000ms is considered unreliable
				this.currentNetworkStatus.isReliable = false
			}
		}

		// Notify network status listeners
		this.networkStatusListeners.forEach((listener) => {
			try {
				listener(this.currentNetworkStatus)
			} catch (error) {
				console.error('Error in network status listener:', error)
			}
		})

		// Dispatch a custom event for components that aren't directly connected
		if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
			const event = new CustomEvent('network-status-change', {
				detail: { status: this.currentNetworkStatus },
			})
			window.dispatchEvent(event)
		}
	}

	/**
	 * Calculate signal strength indicator (0-4) based on connection quality
	 */
	private calculateSignalStrength(effectiveType: string, downlink?: number): number {
		// If no data available, return undefined
		if (effectiveType === 'unknown' && typeof downlink !== 'number') return 0

		// Base signal strength on effective connection type
		switch (effectiveType) {
		case 'slow-2g':
			return 1
		case '2g':
			return 2
		case '3g':
			return 3
		case '4g':
			return 4
		default:
			// Fallback to downlink-based calculation if available
			if (typeof downlink === 'number') {
				if (downlink < 0.5) return 1 // Very slow
				if (downlink < 1) return 2 // Slow
				if (downlink < 5) return 3 // Medium
				return 4 // Fast
			}
			return 0 // Unknown
		}
	}

	// getNetworkStatus method is defined above

	/**
	 * Add a listener for network status changes
	 * @param listener Function to call when network status changes
	 * @returns Function to remove the listener
	 */
	public addNetworkStatusListener(listener: (status: NetworkStatus) => void): () => void {
		this.networkStatusListeners.push(listener)
		// Immediately call with current status
		listener(this.currentNetworkStatus)

		// Return function to remove listener
		return () => {
			this.networkStatusListeners = this.networkStatusListeners.filter((l) => l !== listener)
		}
	}

	/**
	 * Check if offline mode is enabled
	 */
	public isOfflineModeEnabled(): boolean {
		return this.offlineModeEnabled
	}

	/**
	 * Check if offline-first approach is enabled
	 */
	public isOfflineFirstEnabled(): boolean {
		return this.offlineFirstEnabled
	}
}

// Export singleton instance
const offlineService = OfflineService.getInstance()
export default offlineService
