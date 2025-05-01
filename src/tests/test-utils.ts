import { vi } from 'vitest'

export const mockResizeObserver = () => {
	const ResizeObserverMock = vi.fn().mockImplementation(() => ({
		observe: vi.fn(),
		unobserve: vi.fn(),
		disconnect: vi.fn(),
	}))

	vi.stubGlobal('ResizeObserver', ResizeObserverMock)

	return ResizeObserverMock
}
