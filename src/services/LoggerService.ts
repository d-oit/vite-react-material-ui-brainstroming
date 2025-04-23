import type { LogEntry } from './IndexedDBService'
import indexedDBService from './IndexedDBService'
import offlineService from './OfflineService'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical'
export type LogCategory = 'app' | 'network' | 'user' | 'performance' | 'security' | 'api' | 'storage' | 'ui'

export interface StructuredLogContext {
	category?: LogCategory
	component?: string
	userId?: string
	sessionId?: string
	requestId?: string
	[key: string]: unknown
}

/**
 * Service for logging application events and errors
 */
export class LoggerService {
	private static instance: LoggerService
	private isEnabled: boolean = true
	private syncLogsWhenOnline: boolean = true
	private remoteLoggingEndpoint: string | null = null
	private applicationVersion: string
	private maxLogAge: number = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
	private minLogLevel: LogLevel = 'info'
	private sessionId: string
	private defaultContext: Partial<StructuredLogContext> = {}
	private consoleLoggingEnabled: boolean = true

	private pendingLogs: Array<{
		level: LogLevel
		message: string
		context?: Partial<StructuredLogContext>
	}> = []
	private isInitialized = false

	private constructor() {
		// Get application version from environment
		this.applicationVersion = import.meta.env.VITE_PROJECT_VERSION ?? '0.1.0'

		// Generate a session ID
		try {
			// Use crypto.randomUUID() if available
			if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
				this.sessionId = crypto.randomUUID()
			} else {
				// Fallback to a simple random ID generator
				this.sessionId =
					'session-' +
					Math.random().toString(36).substring(2, 15) +
					Math.random().toString(36).substring(2, 15)
			}
		} catch (error) {
			// Fallback if crypto API fails
			console.warn('Failed to generate UUID using crypto API, using fallback')
			this.sessionId = 'session-' + Date.now() + '-' + Math.random().toString(36).substring(2, 15)
		}

		// Set default context
		this.defaultContext = {
			sessionId: this.sessionId,
			appVersion: this.applicationVersion,
		}
	}

	/**
	 * Initialize the logger service
	 * @returns Promise that resolves with true when initialization is complete, false on failure
	 */
	public async initialize(): Promise<boolean> {
		if (this.isInitialized) {
			return true
		}

		try {
			// Set up periodic log cleanup
			this.setupLogCleanup()

			// Set up global error handlers
			this.setupGlobalErrorHandlers()

			this.isInitialized = true

			// Process any pending logs
			while (this.pendingLogs.length > 0) {
				const log = this.pendingLogs.shift()
				if (log) {
					await this.log(log.level, log.message, log.context)
				}
			}

			// Log application start after initialization
			await this.info('Application started', { category: 'app' })

			return true
		} catch (error) {
			console.error('Failed to initialize logger service:', error)
			this.isInitialized = false
			return false
		}
	}

	/**
	 * Set up global error handlers to catch unhandled errors
	 */
	private setupGlobalErrorHandlers(): void {
		if (typeof window !== 'undefined') {
			// Handle unhandled promise rejections
			window.addEventListener('unhandledrejection', (event) => {
				const error = event.reason
				const message = error instanceof Error ? error.message : String(error)
				const stack = error instanceof Error ? error.stack : undefined

				void this.error('Unhandled promise rejection', undefined, {
					category: 'app',
					errorMessage: message,
					errorStack: stack,
					errorType: 'unhandledrejection',
				}).catch(console.error)
			})

			// Handle uncaught errors
			window.addEventListener('error', (event) => {
				// Don't log errors from extensions or third-party scripts
				if (this.isThirdPartyError(event)) {
					return
				}

				void this.error('Uncaught error', event.error, {
					category: 'app',
					errorLocation: {
						filename: event.filename,
						lineno: event.lineno,
						colno: event.colno,
					},
					errorType: 'uncaughterror',
				}).catch(console.error)
			})
		}
	}

	/**
	 * Check if an error is from a third-party script
	 * @param event Error event
	 * @returns True if the error is from a third-party script
	 */
	private isThirdPartyError(event: ErrorEvent): boolean {
		// If there's no filename, we can't determine if it's third-party
		if (!event.filename) {
			return false
		}

		// Check if the error is from our own domain
		try {
			const errorUrl = new URL(event.filename)
			const currentUrl = new URL(window.location.href)

			// If the error is from a different origin, it's third-party
			return errorUrl.origin !== currentUrl.origin
		} catch {
			// If we can't parse the URL, assume it's not third-party
			return false
		}
	}

	public static getInstance(): LoggerService {
		if (LoggerService.instance === undefined || LoggerService.instance === null) {
			LoggerService.instance = new LoggerService()
		}
		return LoggerService.instance
	}

	/**
	 * Configure the logger service
	 * @param config Configuration options
	 */
	public configure(config: {
		enabled?: boolean
		syncLogsWhenOnline?: boolean
		remoteLoggingEndpoint?: string
		maxLogAge?: number
		minLogLevel?: LogLevel
		consoleLoggingEnabled?: boolean
		defaultContext?: Partial<StructuredLogContext>
	}): void {
		if (config.enabled !== undefined) {
			this.isEnabled = config.enabled
		}

		if (config.syncLogsWhenOnline !== undefined) {
			this.syncLogsWhenOnline = config.syncLogsWhenOnline
		}

		if (config.remoteLoggingEndpoint !== undefined) {
			this.remoteLoggingEndpoint = config.remoteLoggingEndpoint
		}

		if (config.maxLogAge !== undefined) {
			this.maxLogAge = config.maxLogAge
			this.setupLogCleanup()
		}

		if (config.minLogLevel !== undefined) {
			this.minLogLevel = config.minLogLevel
		}

		if (config.consoleLoggingEnabled !== undefined) {
			this.consoleLoggingEnabled = config.consoleLoggingEnabled
		}

		if (config.defaultContext) {
			this.defaultContext = {
				...this.defaultContext,
				...config.defaultContext,
			}
		}
	}

	/**
	 * Log a debug message
	 * @param message Log message
	 * @param context Additional context
	 */
	public async debug(message: string, context?: Partial<StructuredLogContext>): Promise<void> {
		await this.log('debug', message, context)
	}

	/**
	 * Log an informational message
	 * @param message Log message
	 * @param context Additional context
	 */
	public async info(message: string, context?: Partial<StructuredLogContext>): Promise<void> {
		await this.log('info', message, context)
	}

	/**
	 * Log a warning message
	 * @param message Log message
	 * @param context Additional context
	 */
	public async warn(message: string, context?: Partial<StructuredLogContext>): Promise<void> {
		await this.log('warn', message, context)
	}

	/**
	 * Log an error message
	 * @param message Log message
	 * @param error Error object
	 * @param context Additional context
	 */
	public async error(message: string, error?: Error, context?: Partial<StructuredLogContext>): Promise<void> {
		const errorContext = error
			? {
				...context,
				errorMessage: error.message,
				stack: error.stack,
				name: error.name,
			}
			: context

		await this.log('error', message, errorContext)
	}

	/**
	 * Log a critical error message
	 * @param message Log message
	 * @param error Error object
	 * @param context Additional context
	 */
	public async critical(message: string, error?: Error, context?: Partial<StructuredLogContext>): Promise<void> {
		const errorContext = error
			? {
				...context,
				errorMessage: error.message,
				stack: error.stack,
				name: error.name,
			}
			: context

		await this.log('critical', message, errorContext)
	}

	/**
	 * Log a message with the specified level
	 * @param level Log level
	 * @param message Log message
	 * @param context Additional context
	 */
	public async log(level: LogLevel, message: string, context?: Partial<StructuredLogContext>): Promise<void> {
		if (!this.isEnabled) return

		// Check if we should log this level
		if (!this.shouldLogLevel(level)) return

		try {
			// If not initialized, queue the log
			if (!this.isInitialized) {
				this.pendingLogs.push({ level, message, context })
				// Log to console even if not initialized
				if (this.consoleLoggingEnabled) {
					this.logToConsole(level, message, this.mergeContext(context))
				}
				return
			}

			// Merge with default context
			const mergedContext = this.mergeContext(context)

			// Log to console if enabled
			if (this.consoleLoggingEnabled) {
				this.logToConsole(level, message, mergedContext)
			}

			try {
				// Log to IndexedDB
				await this.logToIndexedDB(level, message, mergedContext)

				// If we have a remote endpoint and it's an error or critical, try to send it immediately
				if (
					this.remoteLoggingEndpoint &&
					(level === 'error' || level === 'critical') &&
					offlineService.getOnlineStatus()
				) {
					await this.sendLogToRemote(level, message, mergedContext)
				}
			} catch (error) {
				// Don't let IndexedDB or remote logging errors propagate up
				console.error('Failed to log to storage:', error)
			}
		} catch (error) {
			// Catch any unexpected errors to prevent app crashes
			console.error('Critical error in logger:', error)
		}
	}

	/**
	 * Get logs from IndexedDB
	 * @param level Optional log level filter
	 * @param limit Maximum number of logs to return
	 * @returns Promise that resolves with logs
	 */
	public async getLogs(level?: LogLevel, limit = 100): Promise<LogEntry[]> {
		try {
			const initialized = await indexedDBService.init()
			if (initialized === true) {
				return await indexedDBService.getLogs(level, limit)
			}
			console.warn('IndexedDB not available, returning empty logs array')
			return []
		} catch (error) {
			console.error('Failed to get logs from IndexedDB:', error)
			return []
		}
	}

	/**
	 * Clear logs from IndexedDB
	 * @param olderThan Clear logs older than this date
	 * @returns Promise that resolves when logs are cleared
	 */
	public async clearLogs(olderThan?: Date): Promise<void> {
		try {
			const initialized = await indexedDBService.init()
			if (initialized === true) {
				void (await indexedDBService.clearLogs(olderThan))
			} else {
				console.warn('IndexedDB not available, skipping log cleanup')
			}
		} catch (error) {
			console.error('Failed to clear logs from IndexedDB:', error)
		}
	}

	/**
	 * Sync logs to remote endpoint
	 * @returns Promise that resolves when logs are synced
	 */
	public async syncLogsToRemote(): Promise<void> {
		if (!this.remoteLoggingEndpoint || !offlineService.getOnlineStatus()) {
			return
		}

		try {
			// Get all error logs first (most important)
			const errorLogs = await this.getLogs('error', 100)

			// Then get other logs
			const warnLogs = await this.getLogs('warn', 50)
			const infoLogs = await this.getLogs('info', 50)

			// Combine logs
			const logs = [...errorLogs, ...warnLogs, ...infoLogs]

			if (!Array.isArray(logs) || logs.length === 0) {
				return
			}

			// Send logs to remote endpoint
			await this.sendLogsToRemote(logs)

			// If successful, clear the sent logs
			const oldestLog = new Date(Math.min(...logs.map((log) => new Date(log.timestamp).getTime())))
			await this.clearLogs(oldestLog)
		} catch (error) {
			console.error('Failed to sync logs to remote:', error)

			// If we're configured to sync logs when online, add to sync queue
			if (this.syncLogsWhenOnline) {
				offlineService.addToSyncQueue(async () => {
					await this.syncLogsToRemote()
				})
			}
		}
	}

	/**
	 * Log to console
	 * @param level Log level
	 * @param message Log message
	 * @param context Additional context
	 */
	/**
	 * Check if a log level should be logged based on the minimum log level
	 * @param level Log level to check
	 * @returns True if the level should be logged
	 */
	private shouldLogLevel(level: LogLevel): boolean {
		const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical']
		const minIndex = levels.indexOf(this.minLogLevel)
		const levelIndex = levels.indexOf(level)

		return levelIndex >= minIndex
	}

	/**
	 * Merge context with default context
	 * @param context Context to merge
	 * @returns Merged context
	 */
	private mergeContext(context?: Partial<StructuredLogContext>): Record<string, unknown> {
		return {
			...this.defaultContext,
			...context,
			timestamp: new Date().toISOString(),
			userAgent: navigator.userAgent,
			url: window.location.href,
		}
	}

	private logToConsole(level: LogLevel, message: string, context?: Record<string, unknown>): void {
		const timestamp = new Date().toISOString()
		const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`

		switch (level) {
		case 'debug':
			console.debug(formattedMessage, context || '')
			break
		case 'info':
			console.info(formattedMessage, context || '')
			break
		case 'warn':
			console.warn(formattedMessage, context || '')
			break
		case 'error':
			console.error(formattedMessage, context || '')
			break
		case 'critical':
			console.error(`%c${formattedMessage}`, 'color: red; font-weight: bold', context || '')
			break
		}
	}

	/**
	 * Log to IndexedDB
	 * @param level Log level
	 * @param message Log message
	 * @param context Additional context
	 */
	private async logToIndexedDB(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
		try {
			// Check if IndexedDB is already initialized to avoid redundant init calls
			const initialized = await indexedDBService.init()
			if (initialized === true) {
				// Add enhanced context to the log entry
				const enhancedContext = {
					...context,
					appVersion: this.applicationVersion,
					userAgent: navigator.userAgent,
					url: window.location.href,
					timestamp: new Date().toISOString(),
				}

				// Use await directly instead of void (await ...) pattern
				await indexedDBService.log(level, message, enhancedContext)
			} else {
				// If IndexedDB is not available, just log to console
				if (level === 'error' || level === 'warn') {
					console.warn('IndexedDB not available, log entry not saved to database')
				}
			}
		} catch (error) {
			// More detailed error message
			console.error(`Failed to log "${message}" to IndexedDB:`, error)
		}
	}

	/**
	 * Send a log to the remote endpoint with retry logic
	 * @param level Log level
	 * @param message Log message
	 * @param context Additional context
	 */
	private async sendLogToRemote(level: LogLevel, message: string, context?: Record<string, unknown>): Promise<void> {
		if (!this.remoteLoggingEndpoint) return

		// Don't attempt to send if offline
		if (!offlineService.getOnlineStatus()) {
			// Queue for later if configured
			if (this.syncLogsWhenOnline) {
				offlineService.addToSyncQueue(async () => {
					await this.sendLogToRemote(level, message, context)
				})
			}
			return
		}

		const logData = {
			level,
			message,
			timestamp: new Date().toISOString(),
			context: {
				...context,
				appVersion: this.applicationVersion,
				userAgent: navigator.userAgent,
				url: window.location.href,
			},
		}

		// Implement retry with exponential backoff
		const maxRetries = 3
		let retryCount = 0
		let lastError: Error | null = null

		while (retryCount <= maxRetries) {
			try {
				// Add timeout to the fetch request
				const controller = new AbortController()
				const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

				const response = await fetch(this.remoteLoggingEndpoint, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(logData),
					signal: controller.signal,
				})

				clearTimeout(timeoutId)

				// Check if the response is successful
				if (response.ok !== true) {
					throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
				}

				// Success - exit the retry loop
				return
			} catch (error) {
				lastError = error instanceof Error ? error : new Error(String(error))
				retryCount++

				// If we've reached max retries, give up
				if (retryCount > maxRetries) {
					console.error(`Failed to send log to remote endpoint after ${maxRetries} retries:`, lastError)

					// Queue for later if configured
					if (this.syncLogsWhenOnline) {
						offlineService.addToSyncQueue(async () => {
							await this.sendLogToRemote(level, message, context)
						})
					}
					return
				}

				// Exponential backoff with jitter
				const delay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s
				const jitter = Math.random() * 0.3 * delay // Add up to 30% jitter

				console.warn(
					`Retrying log send (${retryCount}/${maxRetries}) after ${Math.round((delay + jitter) / 1000)}s`,
				)
				await new Promise((resolve) => setTimeout(resolve, delay + jitter))
			}
		}
	}

	/**
	 * Send multiple logs to the remote endpoint with batching and retry
	 * @param logs Logs to send
	 */
	private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
		if (!this.remoteLoggingEndpoint) return

		// Don't attempt to send if offline
		if (!offlineService.getOnlineStatus()) {
			// Queue for later if configured
			if (this.syncLogsWhenOnline) {
				offlineService.addToSyncQueue(async () => {
					await this.sendLogsToRemote(logs)
				})
			}
			return
		}

		// Split logs into batches of 50 to avoid large payloads
		const batchSize = 50
		const batches = []

		for (let i = 0; i < logs.length; i += batchSize) {
			batches.push(logs.slice(i, i + batchSize))
		}

		// Process each batch with retry logic
		for (const batch of batches) {
			// Implement retry with exponential backoff
			const maxRetries = 3
			let retryCount = 0
			let success = false

			while (retryCount <= maxRetries && !success) {
				try {
					// Add timeout to the fetch request
					const controller = new AbortController()
					const timeoutId = setTimeout(() => controller.abort(), 15000) // 15 second timeout

					const response = await fetch(this.remoteLoggingEndpoint, {
						method: 'POST',
						headers: {
							'Content-Type': 'application/json',
						},
						body: JSON.stringify({
							logs: batch,
							appVersion: this.applicationVersion,
							timestamp: new Date().toISOString(),
						}),
						signal: controller.signal,
					})

					clearTimeout(timeoutId)

					// Check if the response is successful
					if (response.ok !== true) {
						throw new Error(`HTTP error ${response.status}: ${response.statusText}`)
					}

					// Success - continue to next batch
					success = true
				} catch (error) {
					retryCount++

					// If we've reached max retries, give up on this batch
					if (retryCount > maxRetries) {
						console.error(`Failed to send log batch to remote endpoint after ${maxRetries} retries:`, error)

						// Queue for later if configured
						if (this.syncLogsWhenOnline) {
							const failedBatch = batch
							offlineService.addToSyncQueue(async () => {
								await this.sendLogsToRemote(failedBatch)
							})
						}
						break
					}

					// Exponential backoff with jitter
					const delay = Math.pow(2, retryCount) * 1000 // 2s, 4s, 8s
					const jitter = Math.random() * 0.3 * delay // Add up to 30% jitter

					console.warn(
						`Retrying log batch send (${retryCount}/${maxRetries}) after ${Math.round((delay + jitter) / 1000)}s`,
					)
					await new Promise((resolve) => setTimeout(resolve, delay + jitter))
				}
			}
		}
	}

	/**
	 * Set up periodic log cleanup
	 */
	private setupLogCleanup(): void {
		// Clear old logs once a day
		setInterval(
			() => {
				const cutoffDate = new Date(Date.now() - this.maxLogAge)
				this.clearLogs(cutoffDate).catch((error) => {
					console.error('Failed to clean up old logs:', error)
				})
			},
			24 * 60 * 60 * 1000,
		) // 24 hours

		// Also clean up logs on startup
		const cutoffDate = new Date(Date.now() - this.maxLogAge)
		void this.clearLogs(cutoffDate).catch((error) => {
			console.error('Failed to clean up old logs on startup:', error)
		})
	}
}

// Export singleton instance
const loggerService = LoggerService.getInstance()
export default loggerService
