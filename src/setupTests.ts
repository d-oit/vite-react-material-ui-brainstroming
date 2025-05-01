import { vi, beforeAll, afterEach, afterAll } from 'vitest'

import '@testing-library/jest-dom'
import {
	mockIndexedDB,
	mockIntersectionObserver,
	mockResizeObserver,
	mockMatchMedia,
} from './test/test-utils'

// Store cleanup functions
const cleanupFunctions: Array<() => void> = []

// Setup all mocks before tests
beforeAll(() => {
	cleanupFunctions.push(
		mockIndexedDB(),
		mockIntersectionObserver(),
		mockResizeObserver(),
		mockMatchMedia(),
	)
})

// Clean up after each test
afterEach(() => {
	vi.clearAllMocks()
})

// Clean up all mocks after tests
afterAll(() => {
	cleanupFunctions.forEach((cleanup) => cleanup())
})
