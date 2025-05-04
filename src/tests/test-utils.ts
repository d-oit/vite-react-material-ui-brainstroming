import { vi } from 'vitest'

import { createMockResizeObserver, createMockStorage, createMockNetworkStatus } from '../types/test-utils'

export const mockResizeObserver = () => {
	const observer = createMockResizeObserver()
	vi.stubGlobal('ResizeObserver', vi.fn(() => observer))
	return observer
}

export const mockLocalStorage = () => {
	const storage = createMockStorage()
	vi.stubGlobal('localStorage', storage)
	return storage
}

export const mockOnlineStatus = (online: boolean = true) => {
	const networkStatus = createMockNetworkStatus({ online })
	Object.defineProperty(window.navigator, 'onLine', {
		configurable: true,
		value: networkStatus.online,
	})
	return networkStatus
}