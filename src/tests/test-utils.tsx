import { vi } from 'vitest'

export const mockIndexedDB = () => {
	const IDBMock = {
		open: vi.fn(),
		deleteDatabase: vi.fn(),
		databases: vi.fn(),
	}
	global.indexedDB = IDBMock as unknown as IDBFactory
}

export const mockIntersectionObserver = () => {
	class IntersectionObserverMock {
		observe = vi.fn()
		unobserve = vi.fn()
		disconnect = vi.fn()
	}

	global.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver
}

export const mockLocalStorage = () => {
	const localStorageMock = {
		getItem: vi.fn(),
		setItem: vi.fn(),
		removeItem: vi.fn(),
		clear: vi.fn(),
		key: vi.fn(),
		length: 0,
	}

	global.localStorage = localStorageMock as unknown as Storage
}

// Helper function to create a DOMRect for getBoundingClientRect mock
export const createDOMRect = (
	x = 0,
	y = 0,
	width = 1000,
	height = 1000,
): DOMRect => {
	const rect = {
		x,
		y,
		width,
		height,
		top: y,
		right: x + width,
		bottom: y + height,
		left: x,
		toJSON: () => rect,
	}
	return rect as DOMRect
}

// Mock for React Flow's element bounding box
export const mockReactFlowBoundingBox = () => {
	Element.prototype.getBoundingClientRect = vi.fn(() => createDOMRect())
}

// Mock for animation frame functions
export const mockAnimationFrame = () => {
	global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback): number => {
		return setTimeout(() => callback(Date.now()), 0) as unknown as number
	})

	global.cancelAnimationFrame = vi.fn((handle: number) => {
		clearTimeout(handle)
	})
}
