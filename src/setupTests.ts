import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers'
import '@testing-library/jest-dom'
import { vi, expect, beforeEach, afterEach } from 'vitest'

import {
	mockIndexedDB,
	mockIntersectionObserver,
	mockLocalStorage,
	mockReactFlowBoundingBox,
	mockAnimationFrame,
} from './tests/test-utils'

// Extend expect matchers
declare module 'vitest' {
	interface Assertion extends TestingLibraryMatchers<typeof expect.stringContaining, void> {
		toBeInTheDocument(): void
	}
}

// Mock window.fetch
global.fetch = vi.fn()

// Setup global mocks
beforeAll(() => {
	mockIndexedDB()
	mockIntersectionObserver()
	mockLocalStorage()
	mockReactFlowBoundingBox()
	mockAnimationFrame()

	// Mock service worker
	Object.defineProperty(global.navigator, 'serviceWorker', {
		value: {
			register: vi.fn().mockResolvedValue({}),
			ready: Promise.resolve({
				active: {
					postMessage: vi.fn(),
				},
			}),
		},
		configurable: true,
	})

	// Mock window.matchMedia
	Object.defineProperty(window, 'matchMedia', {
		writable: true,
		value: vi.fn().mockImplementation((query) => ({
			matches: false,
			media: query,
			onchange: null,
			addListener: vi.fn(),
			removeListener: vi.fn(),
			addEventListener: vi.fn(),
			removeEventListener: vi.fn(),
			dispatchEvent: vi.fn(),
		})),
	})
})

// Mock PWA register
vi.mock('virtual:pwa-register', () => ({
	registerSW: () => ({
		onNeedRefresh: vi.fn(),
		onOfflineReady: vi.fn(),
		onRegistered: vi.fn(),
		onRegisterError: vi.fn(),
	}),
}))

// Auto-mock react-router-dom from __mocks__ directory
vi.mock('react-router-dom')

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks()
	document.body.innerHTML = ''
})
