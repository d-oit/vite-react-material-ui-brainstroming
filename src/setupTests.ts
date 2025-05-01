import React from 'react'
import { vi, beforeAll, afterEach, afterAll } from 'vitest'

import '@testing-library/jest-dom'
import {
	mockIndexedDB,
	mockIntersectionObserver,
	mockResizeObserver,
	mockMatchMedia,
} from './test/test-utils'

// Create a mock icon component factory
const createMockIcon = (iconName: string) => {
	return () => React.createElement('span', { 'data-testid': 'mock-mui-icon' }, iconName)
}

// Static mocks for commonly used Material-UI icons
vi.mock('@mui/icons-material', () => ({
	Fullscreen: createMockIcon('Fullscreen'),
	FullscreenExit: createMockIcon('FullscreenExit'),
	Close: createMockIcon('Close'),
	Save: createMockIcon('Save'),
	Chat: createMockIcon('Chat'),
	Add: createMockIcon('Add'),
	Edit: createMockIcon('Edit'),
	Delete: createMockIcon('Delete'),
	Settings: createMockIcon('Settings'),
	SettingsInputComponent: createMockIcon('SettingsInputComponent'),
	CheckCircle: createMockIcon('CheckCircle'),
	Error: createMockIcon('Error'),
	Archive: createMockIcon('Archive'),
	Bolt: createMockIcon('Bolt'),
	Note: createMockIcon('Note'),
	Send: createMockIcon('Send'),
	// Default export for any other icons
	default: createMockIcon('DefaultIcon'),
}))

// Store all cleanup functions
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
