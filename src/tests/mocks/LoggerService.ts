import { vi } from 'vitest'

// Create a mock for the log method
const logMock = vi.fn()

// Create a mock LoggerService class
export class LoggerService {
	private context: string
	private _isEnabled: boolean = true
	private _minLevel: string = 'debug'

	constructor(context: string) {
		this.context = context
	}

	// Mock the log method
	log = logMock

	// Convenience methods that call log
	info = vi.fn().mockImplementation((message: string, meta?: any) => {
		return this.log('info', message, meta)
	})

	warn = vi.fn().mockImplementation((message: string, meta?: any) => {
		return this.log('warn', message, meta)
	})

	error = vi.fn().mockImplementation((message: string, error?: Error, meta?: any) => {
		return this.log('error', message, { ...meta, error })
	})

	debug = vi.fn().mockImplementation((message: string, meta?: any) => {
		return this.log('debug', message, meta)
	})

	// Configuration methods
	configure = vi.fn().mockImplementation((options: { enabled?: boolean; minLevel?: string }) => {
		if (options.enabled !== undefined) this._isEnabled = options.enabled
		if (options.minLevel) this._minLevel = options.minLevel
		return this
	})

	isEnabled() {
		return this._isEnabled
	}

	getMinLevel() {
		return this._minLevel
	}

	// Add any other methods that might be used
	getContext() {
		return this.context
	}

	// Add missing methods
	getLogs = vi.fn().mockResolvedValue([])
	clearLogs = vi.fn().mockResolvedValue(undefined)
	initialize = vi.fn().mockResolvedValue(true) // Return true to indicate successful initialization

	// Add static methods
	static getInstance() {
		return new LoggerService('test')
	}
}

// Create a default export for the mock
const defaultInstance = new LoggerService('test')
export default defaultInstance

// Export the log mock for testing
export const mockLog = logMock
