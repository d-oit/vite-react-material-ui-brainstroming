import { vi } from 'vitest'

export const mockLocalStorage = () => {
	const storage = new Map<string, string>()

	const localStorageMock = {
		getItem: vi.fn((key: string) => storage.get(key) || null),
		setItem: vi.fn((key: string, value: string) => storage.set(key, value)),
		removeItem: vi.fn((key: string) => storage.delete(key)),
		clear: vi.fn(() => storage.clear()),
		key: vi.fn((index: number) => Array.from(storage.keys())[index] || null),
		get length() {
			return storage.size
		},
	}

	vi.stubGlobal('localStorage', localStorageMock)
	return localStorageMock
}

export const mockOnlineStatus = (online: boolean) => {
	Object.defineProperty(window.navigator, 'onLine', {
		writable: true,
		value: online,
	})
	return online
}

export const mockResizeObserver = () => {
	const ResizeObserverMock = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}))

	vi.stubGlobal('ResizeObserver', ResizeObserverMock)

	return ResizeObserverMock
}
