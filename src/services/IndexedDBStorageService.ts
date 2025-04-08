import type { Project } from '../types/project';

import loggerService from './LoggerService';

interface StorageManager {
  saveProject(project: Project): Promise<void>;
  getProject(id: string): Promise<Project>;
  listProjects(): Promise<Project[]>;
  deleteProject(id: string): Promise<void>;
  queueChange(change: PendingChange): Promise<void>;
  processPendingChanges(): Promise<void>;
}

interface PendingChange {
  id: string;
  type: 'create' | 'update' | 'delete';
  timestamp: number;
  data: any;
  retryCount: number;
}

class IndexedDBStorageService implements StorageManager {
  private static instance: IndexedDBStorageService;
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'projectsDB';
  private readonly DB_VERSION = 1;
  private readonly PROJECTS_STORE = 'projects';
  private readonly PENDING_CHANGES_STORE = 'pendingChanges';

  private constructor() {
    this.initDB().catch(error => {
      loggerService.error('Failed to initialize IndexedDB', error);
    });
  }

  public static getInstance(): IndexedDBStorageService {
    if (IndexedDBStorageService.instance == null) {
      IndexedDBStorageService.instance = new IndexedDBStorageService();
    }
    return IndexedDBStorageService.instance;
  }

  private async initDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create projects store
        if (!db.objectStoreNames.contains(this.PROJECTS_STORE)) {
          const projectsStore = db.createObjectStore(this.PROJECTS_STORE, { keyPath: 'id' });
          projectsStore.createIndex('lastModified', 'lastModified', { unique: false });
        }

        // Create pending changes store
        if (!db.objectStoreNames.contains(this.PENDING_CHANGES_STORE)) {
          const pendingChangesStore = db.createObjectStore(this.PENDING_CHANGES_STORE, {
            keyPath: 'id',
          });
          pendingChangesStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });
  }

  private getStore(storeName: string, mode: IDBTransactionMode = 'readonly'): IDBObjectStore {
    if (!this.db) {
      throw new Error('Database not initialized');
    }
    const transaction = this.db.transaction(storeName, mode);
    return transaction.objectStore(storeName);
  }

  public async saveProject(project: Project): Promise<void> {
    try {
      const store = this.getStore(this.PROJECTS_STORE, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put({ ...project, lastModified: new Date().toISOString() });
        request.onerror = () => reject(new Error('Failed to save project'));
        request.onsuccess = () => resolve();
      });
      loggerService.info(`Project ${project.id} saved to IndexedDB`);
    } catch (error) {
      loggerService.error(
        'Error saving project to IndexedDB',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public async getProject(id: string): Promise<Project> {
    try {
      const store = this.getStore(this.PROJECTS_STORE);
      return new Promise((resolve, reject) => {
        const request = store.get(id);
        request.onerror = () => reject(new Error('Failed to get project'));
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      loggerService.error(
        'Error getting project from IndexedDB',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public async listProjects(): Promise<Project[]> {
    try {
      const store = this.getStore(this.PROJECTS_STORE);
      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(new Error('Failed to list projects'));
        request.onsuccess = () => resolve(request.result);
      });
    } catch (error) {
      loggerService.error(
        'Error listing projects from IndexedDB',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public async deleteProject(id: string): Promise<void> {
    try {
      const store = this.getStore(this.PROJECTS_STORE, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.delete(id);
        request.onerror = () => reject(new Error('Failed to delete project'));
        request.onsuccess = () => resolve();
      });
      loggerService.info(`Project ${id} deleted from IndexedDB`);
    } catch (error) {
      loggerService.error(
        'Error deleting project from IndexedDB',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public async queueChange(change: PendingChange): Promise<void> {
    try {
      const store = this.getStore(this.PENDING_CHANGES_STORE, 'readwrite');
      await new Promise<void>((resolve, reject) => {
        const request = store.put(change);
        request.onerror = () => reject(new Error('Failed to queue change'));
        request.onsuccess = () => resolve();
      });
      loggerService.info(`Change queued for project ${change.id}`);
    } catch (error) {
      loggerService.error(
        'Error queuing change',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }

  public async processPendingChanges(): Promise<void> {
    try {
      const store = this.getStore(this.PENDING_CHANGES_STORE, 'readwrite');
      const changes = await new Promise<PendingChange[]>((resolve, reject) => {
        const request = store.getAll();
        request.onerror = () => reject(new Error('Failed to get pending changes'));
        request.onsuccess = () => resolve(request.result);
      });

      for (const change of changes) {
        try {
          switch (change.type) {
            case 'create':
            case 'update':
              await this.saveProject(change.data);
              break;
            case 'delete':
              await this.deleteProject(change.id);
              break;
          }

          // Remove processed change
          await new Promise<void>((resolve, reject) => {
            const deleteRequest = store.delete(change.id);
            deleteRequest.onerror = () => reject(new Error('Failed to remove processed change'));
            deleteRequest.onsuccess = () => resolve();
          });
        } catch (error) {
          loggerService.error(
            `Error processing change for project ${change.id}`,
            error instanceof Error ? error : new Error(String(error))
          );
          // Increment retry count
          change.retryCount++;
          if (change.retryCount <= 3) {
            await this.queueChange(change);
          } else {
            loggerService.error(`Giving up on change for project ${change.id} after 3 retries`);
          }
        }
      }
    } catch (error) {
      loggerService.error(
        'Error processing pending changes',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

export const indexedDBStorageService = IndexedDBStorageService.getInstance();
