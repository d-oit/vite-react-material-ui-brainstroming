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
  description?: string;
  colors: {
    [key: string]: string;
  };
  isDefault?: boolean;
  isCustom?: boolean;
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
  touchOptimized?: boolean;
  customColors?: {
    [NodeType.IDEA]?: string;
    [NodeType.TASK]?: string;
    [NodeType.NOTE]?: string;
    [NodeType.RESOURCE]?: string;
  };
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'critical';
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

      request.onerror = event => {
        console.error('Error opening IndexedDB:', event);
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = event => {
        this.db = (event.target as IDBOpenDBRequest).result;
        this.isInitialized = true;
        console.log('IndexedDB initialized successfully');
        resolve(true);
      };

      request.onupgradeneeded = event => {
        const db = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;
        const transaction = (event.target as IDBOpenDBRequest).transaction;

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

        // Initialize with default data using the existing transaction
        this.initializeDefaultData(db, transaction);
      };
    });

    return this.initPromise;
  }

  /**
   * Initialize the database with default data
   * @param db Database instance
   * @param transaction Optional existing transaction to use
   */
  private initializeDefaultData(db: IDBDatabase, transaction?: IDBTransaction): void {
    try {
      // Add default color schemes
      let colorStore: IDBObjectStore;
      let nodePreferencesStore: IDBObjectStore;

      // Use the provided transaction if available, otherwise create new ones
      if (transaction && transaction.objectStoreNames.contains(STORES.COLORS)) {
        colorStore = transaction.objectStore(STORES.COLORS);
      } else {
        // This will only be used outside of onupgradeneeded
        colorStore = db.transaction(STORES.COLORS, 'readwrite').objectStore(STORES.COLORS);
      }

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

      // Use try-catch for each operation to handle potential errors
      try {
        colorStore.add(defaultColorScheme);
      } catch (error) {
        console.warn('Could not add default color scheme, may already exist:', error);
      }

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

      try {
        colorStore.add(darkColorScheme);
      } catch (error) {
        console.warn('Could not add dark color scheme, may already exist:', error);
      }

      // Add default node preferences
      if (transaction && transaction.objectStoreNames.contains(STORES.NODE_PREFERENCES)) {
        nodePreferencesStore = transaction.objectStore(STORES.NODE_PREFERENCES);
      } else {
        // This will only be used outside of onupgradeneeded
        nodePreferencesStore = db
          .transaction(STORES.NODE_PREFERENCES, 'readwrite')
          .objectStore(STORES.NODE_PREFERENCES);
      }

      const defaultNodePreferences: NodePreferences = {
        defaultSize: 'medium',
        defaultColorScheme: 'default',
        nodeSizes: {
          small: { width: 150, fontSize: 0.8 },
          medium: { width: 200, fontSize: 1 },
          large: { width: 250, fontSize: 1.2 },
        },
        touchOptimized: false,
        customColors: {
          [NodeType.IDEA]: '#e3f2fd', // Light blue
          [NodeType.TASK]: '#e8f5e9', // Light green
          [NodeType.NOTE]: '#fff8e1', // Light yellow
          [NodeType.RESOURCE]: '#f3e5f5', // Light purple
        },
      };

      try {
        nodePreferencesStore.add({ id: 'default', ...defaultNodePreferences });
      } catch (error) {
        console.warn('Could not add default node preferences, may already exist:', error);
      }
    } catch (error) {
      console.error('Error initializing default data:', error);
    }
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

      request.onerror = event => {
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

      request.onerror = event => {
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

      request.onerror = event => {
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

      request.onerror = event => {
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
      this.getColorScheme(id).then(colorScheme => {
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

        request.onerror = event => {
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
            touchOptimized: false,
            customColors: {
              [NodeType.IDEA]: '#e3f2fd', // Light blue
              [NodeType.TASK]: '#e8f5e9', // Light green
              [NodeType.NOTE]: '#fff8e1', // Light yellow
              [NodeType.RESOURCE]: '#f3e5f5', // Light purple
            },
          });
        }
      };

      request.onerror = event => {
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

      request.onerror = event => {
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

      request.onerror = event => {
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

      request.onerror = event => {
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

        request.onerror = event => {
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

      request.onerror = event => {
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
    level: 'debug' | 'info' | 'warn' | 'error' | 'critical',
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

      request.onerror = event => {
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
  public async getLogs(
    level?: 'debug' | 'info' | 'warn' | 'error' | 'critical',
    limit = 100
  ): Promise<LogEntry[]> {
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
        const logs = request.result.sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        resolve(logs);
      };

      request.onerror = event => {
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

              deleteRequest.onerror = event => {
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

        request.onerror = event => {
          console.error('Error getting logs for deletion:', event);
          reject(new Error('Failed to get logs for deletion'));
        };
      } else {
        // Clear all logs
        const request = store.clear();

        request.onsuccess = () => {
          resolve();
        };

        request.onerror = event => {
          console.error('Error clearing logs:', event);
          reject(new Error('Failed to clear logs'));
        };
      }
    });
  }

  /**
   * Set encryption password for secure data
   * @param password Password to use for encryption
   */
  public setEncryptionPassword(password: string): void {
    this.encryptionPassword = password;
  }

  /**
   * Check if encryption is available and configured
   * @returns True if encryption is available and password is set
   */
  public isEncryptionConfigured(): boolean {
    return this.encryptionAvailable && this.encryptionPassword !== null;
  }

  /**
   * Store secure data with encryption
   * @param key Unique key for the data
   * @param data Data to store securely
   * @returns Promise that resolves when the data is stored
   */
  public async storeSecureData(key: string, data: unknown): Promise<void> {
    await this.init();

    if (!this.isEncryptionConfigured()) {
      throw new Error('Encryption is not available or password is not set');
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      // Check if the key already exists
      const transaction = this.db.transaction(STORES.SECURE_STORE, 'readwrite');
      const store = transaction.objectStore(STORES.SECURE_STORE);
      const index = store.index('key');
      const request = index.get(key);

      request.onsuccess = async () => {
        try {
          const now = new Date().toISOString();
          const encryptedData = await encrypt(data, this.encryptionPassword!);

          if (request.result) {
            // Update existing entry
            const updatedData: SecureData = {
              ...request.result,
              data: encryptedData,
              updatedAt: now,
            };

            const updateRequest = store.put(updatedData);

            updateRequest.onsuccess = () => resolve();
            updateRequest.onerror = event => {
              console.error('Error updating secure data:', event);
              reject(new Error('Failed to update secure data'));
            };
          } else {
            // Create new entry
            const newData: SecureData = {
              id: crypto.randomUUID(),
              key,
              data: encryptedData,
              createdAt: now,
              updatedAt: now,
            };

            const addRequest = store.add(newData);

            addRequest.onsuccess = () => resolve();
            addRequest.onerror = event => {
              console.error('Error adding secure data:', event);
              reject(new Error('Failed to add secure data'));
            };
          }
        } catch (error) {
          console.error('Error encrypting data:', error);
          reject(new Error('Failed to encrypt data'));
        }
      };

      request.onerror = event => {
        console.error('Error getting secure data:', event);
        reject(new Error('Failed to get secure data'));
      };
    });
  }

  /**
   * Retrieve secure data with decryption
   * @param key Key of the data to retrieve
   * @returns Promise that resolves with the decrypted data
   */
  public async getSecureData<T>(key: string): Promise<T | null> {
    await this.init();

    if (!this.isEncryptionConfigured()) {
      throw new Error('Encryption is not available or password is not set');
    }

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SECURE_STORE, 'readonly');
      const store = transaction.objectStore(STORES.SECURE_STORE);
      const index = store.index('key');
      const request = index.get(key);

      request.onsuccess = async () => {
        if (!request.result) {
          resolve(null);
          return;
        }

        try {
          const secureData = request.result as SecureData;
          const decryptedData = await decrypt<T>(secureData.data, this.encryptionPassword!);
          resolve(decryptedData);
        } catch (error) {
          console.error('Error decrypting data:', error);
          reject(new Error('Failed to decrypt data'));
        }
      };

      request.onerror = event => {
        console.error('Error getting secure data:', event);
        reject(new Error('Failed to get secure data'));
      };
    });
  }

  /**
   * Delete secure data
   * @param key Key of the data to delete
   * @returns Promise that resolves when the data is deleted
   */
  public async deleteSecureData(key: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.SECURE_STORE, 'readwrite');
      const store = transaction.objectStore(STORES.SECURE_STORE);
      const index = store.index('key');
      const request = index.get(key);

      request.onsuccess = () => {
        if (!request.result) {
          resolve(); // Nothing to delete
          return;
        }

        const secureData = request.result as SecureData;
        const deleteRequest = store.delete(secureData.id);

        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = event => {
          console.error('Error deleting secure data:', event);
          reject(new Error('Failed to delete secure data'));
        };
      };

      request.onerror = event => {
        console.error('Error getting secure data for deletion:', event);
        reject(new Error('Failed to get secure data for deletion'));
      };
    });
  }

  /**
   * Add an entry to the offline queue
   * @param operation Operation name
   * @param data Operation data
   * @param priority Priority (higher number = higher priority)
   * @returns Promise that resolves when the entry is added
   */
  public async addToOfflineQueue(operation: string, data: unknown, priority = 0): Promise<string> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);

      const entry: OfflineQueueEntry = {
        id: crypto.randomUUID(),
        operation,
        data,
        timestamp: new Date().toISOString(),
        retries: 0,
        priority,
      };

      const request = store.add(entry);

      request.onsuccess = () => resolve(entry.id);
      request.onerror = event => {
        console.error('Error adding to offline queue:', event);
        reject(new Error('Failed to add to offline queue'));
      };
    });
  }

  /**
   * Get entries from the offline queue
   * @param limit Maximum number of entries to return
   * @returns Promise that resolves with queue entries
   */
  public async getOfflineQueue(limit = 100): Promise<OfflineQueueEntry[]> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.OFFLINE_QUEUE, 'readonly');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const request = store.getAll(null, limit);

      request.onsuccess = () => {
        // Sort by priority (descending) and then by timestamp (ascending)
        const entries = request.result.sort((a, b) => {
          if (a.priority !== b.priority) {
            return b.priority - a.priority; // Higher priority first
          }
          return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
        });

        resolve(entries);
      };

      request.onerror = event => {
        console.error('Error getting offline queue:', event);
        reject(new Error('Failed to get offline queue'));
      };
    });
  }

  /**
   * Remove an entry from the offline queue
   * @param id Entry ID
   * @returns Promise that resolves when the entry is removed
   */
  public async removeFromOfflineQueue(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = event => {
        console.error(`Error removing entry ${id} from offline queue:`, event);
        reject(new Error(`Failed to remove entry ${id} from offline queue`));
      };
    });
  }

  /**
   * Update retry count for an offline queue entry
   * @param id Entry ID
   * @returns Promise that resolves when the entry is updated
   */
  public async incrementOfflineQueueRetry(id: string): Promise<void> {
    await this.init();

    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized'));
        return;
      }

      const transaction = this.db.transaction(STORES.OFFLINE_QUEUE, 'readwrite');
      const store = transaction.objectStore(STORES.OFFLINE_QUEUE);
      const request = store.get(id);

      request.onsuccess = () => {
        if (!request.result) {
          reject(new Error(`Entry ${id} not found in offline queue`));
          return;
        }

        const entry = request.result as OfflineQueueEntry;
        entry.retries += 1;

        const updateRequest = store.put(entry);

        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = event => {
          console.error(`Error updating retry count for entry ${id}:`, event);
          reject(new Error(`Failed to update retry count for entry ${id}`));
        };
      };

      request.onerror = event => {
        console.error(`Error getting entry ${id} from offline queue:`, event);
        reject(new Error(`Failed to get entry ${id} from offline queue`));
      };
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
