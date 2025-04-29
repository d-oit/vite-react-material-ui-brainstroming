import '@testing-library/jest-dom'

import { vi, expect } from 'vitest'

import {
	mockIndexedDB,
	mockIntersectionObserver,
	mockLocalStorage,
	mockReactFlowBoundingBox,
	mockAnimationFrame,
} from './test-utils'

// Extend matchers
expect.extend({
	toBeInTheDocument(received) {
		const pass = received !== null
		return {
			message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
			pass,
		}
	},
})

// Setup global mocks
beforeAll(() => {
	// Initialize basic mocks
	mockIndexedDB()
	mockIntersectionObserver()
	mockLocalStorage()
	mockReactFlowBoundingBox()
	mockAnimationFrame()

	// Mock window.fetch
	global.fetch = vi.fn()

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
})

// Cleanup after each test
afterEach(() => {
	vi.clearAllMocks()
	document.body.innerHTML = ''
})

beforeEach(() => {
	// Mock PWA register
	vi.mock('virtual:pwa-register', () => ({
		registerSW: () => ({
			onNeedRefresh: vi.fn(),
			onOfflineReady: vi.fn(),
			onRegistered: vi.fn(),
			onRegisterError: vi.fn(),
		}),
	}))

	// Mock LoggerService
	vi.mock('../services/LoggerService', async () => {
		const { LoggerService } = await import('./mocks/LoggerService')
		return {
			default: new LoggerService('test'),
			LoggerService,
		}
	})

	// Mock AWS SDK
	vi.mock('aws-sdk', async () => {
		const awsMock = await import('./mocks/aws-sdk')
		return {
			...awsMock,
			default: awsMock.default,
		}
	})

	// Mock AWS SDK clients
	vi.mock('aws-sdk/clients/s3', async () => {
		const { S3 } = await import('./mocks/aws-sdk')
		return { S3 }
	})

	// Mock React Flow
	vi.mock('reactflow', async () => {
		const actual = await vi.importActual('reactflow')
		return {
			...actual,
			useReactFlow: vi.fn().mockReturnValue({
				fitView: vi.fn(),
				zoomIn: vi.fn(),
				zoomOut: vi.fn(),
				setCenter: vi.fn(),
				getNodes: vi.fn().mockReturnValue([]),
				getEdges: vi.fn().mockReturnValue([]),
				setNodes: vi.fn(),
				setEdges: vi.fn(),
				project: vi.fn(({ x, y }) => ({ x, y })),
			}),
			// Properly typed state hooks
			useNodesState: vi.fn().mockImplementation((initialNodes) => {
				const [nodes, setNodes] = [initialNodes, vi.fn()]
				return [nodes, setNodes]
			}),
			useEdgesState: vi.fn().mockImplementation((initialEdges) => {
				const [edges, setEdges] = [initialEdges, vi.fn()]
				return [edges, setEdges]
			}),
		}
	})
})
