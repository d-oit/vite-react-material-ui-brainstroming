import { vi } from 'vitest'

export function mockIndexedDB() {
	const original = global.indexedDB
	const mockIDB = {
		open: vi.fn(),
		deleteDatabase: vi.fn(),
	}

	global.indexedDB = mockIDB as any

	return () => {
		global.indexedDB = original
	}
}

export function mockIntersectionObserver() {
	const original = global.IntersectionObserver
	global.IntersectionObserver = vi.fn(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}))

	return () => {
		global.IntersectionObserver = original
	}
}

export function mockResizeObserver() {
	const original = global.ResizeObserver
	global.ResizeObserver = vi.fn(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}))

	return () => {
		global.ResizeObserver = original
	}
}

export function mockMatchMedia() {
	const original = global.matchMedia
	global.matchMedia = vi.fn().mockImplementation((query) => ({
		matches: false,
		media: query,
		onchange: null,
		addListener: vi.fn(),
		removeListener: vi.fn(),
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	}))

	return () => {
		global.matchMedia = original
	}
}
