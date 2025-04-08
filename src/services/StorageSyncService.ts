import type { Project } from '../types/project';

import { indexedDBStorageService } from './IndexedDBStorageService';
import loggerService from './LoggerService';
import s3Service from './S3Service';

interface SyncConflict {
  projectId: string;
  localVersion: Project;
  remoteVersion: Project;
  timestamp: string;
}

class StorageSyncService {
  private static instance: StorageSyncService;
  private syncInProgress = false;
  private readonly maxRetries = 3;

  private constructor() {}

  public static getInstance(): StorageSyncService {
    if (StorageSyncService.instance == null) {
      StorageSyncService.instance = new StorageSyncService();
    }
    return StorageSyncService.instance;
  }

  /**
   * Sync a project between IndexedDB and S3
   */
  public async syncProject(project: Project): Promise<boolean> {
    if (this.syncInProgress) {
      loggerService.warn('Sync already in progress, skipping...');
      return false;
    }

    this.syncInProgress = true;

    try {
      // First, sync from S3 to get latest changes
      const remoteProject = await this.pullFromS3(project.id);

      if (remoteProject != null) {
        // Check for conflicts
        const hasConflict = await this.checkForConflicts(project, remoteProject);
        if (hasConflict) {
          // Handle conflict resolution
          const resolvedProject = await this.resolveConflict({
            projectId: project.id,
            localVersion: project,
            remoteVersion: remoteProject,
            timestamp: new Date().toISOString(),
          });

          if (resolvedProject != null) {
            // Save resolved project locally
            await indexedDBStorageService.saveProject(resolvedProject);
            // Push resolved project to S3
            await this.pushToS3(resolvedProject);
          }
        } else {
          // No conflicts, push local changes to S3
          await this.pushToS3(project);
        }
      } else {
        // No remote version exists, push local version
        await this.pushToS3(project);
      }

      loggerService.info(`Project ${project.id} synced successfully`);
      return true;
    } catch (error) {
      loggerService.error(
        'Error syncing project',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Pull project from S3
   */
  private async pullFromS3(projectId: string): Promise<Project | null> {
    try {
      return await s3Service.downloadProject(projectId);
    } catch (error) {
      loggerService.error(
        'Error pulling project from S3',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Push project to S3
   */
  private async pushToS3(project: Project): Promise<boolean> {
    try {
      const result = await s3Service.uploadProject(project);
      return result != null;
    } catch (error) {
      loggerService.error(
        'Error pushing project to S3',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Check for conflicts between local and remote versions
   */
  private async checkForConflicts(local: Project, remote: Project): Promise<boolean> {
    // Compare timestamps
    const localModified = new Date(local.updatedAt).getTime();
    const remoteModified = new Date(remote.updatedAt).getTime();

    // If remote is newer and has different content, we have a conflict
    const hasNewerTimestamp = remoteModified > localModified;
    const hasDifferentContent = JSON.stringify(local.nodes) !== JSON.stringify(remote.nodes);
    return hasNewerTimestamp && hasDifferentContent;
  }

  /**
   * Resolve sync conflict
   * Currently uses a "last write wins" strategy with conflict history
   */
  private async resolveConflict(conflict: SyncConflict): Promise<Project | null> {
    try {
      // Store both versions in history for potential recovery
      await this.storeConflictHistory(conflict);

      // For now, take the most recent version
      const localTime = new Date(conflict.localVersion.updatedAt).getTime();
      const remoteTime = new Date(conflict.remoteVersion.updatedAt).getTime();

      const resolved = localTime > remoteTime ? conflict.localVersion : conflict.remoteVersion;

      loggerService.info(
        `Conflict resolved for project ${conflict.projectId}, using ${localTime > remoteTime ? 'local' : 'remote'} version`
      );

      return resolved;
    } catch (error) {
      loggerService.error(
        'Error resolving sync conflict',
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Store conflict history for potential recovery
   */
  private async storeConflictHistory(conflict: SyncConflict): Promise<void> {
    try {
      await indexedDBStorageService.queueChange({
        id: `conflict_${conflict.projectId}_${Date.now()}`,
        type: 'create',
        timestamp: Date.now(),
        data: {
          type: 'conflict',
          projectId: conflict.projectId,
          localVersion: conflict.localVersion,
          remoteVersion: conflict.remoteVersion,
          timestamp: conflict.timestamp,
        },
        retryCount: 0,
      });
    } catch (error) {
      loggerService.error(
        'Error storing conflict history',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}

export const storageSyncService = StorageSyncService.getInstance();
