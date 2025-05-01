import { act } from '@testing-library/react'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'

type Cleanup = () => void

// Track open IndexedDB connections
let openConnections: Set<MockIDBDatabase> = new Set()

interface MockIntersectionObserver {
	observe: ReturnType<typeof vi.fn>
	unobserve: ReturnType<typeof vi.fn>
	disconnect: ReturnType<typeof vi.fn>
	root: null
	rootMargin: string
	thresholds: number[]
	takeRecords: () => IntersectionObserverEntry[]
}

interface MockIDBRequest extends EventTarget {
	result: any
	error: DOMException | null
	source: any
	transaction: any
	readyState: 'pending' | 'done'
	onerror: ((this: IDBRequest, ev: Event) => any) | null
	onsuccess: ((this: IDBRequest, ev: Event) => any) | null
}

interface MockIDBDatabase extends EventTarget {
	name: string
	version: number
	objectStoreNames: string[]
	close: () => void
	createObjectStore: (name: string, options?: IDBObjectStoreParameters) => any
	deleteObjectStore: (name: string) => void
	transaction: (storeNames: string | string[], mode?: IDBTransactionMode) => any
}

class MockDOMException extends Error implements DOMException {
	constructor(message: string, name: string) {
		super(message)
		this.name = name
		this.code = 0
	}
	readonly code: number
	readonly INDEX_SIZE_ERR = 1
	readonly DOMSTRING_SIZE_ERR = 2
	readonly HIERARCHY_REQUEST_ERR = 3
	readonly WRONG_DOCUMENT_ERR = 4
	readonly INVALID_CHARACTER_ERR = 5
	readonly NO_DATA_ALLOWED_ERR = 6
	readonly NO_MODIFICATION_ALLOWED_ERR = 7
	readonly NOT_FOUND_ERR = 8
	readonly NOT_SUPPORTED_ERR = 9
	readonly INUSE_ATTRIBUTE_ERR = 10
	readonly INVALID_STATE_ERR = 11
	readonly SYNTAX_ERR = 12
	readonly INVALID_MODIFICATION_ERR = 13
	readonly NAMESPACE_ERR = 14
	readonly INVALID_ACCESS_ERR = 15
	readonly VALIDATION_ERR = 16
	readonly TYPE_MISMATCH_ERR = 17
	readonly SECURITY_ERR = 18
	readonly NETWORK_ERR = 19
	readonly ABORT_ERR = 20
	readonly URL_MISMATCH_ERR = 21
	readonly QUOTA_EXCEEDED_ERR = 22
	readonly TIMEOUT_ERR = 23
	readonly INVALID_NODE_TYPE_ERR = 24
	readonly DATA_CLONE_ERR = 25
}

// Maximum allowed concurrent connections
const MAX_CONNECTIONS = 20

export const mockIndexedDB = (): Cleanup => {
	const original = window.indexedDB
	openConnections = new Set()

	const createMockRequest = (): MockIDBRequest => {
		const request = new EventTarget() as MockIDBRequest
		request.result = null
		request.error = null
		request.source = null
		request.transaction = null
		request.readyState = 'pending'
		request.onerror = null
		request.onsuccess = null
		return request
	}

	const createMockDatabase = (name: string, version: number): MockIDBDatabase => {
		const db = new EventTarget() as MockIDBDatabase
		db.name = name
		db.version = version
		db.objectStoreNames = []
		db.close = () => {
			openConnections.delete(db)
		}
		db.createObjectStore = vi.fn()
		db.deleteObjectStore = vi.fn()
		db.transaction = vi.fn()
		return db
	}

	const mockIDB = {
		open: vi.fn((name: string, version?: number) => {
			const request = createMockRequest()
			setTimeout(() => {
				if (openConnections.size >= MAX_CONNECTIONS) {
					request.error = new MockDOMException('Too many open connections', 'EMFILE')
					request.onerror?.call(request as IDBRequest, new Event('error'))
					return
				}

				const db = createMockDatabase(name, version || 1)
				openConnections.add(db)
				request.result = db
				request.readyState = 'done'
				request.onsuccess?.call(request as IDBRequest, new Event('success'))
			}, 0)
			return request
		}),
		deleteDatabase: vi.fn((name: string) => {
			const request = createMockRequest()
			setTimeout(() => {
				request.readyState = 'done'
				request.onsuccess?.call(request as IDBRequest, new Event('success'))
			}, 0)
			return request
		}),
		cmp: vi.fn((first: any, second: any) => {
			return first < second ? -1 : first > second ? 1 : 0
		}),
		databases: vi.fn().mockResolvedValue([]),
	}

	window.indexedDB = mockIDB as any
	return () => {
		// Close all open connections
		openConnections.forEach((db) => db.close())
		openConnections.clear()
		window.indexedDB = original
	}
}

export const mockIntersectionObserver = (): Cleanup => {
	const original = window.IntersectionObserver
	const mockObserver: MockIntersectionObserver = {
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
		root: null,
		rootMargin: '0px',
		thresholds: [0],
		takeRecords: () => [],
	}
	window.IntersectionObserver = vi.fn(() => mockObserver) as any
	return () => { window.IntersectionObserver = original }
}

export const mockResizeObserver = (): Cleanup => {
	const original = window.ResizeObserver
	window.ResizeObserver = vi.fn(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	})) as any
	return () => { window.ResizeObserver = original }
}

export const mockMatchMedia = (): Cleanup => {
	const original = window.matchMedia
	const mockList = (query: string) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	})
	window.matchMedia = vi.fn().mockImplementation(mockList) as any
	return () => { window.matchMedia = original }
}

// Utility function to wrap React state updates in act()
export const actWrapper = async (callback: () => Promise<void> | void): Promise<void> => {
	await act(async () => {
		await callback()
	})
}
