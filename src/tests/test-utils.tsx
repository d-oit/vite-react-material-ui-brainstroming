import type { RenderOptions } from '@testing-library/react'
import { render as rtlRender, screen, fireEvent, waitFor } from '@testing-library/react'
import React from 'react'
import { vi } from 'vitest'

import { I18nProvider } from '../contexts/I18nContext'
import { SettingsProvider } from '../contexts/SettingsContext'

// Re-export testing utilities
export { screen, fireEvent, waitFor }

const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
	return (
		<I18nProvider>
			<SettingsProvider>{children}</SettingsProvider>
		</I18nProvider>
	)
}
type CustomRenderOptions = Omit<RenderOptions, 'wrapper'>

// Custom render function with providers
export const render = (ui: React.ReactElement, options?: CustomRenderOptions): ReturnType<typeof rtlRender> =>
	rtlRender(ui, { wrapper: AllTheProviders, ...options })

// Legacy alias (kept for backward compatibility)
export { render as renderWithProviders }

/**
 * Mock ResizeObserver for testing
 */
export const mockResizeObserver = (): void => {
	class ResizeObserverMock {
		observe = vi.fn()
		unobserve = vi.fn()
		disconnect = vi.fn()
	}

	// Set up the mock
	window.ResizeObserver = ResizeObserverMock
}

/**
 * Mock localStorage for testing
 */
export const mockStorage = {
	storage: {} as { [key: string]: string },
	getItem: vi.fn((key: string) => mockStorage.storage[key] || null),
	setItem: vi.fn((key: string, value: string) => {
		mockStorage.storage[key] = value
	}),
	removeItem: vi.fn((key: string) => {
		delete mockStorage.storage[key]
	}),
	clear: vi.fn(() => {
		mockStorage.storage = {}
	}),
	length: 0,
	key: vi.fn((index: number) => Object.keys(mockStorage.storage)[index] || null),
}

// Initialize storage object
mockStorage.storage = {}

export const mockLocalStorage = (): typeof mockStorage => {
	// Ensure storage is initialized
	if (!mockStorage.storage) {
		mockStorage.storage = {}
	}

	Object.defineProperty(window, 'localStorage', {
		value: mockStorage,
		writable: true,
	})

	return mockStorage
}

/**
 * Mock online status for testing
 */
export const mockOnlineStatus = (online: boolean): void => {
	Object.defineProperty(window.navigator, 'onLine', {
		value: online,
		writable: true,
	})
}
