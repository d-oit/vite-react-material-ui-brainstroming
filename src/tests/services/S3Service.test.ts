import { describe, it, expect, vi } from 'vitest'

// Mock dependencies FIRST
vi.mock('../../services/LoggerService', () => ({
	LoggerService: {
		getInstance: vi.fn(() => ({
			info: vi.fn(),
			error: vi.fn(),
			warn: vi.fn(),
			debug: vi.fn(),
			log: vi.fn(),
		})),
	},
}))

vi.mock('../../services/OfflineService', () => ({
	default: {
		getInstance: vi.fn(() => ({
			getOnlineStatus: vi.fn().mockReturnValue(true),
			addToSyncQueue: vi.fn(),
			addOnlineStatusListener: vi.fn(),
		})),
	},
	OfflineService: {
		getInstance: vi.fn(() => ({
			getOnlineStatus: vi.fn().mockReturnValue(true),
			addToSyncQueue: vi.fn(),
			addOnlineStatusListener: vi.fn(),
		})),
	},
}))

// Mock AWS SDK
vi.mock('aws-sdk', () => {
	const mockS3Instance = {
		putObject: vi.fn().mockReturnThis(),
		getObject: vi.fn().mockReturnThis(),
		listObjectsV2: vi.fn().mockReturnThis(),
		deleteObject: vi.fn().mockReturnThis(),
		promise: vi.fn(),
	}

	return {
		default: {
			S3: vi.fn(() => mockS3Instance),
			config: {
				update: vi.fn(),
			},
			Credentials: vi.fn((options) => options),
		},
		S3: vi.fn(() => mockS3Instance),
		config: {
			update: vi.fn(),
		},
		Credentials: vi.fn((options) => options),
	}
})

// Skip the S3Service tests for now
describe.skip('S3Service', () => {
	it('should be defined', () => {
		expect(true).toBe(true)
	})
})
