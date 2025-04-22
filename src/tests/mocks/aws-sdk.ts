import { vi } from 'vitest'

// Create mock S3 class
class S3 {
	constructor() {
		// Mock S3 methods
		this.putObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({ ETag: 'mock-etag' }),
		}))

		this.getObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({
				Body: Buffer.from('mock-content'),
				ContentType: 'application/json',
			}),
		}))

		this.listObjects = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({
				Contents: [
					{ Key: 'test-key-1', Size: 100, LastModified: new Date() },
					{ Key: 'test-key-2', Size: 200, LastModified: new Date() },
				],
			}),
		}))

		this.deleteObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({}),
		}))
	}

	// S3 methods
	putObject: any
	getObject: any
	listObjects: any
	deleteObject: any
}

// Create mock Credentials class
class Credentials {
	constructor(options: any) {
		this.accessKeyId = options.accessKeyId
		this.secretAccessKey = options.secretAccessKey
	}

	accessKeyId: string
	secretAccessKey: string
}

// Create mock config object
const config = {
	update: vi.fn(),
}

// Export the mocks
export { S3, Credentials, config }
export default { S3, Credentials, config }
