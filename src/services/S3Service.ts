import type { Project } from '../types'

import loggerService from './LoggerService'
import offlineService from './OfflineService'

// Define a type for version info
interface VersionInfo {
	version: string
	lastModified: Date
}

// Define a type for queued operations
interface QueuedOperation {
	type: 'upload' | 'download' | 'delete'
	data: Project | string | Record<string, unknown>
	timestamp: string
}

/**
 * Service for AWS S3 operations
 * This is a browser-compatible version that loads AWS SDK dynamically only when needed
 * with offline awareness and operation queuing
 */
export class S3Service {
	private static instance: S3Service
	private s3: unknown = null
	private AWS: unknown = null
	private bucketName: string = 'do-it-brainstorming'
	private region: string = 'us-east-1'
	private _isConfigured: boolean = false
	private _isAvailable: boolean = false
	private operationQueue: QueuedOperation[] = []
	private isProcessingQueue: boolean = false

	private constructor() {
		// Check if AWS SDK is available in the environment variables
		try {
			// @ts-expect-error - Vite specific environment variable
			this._isAvailable = !!import.meta.env.VITE_AWS_S3_ENABLED
		} catch (_) {
			console.warn('Unable to check environment variables for S3 configuration')
			this._isAvailable = false
		}

		// Listen for online status changes to process queue when back online
		offlineService.addOnlineStatusListener((online) => {
			if (online && this.operationQueue.length > 0) {
				this.processQueue()
			}
		})

		// Load queued operations from localStorage
		this.loadQueueFromStorage()
	}

	public static getInstance(): S3Service {
		if (!S3Service.instance) {
			S3Service.instance = new S3Service()
		}
		return S3Service.instance
	}

	/**
	 * Check if S3 service is available
	 * @returns True if S3 service is available
	 */
	public isS3Available(): boolean {
		return this._isAvailable
	}

	/**
	 * Configure the S3 service with credentials
	 * @param accessKeyId AWS access key ID
	 * @param secretAccessKey AWS secret access key
	 * @param region AWS region
	 * @param bucketName S3 bucket name
	 */
	public async configure(
		accessKeyId: string,
		secretAccessKey: string,
		region?: string,
		bucketName?: string,
	): Promise<boolean> {
		if (!this._isAvailable) {
			console.warn('AWS S3 is not enabled in environment variables')
			return false
		}

		try {
			// Dynamically import AWS SDK only when needed
			if (!this.AWS) {
				try {
					// For tests, we can use the global AWS object if it exists
					if (typeof AWS !== 'undefined') {
						this.AWS = AWS
					} else {
						// Use dynamic import to load only the specific AWS SDK modules we need
						const { S3 } = await import('aws-sdk/clients/s3')
						const { config, Credentials } = await import('aws-sdk')

						// Store the imported modules
						this.AWS = { S3, config, Credentials }
					}
				} catch (err) {
					console.error('Failed to load AWS SDK:', err)
					return false
				}
			}

			try {
				// @ts-expect-error - Dynamic AWS SDK
				this.AWS.config.update({
					region: region || this.region,
					// @ts-expect-error - Dynamic AWS SDK
					credentials: new this.AWS.Credentials({
						accessKeyId,
						secretAccessKey,
					}),
				})

				// @ts-expect-error - Dynamic AWS SDK
				this.s3 = new this.AWS.S3({
					region: region || this.region,
				})
			} catch (error) {
				console.error('Error configuring AWS SDK:', error)
				return false
			}

			if (bucketName) {
				this.bucketName = bucketName
			}

			if (region) {
				this.region = region
			}

			this._isConfigured = true
			return true
		} catch (_error) {
			console.error('Error configuring S3 service:', _error)
			return false
		}
	}

	/**
	 * Upload a project to S3
	 * @param project Project to upload
	 * @returns S3 upload response or null if failed
	 */
	public async uploadProject(project: Project): Promise<unknown> {
		if (!this._isAvailable || !this._isConfigured) {
			console.warn('S3 service is not available or not configured')
			return null
		}

		// Check if online
		if (!offlineService.getOnlineStatus()) {
			loggerService.info('Queuing S3 upload operation for offline mode')
			this.queueOperation('upload', { project })
			return { queued: true }
		}

		try {
			const key = `projects/${project.id}/${project.version}.json`
			const params = {
				Bucket: this.bucketName,
				Key: key,
				Body: JSON.stringify(project),
				ContentType: 'application/json',
			}

			const result = await this.s3.putObject(params).promise()
			loggerService.info(`Project ${project.id} uploaded to S3 successfully`)
			return result
		} catch (error) {
			loggerService.error(
				'Error uploading project to S3',
				error instanceof Error ? error : new Error(String(error)),
			)

			// If the error is due to network issues, queue the operation
			if (!navigator.onLine) {
				this.queueOperation('upload', { project })
				return { queued: true }
			}

			return null
		}
	}

	/**
	 * Queue an operation for later execution when online
	 * @param type Operation type
	 * @param data Operation data
	 */
	private queueOperation(
		type: 'upload' | 'download' | 'delete',
		data: { key?: string; projectId?: string; version?: string; content?: string | Project },
	): void {
		const operation: QueuedOperation = {
			type,
			data,
			timestamp: new Date().toISOString(),
		}

		this.operationQueue.push(operation)
		this.saveQueueToStorage()

		loggerService.info(`S3 operation queued: ${type}`)
	}

	/**
	 * Process the operation queue
	 */
	private async processQueue(): Promise<void> {
		if (this.isProcessingQueue || this.operationQueue.length === 0 || !offlineService.getOnlineStatus()) {
			return
		}

		this.isProcessingQueue = true
		loggerService.info(`Processing S3 operation queue: ${this.operationQueue.length} items`)

		try {
			// Process each operation in order
			const queue = [...this.operationQueue]
			this.operationQueue = []

			for (const operation of queue) {
				try {
					switch (operation.type) {
						case 'upload':
							await this.uploadProject(operation.data.project)
							break
						case 'download':
							// Implement download processing
							break
						case 'delete':
							// Implement delete processing
							break
					}
				} catch (error) {
					loggerService.error(
						`Error processing queued S3 operation: ${operation.type}`,
						error instanceof Error ? error : new Error(String(error)),
					)
					// Put failed operation back in queue
					this.operationQueue.push(operation)
				}
			}

			this.saveQueueToStorage()
		} finally {
			this.isProcessingQueue = false

			// If there are still operations in the queue, try again later
			if (this.operationQueue.length > 0 && offlineService.getOnlineStatus()) {
				setTimeout(() => this.processQueue(), 5000)
			}
		}
	}

	/**
	 * Save the operation queue to localStorage
	 */
	private saveQueueToStorage(): void {
		try {
			localStorage.setItem('s3_operation_queue', JSON.stringify(this.operationQueue))
		} catch (error) {
			loggerService.error(
				'Error saving S3 operation queue to storage',
				error instanceof Error ? error : new Error(String(error)),
			)
		}
	}

	/**
	 * Load the operation queue from localStorage
	 */
	private loadQueueFromStorage(): void {
		try {
			const queueData = localStorage.getItem('s3_operation_queue')
			if (queueData) {
				this.operationQueue = JSON.parse(queueData)
				loggerService.info(`Loaded ${this.operationQueue.length} S3 operations from storage`)
			}
		} catch (error) {
			loggerService.error(
				'Error loading S3 operation queue from storage',
				error instanceof Error ? error : new Error(String(error)),
			)
			this.operationQueue = []
		}
	}

	/**
	 * Download a project from S3
	 * @param projectId Project ID
	 * @param version Project version (optional)
	 * @returns Project object or null if failed
	 */
	public async downloadProject(projectId: string, version?: string): Promise<Project | null> {
		if (!this._isAvailable || !this._isConfigured) {
			console.warn('S3 service is not available or not configured')
			return null
		}

		// Check if online
		if (!offlineService.getOnlineStatus()) {
			loggerService.info(`Cannot download project ${projectId} while offline`)
			// Queue for later if needed
			this.queueOperation('download', { projectId, version })
			return null
		}

		try {
			let key: string

			if (version) {
				key = `projects/${projectId}/${version}.json`
			} else {
				// List all versions and get the latest
				const listParams = {
					Bucket: this.bucketName,
					Prefix: `projects/${projectId}/`,
				}

				const listResponse = await this.s3.listObjectsV2(listParams).promise()

				if (!listResponse.Contents || listResponse.Contents.length === 0) {
					loggerService.warn(`No versions found for project ${projectId}`)
					return null
				}

				// Sort by last modified date (descending)
				const sortedObjects = listResponse.Contents.sort((a: AWS.S3.Object, b: AWS.S3.Object) => {
					return (b.LastModified?.getTime() || 0) - (a.LastModified?.getTime() || 0)
				})

				key = sortedObjects[0].Key || ''
			}

			const params = {
				Bucket: this.bucketName,
				Key: key,
			}

			const response = await this.s3.getObject(params).promise()

			if (!response.Body) {
				loggerService.warn('Empty response body when downloading project')
				return null
			}

			const project = JSON.parse(response.Body.toString())
			loggerService.info(`Project ${projectId} downloaded from S3 successfully`)
			return project
		} catch (error) {
			loggerService.error(
				'Error downloading project from S3',
				error instanceof Error ? error : new Error(String(error)),
			)

			// If the error is due to network issues, queue the operation for later
			if (!navigator.onLine) {
				this.queueOperation('download', { projectId, version })
			}

			return null
		}
	}

	/**
	 * List all versions of a project
	 * @param projectId Project ID
	 * @returns Array of version information or empty array if failed
	 */
	public async listProjectVersions(projectId: string): Promise<{ version: string; lastModified: Date }[]> {
		if (!this._isAvailable || !this._isConfigured) {
			console.warn('S3 service is not available or not configured')
			return []
		}

		try {
			const params = {
				Bucket: this.bucketName,
				Prefix: `projects/${projectId}/`,
			}

			const response = await this.s3.listObjectsV2(params).promise()

			if (!response.Contents) {
				return []
			}

			return response.Contents.map((item: AWS.S3.Object) => {
				const key = item.Key || ''
				const version = key.split('/').pop()?.replace('.json', '') || ''

				return {
					version,
					lastModified: item.LastModified || new Date(),
				}
			}).sort((a: VersionInfo, b: VersionInfo) => b.lastModified.getTime() - a.lastModified.getTime())
		} catch (error) {
			console.error('Error listing project versions from S3:', error)
			return []
		}
	}

	/**
	 * Check if the service is configured
	 * @returns True if configured, false otherwise
	 */
	public isConfigured(): boolean {
		return this._isConfigured && this._isAvailable
	}
}

export default S3Service.getInstance()
