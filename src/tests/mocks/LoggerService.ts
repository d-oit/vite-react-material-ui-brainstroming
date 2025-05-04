import { vi } from 'vitest'

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogMeta {
	[key: string]: unknown
}

export interface LogEntry {
	level: LogLevel
	message: string
	meta?: LogMeta
	timestamp: Date
	context: string
}

export interface LoggerConfig {
	enabled?: boolean
	minLevel?: LogLevel
}

// Create a mock for the log method
const logMock = vi.fn()

// Create a mock LoggerService class
export class LoggerService {
	private context: string
	private _isEnabled: boolean = true
	private _minLevel: LogLevel = 'debug'

	constructor(context: string) {
		this.context = context
	}

	// Mock the log method
	log = logMock

	// Convenience methods that call log
	info = vi.fn().mockImplementation((message: string, meta?: LogMeta) => {
		return this.log('info', message, meta)
	})

	warn = vi.fn().mockImplementation((message: string, meta?: LogMeta) => {
		return this.log('warn', message, meta)
	})

	error = vi.fn().mockImplementation((message: string, error?: Error, meta?: LogMeta) => {
		const errorMeta: LogMeta = { ...meta, error }
		return this.log('error', message, errorMeta)
	})

	debug = vi.fn().mockImplementation((message: string, meta?: LogMeta) => {
		return this.log('debug', message, meta)
	})

	// Configuration methods
	configure = vi.fn().mockImplementation((options: LoggerConfig) => {
		if (options.enabled !== undefined) this._isEnabled = options.enabled
		if (options.minLevel) this._minLevel = options.minLevel
		return this
	})

	isEnabled(): boolean {
		return this._isEnabled
	}

	getMinLevel(): LogLevel {
		return this._minLevel
	}

	getContext(): string {
		return this.context
	}

	// Mock methods for logs management
	getLogs = vi.fn(() => Promise.resolve([] as LogEntry[]))
	clearLogs = vi.fn(() => Promise.resolve())
	initialize = vi.fn(() => Promise.resolve(true))

	// Add static methods
	static getInstance(): LoggerService {
		return new LoggerService('test')
	}
}

// Create a default export for the mock
const defaultInstance = new LoggerService('test')
export default defaultInstance

// Export the log mock for testing
export const mockLog = logMock
