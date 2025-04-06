import { NodeType } from '../types';
import { encrypt, decrypt, isEncryptionAvailable } from '../utils/encryption';

// Database configuration
const DB_NAME = 'doitBrainstorming';
const DB_VERSION = 2; // Increased for schema migration

// Store names
const STORES = {
  SETTINGS: 'settings',
  COLORS: 'colors',
  NODE_PREFERENCES: 'nodePreferences',
  LOGS: 'logs',
  SECURE_STORE: 'secureStore',
  PROJECTS: 'projects',
  OFFLINE_QUEUE: 'offlineQueue',
};

// Types for database entities
export interface ColorScheme {
  id: string;
  name: string;
  colors: {
    [key in NodeType]: string;
  };
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NodePreferences {
  defaultSize: 'small' | 'medium' | 'large';
  defaultColorScheme: string;
  nodeSizes: {
    small: { width: number; fontSize: number };
    medium: { width: number; fontSize: number };
    large: { width: number; fontSize: number };
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  context?: Record<string, unknown>;
}

export interface SecureData {
  id: string;
  key: string;
  data: string; // Encrypted data
  createdAt: string;
  updatedAt: string;
}

export interface OfflineQueueEntry {
  id: string;
  operation: string;
  data: unknown;
  timestamp: string;
  retries: number;
  priority: number;
}

/**
 * Service for IndexedDB operations
 */
export class IndexedDBService {
  private static instance: IndexedDBService;
  private db: IDBDatabase | null = null;
  private isInitialized = false;
  private initPromise: Promise<boolean> | null = null;
  private encryptionPassword: string | null = null;
  private encryptionAvailable = isEncryptionAvailable();

  private constructor() {
    // Private constructor for singleton
  }

  public static getInstance(): IndexedDBService {
    if (!IndexedDBService.instance) {
      IndexedDBService.instance = new IndexedDBService();
    }
    return IndexedDBService.instance;
  }

  /**
   * Initialize the database
   * @returns Promise that resolves when the database is ready
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        console.error('IndexedDB is not supported in this browser');
        resolve(false);
        return;
      }

      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = (event) => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        // Handle schema migrations based on version
        if (oldVersion < 1) {
          // Create initial stores for version 1
          if (!db.objectStoreNames.contains(STORES.SETTINGS)) {
            db.createObjectStore(STORES.SETTINGS, { keyPath: 'key' });
          }

          if (!db.objectStoreNames.contains(STORES.COLORS)) {
            const colorStore = db.createObjectStore(STORES.COLORS, { keyPath: 'id' });
            colorStore.createIndex('name', 'name', { unique: true });
            colorStore.createIndex('isDefault', 'isDefault', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.NODE_PREFERENCES)) {
            db.createObjectStore(STORES.NODE_PREFERENCES, { keyPath: 'id' });
          }

          if (!db.objectStoreNames.contains(STORES.LOGS)) {
            const logStore = db.createObjectStore(STORES.LOGS, { keyPath: 'id' });
            logStore.createIndex('timestamp', 'timestamp', { unique: false });
            logStore.createIndex('level', 'level', { unique: false });
          }
        }

        if (oldVersion < 2) {
          // Add new stores for version 2
          if (!db.objectStoreNames.contains(STORES.SECURE_STORE)) {
            const secureStore = db.createObjectStore(STORES.SECURE_STORE, { keyPath: 'id' });
            secureStore.createIndex('key', 'key', { unique: true });
            secureStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
            const projectsStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
            projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
          }

          if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
            const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, { keyPath: 'id' });
            queueStore.createIndex('timestamp', 'timestamp', { unique: false });
            queueStore.createIndex('priority', 'priority', { unique: false });
          }
        }

        // Initialize with default data
        this.initializeDefaultData(db);
      };
    });

    return this.initPromise;
  }

  /**
   * Initialize the database with default data
   * @param db Database instance
   */
  private initializeDefaultData(db: IDBDatabase): void {
    // Add default color schemes
    const colorStore = db.transaction(STORES.COLORS, 'readwrite').objectStore(STORES.COLORS);

    const defaultColorScheme: ColorScheme = {
      id: 'default',
      name: 'Default',
      colors: {
        [NodeType.IDEA]: '#e3f2fd', // Light blue
        [NodeType.TASK]: '#e8f5e9', // Light green
        [NodeType.NOTE]: '#fff8e1', // Light yellow
        [NodeType.RESOURCE]: '#f3e5f5', // Light purple
      },
      isDefault: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    colorStore.add(defaultColorScheme);

    // Add dark theme color scheme
    const darkColorScheme: ColorScheme = {
      id: 'dark',
      name: 'Dark Theme',
      colors: {
        [NodeType.IDEA]: '#0d47a1', // Dark blue
        [NodeType.TASK]: '#1b5e20', // Dark green
        [NodeType.NOTE]: '#f57f17', // Dark yellow
        [NodeType.RESOURCE]: '#4a148c', // Dark purple
      },
      isDefault: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    colorStore.add(darkColorScheme);

    // Add default node preferences
    const nodePreferencesStore = db.transaction(STORES.NODE_PREFERENCES, 'readwrite').objectStore(STORES.NODE_PREFERENCES);

    const defaultNodePreferences: NodePreferences = {
      defaultSize: 'medium',
      defaultColorScheme: 'default',
      nodeSizes: {
        small: { width: 150, fontSize: 0.8 },
        medium: { width: 200, fontSize: 1 },
        large: { width: 250, fontSize: 1.2 },
      },
    };

    nodePreferencesStore.add({ id: 'default', ...defaultNodePreferences });
  }

  /**
   * Get all color schemes
   * @returns Promise that resolves with all color schemes
   */
  public async getColorSchemes(): Promise<ColorScheme[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.COLORS, 'readonly');
      const store = transaction.objectStore(STORES.COLORS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        console.error('Error getting color schemes:', event);
        reject(new Error('Failed to get color schemes'));
      };
    });
  }

  /**
   * Get a color scheme by ID
   * @param id Color scheme ID
   * @returns Promise that resolves with the color scheme
   */
  public async getColorScheme(id: string): Promise<ColorScheme | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.COLORS, 'readonly');
      const store = transaction.objectStore(STORES.COLORS);
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error(`Error getting color scheme ${id}:`, event);
        reject(new Error(`Failed to get color scheme ${id}`));
      };
    });
  }

  /**
   * Get the default color scheme
   * @returns Promise that resolves with the default color scheme
   */
  public async getDefaultColorScheme(): Promise<ColorScheme | null> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.COLORS, 'readonly');
      const store = transaction.objectStore(STORES.COLORS);
      const index = store.index('isDefault');
      const request = index.get(true);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = (event) => {
        console.error('Error getting default color scheme:', event);
        reject(new Error('Failed to get default color scheme'));
      };
    });
  }

  /**
   * Save a color scheme
   * @param colorScheme Color scheme to save
   * @returns Promise that resolves when the color scheme is saved
   */
  public async saveColorScheme(colorScheme: ColorScheme): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.COLORS, 'readwrite');
      const store = transaction.objectStore(STORES.COLORS);

      // Update the updatedAt timestamp
      colorScheme.updatedAt = new Date().toISOString();

      const request = store.put(colorScheme);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error saving color scheme:', event);
        reject(new Error('Failed to save color scheme'));
      };
    });
  }

  /**
   * Delete a color scheme
   * @param id Color scheme ID
   * @returns Promise that resolves when the color scheme is deleted
   */
  public async deleteColorScheme(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Don't allow deleting the default color scheme
      this.getColorScheme(id).then((colorScheme) => {
        if (colorScheme?.isDefault) {
          reject(new Error('Cannot delete the default color scheme'));
          return;
        }

        const transaction = this.db.transaction(STORES.COLORS, 'readwrite');
        const store = transaction.objectStore(STORES.COLORS);
        const request = store.delete(id);

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error(`Error deleting color scheme ${id}:`, event);
          reject(new Error(`Failed to delete color scheme ${id}`));
        };
      });
    });
  }

  /**
   * Get node preferences
   * @returns Promise that resolves with node preferences
   */
  public async getNodePreferences(): Promise<NodePreferences> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.NODE_PREFERENCES, 'readonly');
      const store = transaction.objectStore(STORES.NODE_PREFERENCES);
      const request = store.get('default');

      request.onsuccess = () => {
        if (request.result) {
          const { id, ...preferences } = request.result;
          resolve(preferences as NodePreferences);
        } else {
          // Return default preferences if none are found
          resolve({
            defaultSize: 'medium',
            defaultColorScheme: 'default',
            nodeSizes: {
              small: { width: 150, fontSize: 0.8 },
              medium: { width: 200, fontSize: 1 },
              large: { width: 250, fontSize: 1.2 },
            },
          });
        }
      };

      request.onerror = (event) => {
        console.error('Error getting node preferences:', event);
        reject(new Error('Failed to get node preferences'));
      };
    });
  }

  /**
   * Save node preferences
   * @param preferences Node preferences to save
   * @returns Promise that resolves when the preferences are saved
   */
  public async saveNodePreferences(preferences: NodePreferences): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.NODE_PREFERENCES, 'readwrite');
      const store = transaction.objectStore(STORES.NODE_PREFERENCES);
      const request = store.put({ id: 'default', ...preferences });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error saving node preferences:', event);
        reject(new Error('Failed to save node preferences'));
      };
    });
  }

  /**
   * Save a setting
   * @param key Setting key
   * @param value Setting value
   * @returns Promise that resolves when the setting is saved
   */
  public async saveSetting(key: string, value: unknown): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.put({ key, value });

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error(`Error saving setting ${key}:`, event);
        reject(new Error(`Failed to save setting ${key}`));
      };
    });
  }

  /**
   * Get a setting
   * @param key Setting key
   * @returns Promise that resolves with the setting value
   */
  public async getSetting(key: string): Promise<unknown> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.get(key);

      request.onsuccess = () => {
        resolve(request.result ? request.result.value : null);
      };

      request.onerror = (event) => {
        console.error(`Error getting setting ${key}:`, event);
        reject(new Error(`Failed to get setting ${key}`));
      };
    });
  }

  /**
   * Save multiple settings
   * @param settings Settings to save
   * @returns Promise that resolves when all settings are saved
   */
  public async saveSettings(settings: Record<string, unknown>): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SETTINGS, 'readwrite');
      const store = transaction.objectStore(STORES.SETTINGS);

      let completed = 0;
      const total = Object.keys(settings).length;

      for (const [key, value] of Object.entries(settings)) {
        const request = store.put({ key, value });

        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };

        request.onerror = (event) => {
          console.error(`Error saving setting ${key}:`, event);
          reject(new Error(`Failed to save setting ${key}`));
        };
      }

      // If there are no settings to save, resolve immediately
      if (total === 0) {
        resolve();
      }
    });
  }

  /**
   * Get all settings
   * @returns Promise that resolves with all settings
   */
  public async getAllSettings(): Promise<Record<string, unknown>> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SETTINGS, 'readonly');
      const store = transaction.objectStore(STORES.SETTINGS);
      const request = store.getAll();

      request.onsuccess = () => {
        const settings: Record<string, unknown> = {};
        for (const item of request.result) {
          settings[item.key] = item.value;
        }
        resolve(settings);
      };

      request.onerror = (event) => {
        console.error('Error getting all settings:', event);
        reject(new Error('Failed to get all settings'));
      };
    });
  }

  /**
   * Add a log entry
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   * @returns Promise that resolves when the log is saved
   */
  public async log(
    level: 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.LOGS, 'readwrite');
      const store = transaction.objectStore(STORES.LOGS);

      const logEntry: LogEntry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        level,
        message,
        context,
      };

      const request = store.add(logEntry);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        console.error('Error adding log entry:', event);
        // Don't reject here to prevent cascading errors
        resolve();
      };
    });
  }

  /**
   * Get logs by level
   * @param level Log level
   * @param limit Maximum number of logs to return
   * @returns Promise that resolves with logs
   */
  public async getLogs(level?: 'info' | 'warn' | 'error', limit = 100): Promise<LogEntry[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.LOGS, 'readonly');
      const store = transaction.objectStore(STORES.LOGS);

      let request: IDBRequest;

      if (level) {
        const index = store.index('level');
        request = index.getAll(level, limit);
      } else {
        request = store.getAll(null, limit);
      }

      request.onsuccess = () => {
        // Sort by timestamp descending (newest first)
        const logs = request.result.sort((a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(logs);
      };

      request.onerror = (event) => {
        console.error('Error getting logs:', event);
        reject(new Error('Failed to get logs'));
      };
    });
  }

  /**
   * Clear logs
   * @param olderThan Clear logs older than this date
   * @returns Promise that resolves when logs are cleared
   */
  public async clearLogs(olderThan?: Date): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.LOGS, 'readwrite');
      const store = transaction.objectStore(STORES.LOGS);

      if (olderThan) {
        // Get all logs and delete the ones older than the specified date
        const request = store.getAll();

        request.onsuccess = () => {
          const logs = request.result;
          const olderThanTimestamp = olderThan.getTime();

          let completed = 0;
          let total = 0;

          for (const log of logs) {
            const logTimestamp = new Date(log.timestamp).getTime();
            if (logTimestamp < olderThanTimestamp) {
              total++;
              const deleteRequest = store.delete(log.id);

              deleteRequest.onsuccess = () => {
                completed++;
                if (completed === total) {
                  resolve();
                }
              };

              deleteRequest.onerror = (event) => {
                console.error(`Error deleting log ${log.id}:`, event);
                // Continue with other deletions
              };
            }
          }

          // If there are no logs to delete, resolve immediately
          if (total === 0) {
            resolve();
          }
        };

        request.onerror = (event) => {
          console.error('Error getting logs for deletion:', event);
          reject(new Error('Failed to get logs for deletion'));
        };
      } else {
        // Clear all logs
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = (event) => {
          console.error('Error clearing logs:', event);
          reject(new Error('Failed to clear logs'));
        };
      }
    });
  }

  /**
   * Export all data from the database
   * @returns Promise that resolves with all data
   */
  public async exportData(): Promise<Record<string, unknown>> {
    await this.init();

    const data: Record<string, unknown> = {};

    // Get all settings
    data.settings = await this.getAllSettings();

    // Get all color schemes
    data.colorSchemes = await this.getColorSchemes();

    // Get node preferences
    data.nodePreferences = await this.getNodePreferences();

    return data;
  }

  /**
   * Import data into the database
   * @param data Data to import
   * @returns Promise that resolves when data is imported
   */
  public async importData(data: Record<string, unknown>): Promise<void> {
    await this.init();

    // Import settings
    if (data.settings && typeof data.settings === 'object') {
      await this.saveSettings(data.settings as Record<string, unknown>);
    }

    // Import color schemes
    if (data.colorSchemes && Array.isArray(data.colorSchemes)) {
      for (const colorScheme of data.colorSchemes) {
        await this.saveColorScheme(colorScheme as ColorScheme);
      }
    }

    // Import node preferences
    if (data.nodePreferences && typeof data.nodePreferences === 'object') {
      await this.saveNodePreferences(data.nodePreferences as NodePreferences);
    }
  }
}

// Export singleton instance
const indexedDBService = IndexedDBService.getInstance();
export default indexedDBService;
