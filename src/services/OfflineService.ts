/**
 * Service for managing offline status and synchronization
 */
export class OfflineService {
  private static instance: OfflineService;
  private isOnline: boolean = navigator.onLine;
  private listeners: Array<(online: boolean) => void> = [];
  private syncQueue: Array<() => Promise<void>> = [];
  private syncInProgress: boolean = false;
  private maxRetries: number = 5;
  private syncInterval: number = 60000; // 1 minute
  private syncIntervalId: number | null = null;

  private constructor() {
    // Initialize online/offline event listeners
    window.addEventListener('online', this.handleOnlineStatusChange.bind(this));
    window.addEventListener('offline', this.handleOnlineStatusChange.bind(this));
  }

  public static getInstance(): OfflineService {
    if (!OfflineService.instance) {
      OfflineService.instance = new OfflineService();
    }
    return OfflineService.instance;
  }

  /**
   * Get current online status
   * @returns True if online, false if offline
   */
  public getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add a listener for online status changes
   * @param listener Function to call when online status changes
   * @returns Function to remove the listener
   */
  public addOnlineStatusListener(listener: (online: boolean) => void): () => void {
    this.listeners.push(listener);
    // Immediately call with current status
    listener(this.isOnline);
    
    // Return function to remove listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Add an operation to the sync queue
   * @param operation Function to execute when online
   */
  public addToSyncQueue(operation: () => Promise<void>): void {
    this.syncQueue.push(operation);
    
    // If we're online, try to sync immediately
    if (this.isOnline && !this.syncInProgress) {
      this.processSyncQueue();
    }
  }

  /**
   * Start automatic synchronization
   */
  public startAutoSync(): void {
    if (this.syncIntervalId !== null) {
      return; // Already started
    }
    
    this.syncIntervalId = window.setInterval(() => {
      if (this.isOnline && !this.syncInProgress) {
        this.processSyncQueue();
      }
    }, this.syncInterval);
  }

  /**
   * Stop automatic synchronization
   */
  public stopAutoSync(): void {
    if (this.syncIntervalId !== null) {
      window.clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }
  }

  /**
   * Configure the sync service
   * @param config Configuration options
   */
  public configure(config: {
    syncInterval?: number;
    maxRetries?: number;
    autoSync?: boolean;
  }): void {
    if (config.syncInterval !== undefined) {
      this.syncInterval = config.syncInterval;
      
      // Restart auto-sync if it was running
      if (this.syncIntervalId !== null) {
        this.stopAutoSync();
        this.startAutoSync();
      }
    }
    
    if (config.maxRetries !== undefined) {
      this.maxRetries = config.maxRetries;
    }
    
    if (config.autoSync !== undefined) {
      if (config.autoSync) {
        this.startAutoSync();
      } else {
        this.stopAutoSync();
      }
    }
  }

  /**
   * Get the number of pending operations in the sync queue
   * @returns Number of pending operations
   */
  public getPendingOperationsCount(): number {
    return this.syncQueue.length;
  }

  /**
   * Process the sync queue
   * @returns Promise that resolves when all operations are processed
   */
  public async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncInProgress || this.syncQueue.length === 0) {
      return;
    }
    
    this.syncInProgress = true;
    
    try {
      // Process each operation in the queue
      const operations = [...this.syncQueue];
      this.syncQueue = [];
      
      for (const operation of operations) {
        try {
          await this.executeWithRetry(operation);
        } catch (error) {
          console.error('Failed to process sync operation after retries:', error);
          // Put the failed operation back in the queue
          this.syncQueue.push(operation);
        }
      }
    } finally {
      this.syncInProgress = false;
      
      // If there are still operations in the queue, try again later
      if (this.syncQueue.length > 0 && this.isOnline) {
        setTimeout(() => this.processSyncQueue(), 5000);
      }
    }
  }

  /**
   * Execute an operation with retry logic
   * @param operation Function to execute
   * @returns Promise that resolves when the operation succeeds
   */
  private async executeWithRetry(operation: () => Promise<void>): Promise<void> {
    let retries = 0;
    
    while (retries < this.maxRetries) {
      try {
        await operation();
        return; // Success
      } catch (error) {
        retries++;
        
        if (retries >= this.maxRetries) {
          throw error; // Max retries reached
        }
        
        // Exponential backoff
        const delay = Math.pow(2, retries) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  /**
   * Handle online/offline status changes
   */
  private handleOnlineStatusChange(): void {
    const newOnlineStatus = navigator.onLine;
    
    if (this.isOnline !== newOnlineStatus) {
      this.isOnline = newOnlineStatus;
      
      // Notify listeners
      this.listeners.forEach(listener => {
        try {
          listener(this.isOnline);
        } catch (error) {
          console.error('Error in online status listener:', error);
        }
      });
      
      // If we're back online, process the sync queue
      if (this.isOnline) {
        this.processSyncQueue();
      }
    }
  }
}

// Export singleton instance
const offlineService = OfflineService.getInstance();
export default offlineService;
