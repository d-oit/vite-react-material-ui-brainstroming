import { vi } from 'vitest'

// Create a mock for the OfflineService
const mockOfflineService = {
	getOnlineStatus: vi.fn().mockImplementation(() => {
		return navigator.onLine
	}),
	addOnlineStatusListener: vi.fn().mockImplementation((listener) => {
		mockOfflineService.listeners.push(listener)
		// Call the listener with the current status
		listener(mockOfflineService.getOnlineStatus())
		// Return a function to remove the listener
		return () => {
			const index = mockOfflineService.listeners.indexOf(listener)
			if (index !== -1) {
				mockOfflineService.listeners.splice(index, 1)
			}
		}
	}),
	handleOnline: vi.fn().mockImplementation(() => {
		mockOfflineService.listeners.forEach((listener) => listener(true))
		mockOfflineService.processSyncQueue()
	}),
	handleOffline: vi.fn().mockImplementation(() => {
		mockOfflineService.listeners.forEach((listener) => listener(false))
	}),
	addToSyncQueue: vi.fn().mockImplementation((fn) => {
		mockOfflineService.syncQueue.push(fn)
		// Save to localStorage
		localStorage.setItem('offlineSyncQueue', JSON.stringify(mockOfflineService.syncQueue))
	}),
	processSyncQueue: vi.fn().mockImplementation(async () => {
		const queue = [...mockOfflineService.syncQueue]
		mockOfflineService.syncQueue = []

		for (const fn of queue) {
			try {
				await fn()
			} catch (error) {
				console.error('Error processing sync queue item:', error)
			}
		}
	}),
	syncQueue: [],
	listeners: [],
	// Add missing methods
	startAutoSync: vi.fn(),
	stopAutoSync: vi.fn(),
	configure: vi.fn(),
	getPendingOperationsCount: vi.fn().mockReturnValue(0),
	checkNetworkStatus: vi.fn().mockResolvedValue(true),
	addNetworkStatusListener: vi.fn().mockImplementation((listener) => {
		// Call the listener with a default network status
		listener({ online: true, isReliable: true, latency: 50, downlink: 10 })
		// Return a function to remove the listener
		return () => {}
	}),
}

// Create a mock OfflineService class
export class OfflineService {
	static getInstance() {
		return mockOfflineService
	}
}

export default mockOfflineService
