import { NodeType } from '../types';
import { encrypt, decrypt, isEncryptionAvailable } from '../utils/encryption';

// Database configuration
const DB_NAME = 'doitBrainstorming';
const DB_VERSION = 3; // Increased for schema migration

// Store names
const STORES = {
  SETTINGS: 'settings',
  COLORS: 'colors',
  NODE_PREFERENCES: 'nodePreferences',
  LOGS: 'logs',
  SECURE_STORE: 'secureStore',
  PROJECTS: 'projects',
  PROJECT_HISTORY: 'projectHistory',
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
  private fallbackStorage: Map<string, any> = new Map();
  private isIndexedDBSupported = typeof window !== 'undefined' && !!window.indexedDB;

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
   * Initialize the database with improved error handling
   * @returns Promise that resolves when the database is ready
   */
  public async init(): Promise<boolean> {
    if (this.isInitialized && this.db) {
      return true;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    // Check for private browsing mode in Safari which doesn't support IndexedDB
    if (this.isPrivateBrowsingMode()) {
      console.warn('Private browsing mode detected, IndexedDB may not be available');
      this.notifyStorageUnavailable('private_browsing');
      return false;
    }

    this.initPromise = new Promise(resolve => {
      try {
        if (!this.isIndexedDBSupported) {
          console.warn('IndexedDB is not supported in this browser, using fallback storage');
          this.isInitialized = false;
          this.notifyStorageUnavailable('not_supported');
          resolve(false);
          return;
        }

        // Set a timeout to detect if IndexedDB is taking too long (might be blocked)
        const timeoutId = setTimeout(() => {
          console.warn('IndexedDB initialization timed out, may be blocked');
          this.notifyStorageUnavailable('timeout');
          resolve(false);
        }, 5000); // 5 second timeout

        const request = window.indexedDB.open(DB_NAME, DB_VERSION);

        // Handle database upgrades
        request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
          this.handleDatabaseUpgrade(event);
        };

        request.onerror = (event: Event) => {
          clearTimeout(timeoutId);
          const error = (event.target as IDBOpenDBRequest).error;
          console.error('Error opening IndexedDB:', error?.name, error?.message);
          this.isInitialized = false;

          // Check for quota exceeded error
          if (error?.name === 'QuotaExceededError') {
            this.notifyStorageUnavailable('quota_exceeded');
          } else {
            this.notifyStorageUnavailable('error');
          }

          // Don't reject, just resolve with false to prevent cascading errors
          resolve(false);
        };

        request.onsuccess = (event: Event) => {
          clearTimeout(timeoutId);
          this.db = (event.target as IDBOpenDBRequest).result;
          this.isInitialized = true;
          console.log('IndexedDB initialized successfully');

          // Set up error handler for database
          this.db.onerror = event => {
            console.error('IndexedDB error:', (event.target as IDBDatabase).error);
          };

          // Test database by writing and reading a small value
          this.testDatabaseAccess().then(isWorking => {
            if (!isWorking) {
              console.error('IndexedDB test failed, database may be corrupted');
              this.notifyStorageUnavailable('corrupted');
              this.isInitialized = false;
              resolve(false);
              return;
            }

            resolve(true);
          });
        };
      } catch (error) {
        console.error('Error initializing IndexedDB:', error);
        this.isInitialized = false;
        this.notifyStorageUnavailable('error');
        resolve(false);
      }
    });

    return this.initPromise;
  }

  /**
   * Test if we're in private browsing mode
   * @returns True if in private browsing mode
   */
  private isPrivateBrowsingMode(): boolean {
    // This is a best-effort detection, not 100% reliable
    try {
      // Safari private mode detection
      if (window.safari) {
        const storage = window.localStorage;
        if (storage) {
          storage.setItem('test', '1');
          storage.removeItem('test');
        } else {
          return true; // localStorage is null in Safari private mode
        }
      }

      // Firefox private mode detection (old method)
      if (navigator.userAgent.includes('Firefox')) {
        // In Firefox private mode, indexedDB.open returns null
        const db = window.indexedDB.open('test');
        if (!db) {
          return true;
        }
      }

      return false;
    } catch (e) {
      // If we get a security exception, we're probably in private mode
      return true;
    }
  }

  /**
   * Test database access by writing and reading a small value
   * @returns Promise that resolves with true if test passed
   */
  private async testDatabaseAccess(): Promise<boolean> {
    if (!this.db) return false;

    try {
      const testKey = '_db_test_' + Date.now();
      const testValue = { timestamp: Date.now() };

      // Try to write to the settings store
      const writeResult = await new Promise<boolean>(resolve => {
        try {
          const transaction = this.db!.transaction([STORES.SETTINGS], 'readwrite');
          const store = transaction.objectStore(STORES.SETTINGS);

          const request = store.put({ key: testKey, value: testValue });

          request.onsuccess = () => resolve(true);
          request.onerror = () => {
            console.error('Test write failed:', request.error);
            resolve(false);
          };
        } catch (error) {
          console.error('Error during test write transaction:', error);
          resolve(false);
        }
      });

      if (!writeResult) return false;

      // Try to read it back
      const readResult = await new Promise<boolean>(resolve => {
        try {
          const transaction = this.db!.transaction([STORES.SETTINGS], 'readonly');
          const store = transaction.objectStore(STORES.SETTINGS);

          const request = store.get(testKey);

          request.onsuccess = () => {
            const data = request.result;
            resolve(data && data.value && data.value.timestamp === testValue.timestamp);
          };

          request.onerror = () => {
            console.error('Test read failed:', request.error);
            resolve(false);
          };
        } catch (error) {
          console.error('Error during test read transaction:', error);
          resolve(false);
        }
      });

      // Clean up the test key
      try {
        const transaction = this.db!.transaction([STORES.SETTINGS], 'readwrite');
        const store = transaction.objectStore(STORES.SETTINGS);
        store.delete(testKey);
      } catch (e) {
        // Ignore cleanup errors
      }

      return readResult;
    } catch (error) {
      console.error('Database access test failed:', error);
      return false;
    }
  }

  /**
   * Notify the application that storage is unavailable
   * @param reason Reason why storage is unavailable
   */
  private notifyStorageUnavailable(
    reason:
      | 'not_supported'
      | 'private_browsing'
      | 'quota_exceeded'
      | 'timeout'
      | 'corrupted'
      | 'error'
  ): void {
    // Dispatch a custom event that the application can listen for
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const event = new CustomEvent('indexeddb:unavailable', {
        detail: { reason },
      });
      window.dispatchEvent(event);
    }

    // Log the issue
    console.warn(`IndexedDB unavailable: ${reason}. Using fallback storage.`);
  }

  /**
   * Handle database upgrade
   */
  private handleDatabaseUpgrade(event: IDBVersionChangeEvent): void {
    try {
      const db = (event.target as IDBOpenDBRequest).result;
      const oldVersion = event.oldVersion;
      const transaction = (event.target as IDBOpenDBRequest).transaction;

      // Handle schema migrations based on version
      this.applyDatabaseMigrations(db, oldVersion, transaction);
    } catch (error) {
      console.error('Error during database upgrade:', error);
      // Don't throw, as this would abort the transaction
    }
  }

  /**
   * Apply database migrations based on version
   */
  private applyDatabaseMigrations(
    db: IDBDatabase,
    oldVersion: number,
    transaction: IDBTransaction
  ): void {
    // Version 1: Initial schema
    if (oldVersion < 1) {
      this.createInitialStores(db);
    }

    // Version 2: Add secure store and projects
    if (oldVersion < 2) {
      this.addVersion2Stores(db);
    }

    // Version 3: Add project history and offline queue
    if (oldVersion < 3) {
      this.addVersion3Stores(db);
      this.updateProjectsStore(transaction);
    }

    // Initialize with default data using the existing transaction
    this.initializeDefaultData(db, transaction);
  }

  /**
   * Create initial stores for version 1
   */
  private createInitialStores(db: IDBDatabase): void {
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

  /**
   * Add version 2 stores
   */
  private addVersion2Stores(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORES.SECURE_STORE)) {
      const secureStore = db.createObjectStore(STORES.SECURE_STORE, { keyPath: 'id' });
      secureStore.createIndex('key', 'key', { unique: true });
      secureStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.PROJECTS)) {
      const projectsStore = db.createObjectStore(STORES.PROJECTS, { keyPath: 'id' });
      projectsStore.createIndex('updatedAt', 'updatedAt', { unique: false });
    }
  }

  /**
   * Add version 3 stores
   */
  private addVersion3Stores(db: IDBDatabase): void {
    if (!db.objectStoreNames.contains(STORES.PROJECT_HISTORY)) {
      const historyStore = db.createObjectStore(STORES.PROJECT_HISTORY, {
        keyPath: ['projectId', 'timestamp'],
      });
      historyStore.createIndex('projectId', 'projectId', { unique: false });
      historyStore.createIndex('timestamp', 'timestamp', { unique: false });
      historyStore.createIndex('action', 'action', { unique: false });
    }

    if (!db.objectStoreNames.contains(STORES.OFFLINE_QUEUE)) {
      const queueStore = db.createObjectStore(STORES.OFFLINE_QUEUE, {
        keyPath: 'id',
        autoIncrement: true,
      });
      queueStore.createIndex('timestamp', 'timestamp', { unique: false });
      queueStore.createIndex('type', 'type', { unique: false });
    }
  }

  /**
   * Update projects store with new indexes
   */
  private updateProjectsStore(transaction: IDBTransaction): void {
    try {
      // Update PROJECTS store with new indexes if it exists
      if (transaction.objectStoreNames.contains(STORES.PROJECTS)) {
        const projectsStore = transaction.objectStore(STORES.PROJECTS);

        // Add new indexes if they don't exist
        if (!projectsStore.indexNames.contains('isArchived')) {
          projectsStore.createIndex('isArchived', 'isArchived', { unique: false });
        }

        if (!projectsStore.indexNames.contains('lastAccessedAt')) {
          projectsStore.createIndex('lastAccessedAt', 'lastAccessedAt', { unique: false });
        }

        if (!projectsStore.indexNames.contains('tags')) {
          projectsStore.createIndex('tags', 'tags', { unique: false, multiEntry: true });
        }
      }
    } catch (error) {
      console.error('Error updating projects store:', error);
    }
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
    const initialized = await this.init();

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn(`Using fallback storage for getColorScheme(${id})`);

      // Try to get from fallback storage
      const colorScheme = this.fallbackStorage.get(`colorScheme_${id}`);
      if (colorScheme) {
        return colorScheme;
      }

      // Return a default color scheme if not found
      if (id === 'default') {
        const defaultScheme: ColorScheme = {
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
        this.fallbackStorage.set(`colorScheme_${id}`, defaultScheme);
        return defaultScheme;
      }

      return null;
    }

    return new Promise((resolve, reject) => {
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
    const initialized = await this.init();

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn('Using fallback storage for getDefaultColorScheme');

      // Try to get from fallback storage
      const defaultScheme = this.fallbackStorage.get('colorScheme_default');
      if (defaultScheme) {
        return defaultScheme;
      }

      // Create a default color scheme
      const newDefaultScheme: ColorScheme = {
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

      this.fallbackStorage.set('colorScheme_default', newDefaultScheme);
      return newDefaultScheme;
    }

    return new Promise((resolve, reject) => {
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
    const initialized = await this.init();

    // Default preferences to use as fallback
    const defaultPrefs: NodePreferences = {
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

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn('Using fallback storage for getNodePreferences');

      // Try to get from fallback storage
      const prefs = this.fallbackStorage.get('nodePreferences');
      if (prefs) {
        return prefs;
      }

      // Store default preferences in fallback storage
      this.fallbackStorage.set('nodePreferences', defaultPrefs);
      return defaultPrefs;
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(STORES.NODE_PREFERENCES, 'readonly');
      const store = transaction.objectStore(STORES.NODE_PREFERENCES);
      const request = store.get('default');

      request.onsuccess = () => {
        if (request.result) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn(`Database not initialized, returning null for setting: ${key}`);
        resolve(null);
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.SETTINGS, 'readonly');
        const store = transaction.objectStore(STORES.SETTINGS);
        const request = store.get(key);

        request.onsuccess = () => {
          resolve(request.result ? request.result.value : null);
        };

        request.onerror = (event: Event) => {
          console.error(`Error getting setting ${key}:`, event);
          resolve(null); // Return null instead of rejecting
        };
      } catch (error) {
        console.error(`Error in getSetting for ${key}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Save multiple settings
   * @param settings Settings to save
   * @returns Promise that resolves when all settings are saved
   */
  public async saveSettings(settings: Record<string, unknown>): Promise<void> {
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn('Database not initialized, settings will not be saved');
        // Resolve anyway to prevent cascading errors
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.SETTINGS, 'readwrite');
        const store = transaction.objectStore(STORES.SETTINGS);

        let completed = 0;
        let errors = 0;
        const total = Object.keys(settings).length;

        // If there are no settings to save, resolve immediately
        if (total === 0) {
          resolve();
          return;
        }

        for (const [key, value] of Object.entries(settings)) {
          const request = store.put({ key, value });

          request.onsuccess = () => {
            completed++;
            if (completed + errors === total) {
              resolve();
            }
          };

          request.onerror = (event: Event) => {
            console.error(`Error saving setting ${key}:`, event);
            errors++;
            if (completed + errors === total) {
              resolve();
            }
          };
        }
      } catch (error) {
        console.error('Error in saveSettings:', error);
        resolve();
      }
    });
  }

  /**
   * Get all settings
   * @returns Promise that resolves with all settings
   */
  public async getAllSettings(): Promise<Record<string, unknown>> {
    const initialized = await this.init();

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn('Using fallback storage for getAllSettings');

      // Collect all settings from fallback storage
      const settings: Record<string, unknown> = {};
      for (const [key, value] of this.fallbackStorage.entries()) {
        if (key.startsWith('settings_')) {
          settings[key.replace('settings_', '')] = value;
        }
      }

      // Try to get from localStorage as a backup
      try {
        const storedSettings = localStorage.getItem('doitBrainstorming_settings');
        if (storedSettings) {
          const parsedSettings = JSON.parse(storedSettings);
          // Merge with settings from fallback storage
          return { ...parsedSettings, ...settings };
        }
      } catch (error) {
        console.warn('Failed to get settings from localStorage:', error);
      }

      return settings;
    }

    return new Promise((resolve, reject) => {
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
          if (!this.encryptionPassword) {
            reject(new Error('Encryption password not set'));
            return;
          }
          const encryptedData = await encrypt(data, this.encryptionPassword);

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
          if (!this.encryptionPassword) {
            reject(new Error('Encryption password not set'));
            return;
          }
          const decryptedData = await decrypt<T>(secureData.data, this.encryptionPassword);
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

  /**
   * Save a project to IndexedDB
   * @param project Project to save
   * @returns Promise that resolves with the project ID
   */
  public async saveProject(project: Project): Promise<string> {
    const initialized = await this.init();

    // Update the updatedAt timestamp
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString(),
    };

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn(
        `Database not initialized, project ${project.id} will be saved to fallback storage`
      );

      // Store in fallback storage
      this.fallbackStorage.set(`project_${project.id}`, updatedProject);

      // Also try to save to localStorage as a backup
      try {
        localStorage.setItem(
          `doitBrainstorming_project_${project.id}`,
          JSON.stringify(updatedProject)
        );
      } catch (error) {
        console.warn(`Failed to save project ${project.id} to localStorage:`, error);
      }

      return Promise.resolve(project.id);
    }

    return new Promise(resolve => {
      try {
        const transaction = this.db.transaction(STORES.PROJECTS, 'readwrite');
        const store = transaction.objectStore(STORES.PROJECTS);

        const request = store.put(updatedProject);

        request.onsuccess = () => resolve(project.id);
        request.onerror = (event: Event) => {
          console.error('Error saving project:', event);
          // Still return the project ID to prevent cascading errors
          resolve(project.id);
        };
      } catch (error) {
        console.error(`Error in saveProject for ${project.id}:`, error);
        resolve(project.id);
      }
    });
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Promise that resolves with the project or null if not found
   */
  public async getProject(id: string): Promise<Project | null> {
    const initialized = await this.init();

    // Use fallback storage if IndexedDB is not available
    if (!initialized || !this.db) {
      console.warn(`Using fallback storage for getProject(${id})`);

      // Try to get from fallback storage
      const project = this.fallbackStorage.get(`project_${id}`);
      if (project) {
        return project;
      }

      // Try to get from localStorage as a backup
      try {
        const storedProject = localStorage.getItem(`doitBrainstorming_project_${id}`);
        if (storedProject) {
          const parsedProject = JSON.parse(storedProject);
          // Store in fallback for future use
          this.fallbackStorage.set(`project_${id}`, parsedProject);
          return parsedProject;
        }
      } catch (error) {
        console.warn(`Failed to get project ${id} from localStorage:`, error);
      }

      return null;
    }

    return new Promise(resolve => {
      try {
        const transaction = this.db.transaction(STORES.PROJECTS, 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);
        const request = store.get(id);

        request.onsuccess = () => {
          const project = request.result || null;

          // Update lastAccessedAt if project exists
          if (project) {
            this.updateProjectLastAccessed(id).catch(err => {
              console.warn('Failed to update project access time:', err);
            });
          }

          resolve(project);
        };
        request.onerror = (event: Event) => {
          console.error('Error getting project:', event);
          resolve(null);
        };
      } catch (error) {
        console.error(`Error in getProject for ${id}:`, error);
        resolve(null);
      }
    });
  }

  /**
   * Get all projects
   * @param includeArchived Whether to include archived projects
   * @returns Promise that resolves with an array of projects
   */
  public async getAllProjects(includeArchived: boolean = false): Promise<Project[]> {
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn('Database not initialized, returning empty projects array');
        resolve([]);
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.PROJECTS, 'readonly');
        const store = transaction.objectStore(STORES.PROJECTS);
        const request = store.getAll();

        request.onsuccess = () => {
          let projects = request.result || [];

          // Filter out archived projects if not requested
          if (!includeArchived) {
            projects = projects.filter(p => !p.isArchived);
          }

          // Sort by updatedAt (newest first)
          projects.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
          );

          resolve(projects);
        };
        request.onerror = (event: Event) => {
          console.error('Error getting projects:', event);
          resolve([]);
        };
      } catch (error) {
        console.error('Error in getAllProjects:', error);
        resolve([]);
      }
    });
  }

  /**
   * Delete a project
   * @param id Project ID
   * @returns Promise that resolves when the project is deleted
   */
  public async deleteProject(id: string): Promise<void> {
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn(`Database not initialized, project ${id} will not be deleted`);
        // Resolve anyway to prevent cascading errors
        resolve();
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.PROJECTS, 'readwrite');
        const store = transaction.objectStore(STORES.PROJECTS);
        const request = store.delete(id);

        request.onsuccess = () => resolve();
        request.onerror = (event: Event) => {
          console.error('Error deleting project:', event);
          resolve(); // Resolve anyway to prevent cascading errors
        };
      } catch (error) {
        console.error(`Error in deleteProject for ${id}:`, error);
        resolve();
      }
    });
  }

  /**
   * Archive or unarchive a project
   * @param id Project ID
   * @param archive Whether to archive (true) or unarchive (false)
   * @returns Promise that resolves with the updated project
   */
  public async archiveProject(id: string, archive: boolean): Promise<Project | null> {
    const initialized = await this.init();

    if (!initialized) {
      console.warn(`Database not initialized, cannot archive project ${id}`);
      return null;
    }

    try {
      const project = await this.getProject(id);

      if (!project) {
        console.warn(`Project with ID ${id} not found for archiving`);
        return null;
      }

      const updatedProject = {
        ...project,
        isArchived: archive,
        archivedAt: archive ? new Date().toISOString() : undefined,
        updatedAt: new Date().toISOString(),
      };

      await this.saveProject(updatedProject);
      return updatedProject;
    } catch (error) {
      console.error(`Error archiving project ${id}:`, error);
      return null; // Return null instead of throwing to prevent cascading errors
    }
  }

  /**
   * Update the lastAccessedAt timestamp for a project
   * @param id Project ID
   * @returns Promise that resolves when the timestamp is updated
   */
  private async updateProjectLastAccessed(id: string): Promise<void> {
    const initialized = await this.init();

    if (!initialized || !this.db) {
      console.warn('Database not initialized, skipping project access time update');
      return;
    }

    try {
      return new Promise(resolve => {
        try {
          const transaction = this.db.transaction(STORES.PROJECTS, 'readwrite');
          const store = transaction.objectStore(STORES.PROJECTS);
          const request = store.get(id);

          request.onsuccess = () => {
            const project = request.result;
            if (project) {
              project.lastAccessedAt = new Date().toISOString();
              store.put(project);
            }
            resolve();
          };

          request.onerror = (event: Event) => {
            console.error('Error updating project access time:', event);
            resolve(); // Don't reject to prevent cascading errors
          };
        } catch (innerError) {
          console.error(`Error in updateProjectLastAccessed transaction for ${id}:`, innerError);
          resolve();
        }
      });
    } catch (error) {
      console.error(`Error in updateProjectLastAccessed for ${id}:`, error);
      // Don't throw to prevent cascading errors
    }
  }

  /**
   * Add a project history entry
   * @param entry Project history entry
   * @returns Promise that resolves with the entry ID
   */
  public async addProjectHistoryEntry(entry: Omit<ProjectHistoryEntry, 'id'>): Promise<string> {
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn('Database not initialized, project history entry will not be saved');
        // Return a fake ID to prevent cascading errors
        const fakeId = crypto.randomUUID();
        resolve(fakeId);
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.PROJECT_HISTORY, 'readwrite');
        const store = transaction.objectStore(STORES.PROJECT_HISTORY);

        const historyEntry: ProjectHistoryEntry = {
          id: crypto.randomUUID(),
          ...entry,
          timestamp: entry.timestamp || new Date().toISOString(),
        };

        const request = store.add(historyEntry);

        request.onsuccess = () => resolve(historyEntry.id);
        request.onerror = (event: Event) => {
          console.error('Error adding project history entry:', event);
          // Return the ID anyway to prevent cascading errors
          resolve(historyEntry.id);
        };
      } catch (error) {
        console.error('Error in addProjectHistoryEntry:', error);
        // Return a fake ID to prevent cascading errors
        const fakeId = crypto.randomUUID();
        resolve(fakeId);
      }
    });
  }

  /**
   * Get project history entries
   * @param projectId Project ID
   * @param limit Maximum number of entries to return
   * @returns Promise that resolves with an array of history entries
   */
  public async getProjectHistory(projectId: string, limit = 100): Promise<ProjectHistoryEntry[]> {
    const initialized = await this.init();

    return new Promise(resolve => {
      if (!initialized || !this.db) {
        console.warn(`Database not initialized, returning empty history for project: ${projectId}`);
        resolve([]);
        return;
      }

      try {
        const transaction = this.db.transaction(STORES.PROJECT_HISTORY, 'readonly');
        const store = transaction.objectStore(STORES.PROJECT_HISTORY);
        const index = store.index('projectId');
        const request = index.getAll(projectId, limit);

        request.onsuccess = () => {
          // Sort by timestamp descending (newest first)
          const history = request.result.sort(
            (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          );
          resolve(history);
        };
        request.onerror = (event: Event) => {
          console.error('Error getting project history:', event);
          resolve([]); // Return empty array instead of rejecting
        };
      } catch (error) {
        console.error(`Error in getProjectHistory for ${projectId}:`, error);
        resolve([]);
      }
    });
  }
}

// Export singleton instance
const indexedDBService = IndexedDBService.getInstance();
export default indexedDBService;
