import { vi } from 'vitest'

// AWS S3 interfaces
interface S3Object {
	Key: string
	Size: number
	LastModified: Date
}

interface S3GetObjectOutput {
	Body: Buffer
	ContentType: string
}

interface S3PutObjectOutput {
	ETag: string
}

interface S3ListObjectsOutput {
	Contents: S3Object[]
}

interface S3MethodReturn<T> {
	promise(): Promise<T>
}

// AWS Credentials interface
interface CredentialsConfig {
	accessKeyId: string
	secretAccessKey: string
}

// Create mock S3 class
class S3 {
	constructor() {
		// Mock S3 methods
		this.putObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({ ETag: 'mock-etag' } as S3PutObjectOutput),
		}))

		this.getObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({
				Body: Buffer.from('mock-content'),
				ContentType: 'application/json',
			} as S3GetObjectOutput),
		}))

		this.listObjects = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({
				Contents: [
					{ Key: 'test-key-1', Size: 100, LastModified: new Date() },
					{ Key: 'test-key-2', Size: 200, LastModified: new Date() },
				],
			} as S3ListObjectsOutput),
		}))

		this.deleteObject = vi.fn().mockImplementation(() => ({
			promise: vi.fn().mockResolvedValue({}),
		}))
	}

	// S3 methods with proper return types
	putObject: () => S3MethodReturn<S3PutObjectOutput>
	getObject: () => S3MethodReturn<S3GetObjectOutput>
	listObjects: () => S3MethodReturn<S3ListObjectsOutput>
	deleteObject: () => S3MethodReturn<Record<string, never>>
}

// Create mock Credentials class
class Credentials {
	accessKeyId: string
	secretAccessKey: string

	constructor(options: CredentialsConfig) {
		this.accessKeyId = options.accessKeyId
		this.secretAccessKey = options.secretAccessKey
	}
}

// AWS Config interface
interface AWSConfig {
	update: (config: Partial<CredentialsConfig>) => void
}

// Create mock config object
const config: AWSConfig = {
	update: vi.fn(),
}

// Export the mocks
export { S3, Credentials, config }
export default { S3, Credentials, config }
