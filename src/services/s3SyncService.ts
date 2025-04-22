import { i18n } from '../i18n'
import { uploadProject } from '../lib/s3Service'
import type { Project, SyncSettings } from '../types/project'

import loggerService from './LoggerService'

export interface S3SyncResult {
	success: boolean
	message: string
	timestamp: string
	error?: Error
}

export class S3SyncService {
	private retryAttempts = 5
	private retryDelayMs = 1000

	async syncProject(project: Project): Promise<S3SyncResult> {
		if (project.syncSettings?.enableS3Sync !== true) {
			return {
				success: false,
				message: i18n.t('s3.syncNotEnabled'),
				timestamp: new Date().toISOString(),
			}
		}

		try {
			await this.validateS3Settings(project.syncSettings)
			await this.uploadToS3WithRetry(project)

			return {
				success: true,
				message: i18n.t('s3.syncSuccess'),
				timestamp: new Date().toISOString(),
			}
		} catch (error) {
			return {
				success: false,
				message: error instanceof Error ? error.message : i18n.t('s3.syncUnknownError'),
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error : new Error('Unknown error'),
			}
		}
	}

	async getSyncStatus(project: Project): Promise<S3SyncResult> {
		if (project.syncSettings?.enableS3Sync !== true) {
			return {
				success: false,
				message: i18n.t('s3.syncNotEnabledStatus'),
				timestamp: new Date().toISOString(),
			}
		}

		try {
			const lastSynced = project.syncSettings.lastSyncedAt
			return {
				success: true,
				message:
					typeof lastSynced === 'string' && lastSynced.length > 0
						? `${i18n.t('s3.lastSyncedAt')} ${new Date(lastSynced).toLocaleString()}`
						: i18n.t('s3.neverSynced'),
				timestamp: new Date().toISOString(),
			}
		} catch (error) {
			return {
				success: false,
				message: i18n.t('s3.failedSyncStatus'),
				timestamp: new Date().toISOString(),
				error: error instanceof Error ? error : new Error('Unknown error'),
			}
		}
	}

	private async validateS3Settings(settings: SyncSettings): Promise<void> {
		if (settings.s3Path == null || settings.s3Path === '') {
			throw new Error(i18n.t('s3.s3PathNotConfigured'))
		}

		// Add additional S3 configuration validation as needed
	}

	private async uploadToS3WithRetry(project: Project): Promise<void> {
		let lastError: Error | undefined

		for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
			try {
				await this.uploadToS3(project)
				return
			} catch (error) {
				lastError = error instanceof Error ? error : new Error('Unknown error')
				if (attempt < this.retryAttempts) {
					await this.delay(this.retryDelayMs * attempt)
					continue
				}
				throw new Error(
					i18n.t('s3.failedSyncAttempts', { attempts: this.retryAttempts }) + ` ${lastError.message}`,
				)
			}
		}
	}

	private async uploadToS3(project: Project): Promise<void> {
		try {
			await uploadProject(project, (progress) => {
				// Log progress but could also emit events for UI updates
				if (progress % 20 === 0) {
					// Log every 20%
					loggerService.info(i18n.t('s3.uploadProgress', { progress }))
				}
			})

			// Update last synced timestamp
			if (project.syncSettings != null) {
				project.syncSettings.lastSyncedAt = new Date().toISOString()
			}
		} catch (error) {
			throw new Error(
				`${i18n.t('s3.failedUploadToS3')} ${error instanceof Error ? error.message : String(error)}`,
			)
		}
	}

	private async delay(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}
}

export const s3SyncService = new S3SyncService()
