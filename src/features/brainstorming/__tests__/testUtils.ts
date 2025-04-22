import { vi } from 'vitest'

// Mock the generateId function
export const mockGenerateId = () => {
	let counter = 0
	vi.mock('../../../utils/idGenerator', () => ({
		generateId: vi.fn().mockImplementation(() => `test-id-${++counter}`),
	}))
}

// Setup common test utilities
export function setupTest() {
	// Mock localStorage
	const localStorageMock = {
		getItem: vi.fn(),
		setItem: vi.fn(),
		clear: vi.fn(),
		removeItem: vi.fn(),
		length: 0,
		key: vi.fn(),
	}
	Object.defineProperty(window, 'localStorage', { value: localStorageMock })

	// Mock ResizeObserver
	global.ResizeObserver = class ResizeObserver {
		observe() {}
		unobserve() {}
		disconnect() {}
	}

	// Mock generateId
	mockGenerateId()
}

// Setup timers for tests
export function setupTimers() {
	beforeEach(() => {
		vi.useFakeTimers()
	})

	afterEach(() => {
		vi.runOnlyPendingTimers()
		vi.useRealTimers()
	})
}
