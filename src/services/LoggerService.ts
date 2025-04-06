import type { LogEntry } from './IndexedDBService';
import indexedDBService from './IndexedDBService';
import offlineService from './OfflineService';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'critical';
export type LogCategory =
  | 'app'
  | 'network'
  | 'user'
  | 'performance'
  | 'security'
  | 'api'
  | 'storage'
  | 'ui';

export interface StructuredLogContext {
  category?: LogCategory;
  component?: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: unknown;
}

/**
 * Service for logging application events and errors
 */
export class LoggerService {
  private static instance: LoggerService;
  private isEnabled: boolean = true;
  private syncLogsWhenOnline: boolean = true;
  private remoteLoggingEndpoint: string | null = null;
  private applicationVersion: string;
  private maxLogAge: number = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds
  private minLogLevel: LogLevel = 'info';
  private sessionId: string;
  private defaultContext: Partial<StructuredLogContext> = {};
  private consoleLoggingEnabled: boolean = true;

  private constructor() {
    // Get application version from environment
    this.applicationVersion = import.meta.env.VITE_PROJECT_VERSION || '0.1.0';

    // Generate a session ID
    this.sessionId = crypto.randomUUID();

    // Set default context
    this.defaultContext = {
      sessionId: this.sessionId,
      appVersion: this.applicationVersion,
    };

    // Set up periodic log cleanup
    this.setupLogCleanup();

    // Log application start
    this.info('Application started', { category: 'app' });
  }

  public static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Configure the logger service
   * @param config Configuration options
   */
  public configure(config: {
    enabled?: boolean;
    syncLogsWhenOnline?: boolean;
    remoteLoggingEndpoint?: string;
    maxLogAge?: number;
    minLogLevel?: LogLevel;
    consoleLoggingEnabled?: boolean;
    defaultContext?: Partial<StructuredLogContext>;
  }): void {
    if (config.enabled !== undefined) {
      this.isEnabled = config.enabled;
    }

    if (config.syncLogsWhenOnline !== undefined) {
      this.syncLogsWhenOnline = config.syncLogsWhenOnline;
    }

    if (config.remoteLoggingEndpoint !== undefined) {
      this.remoteLoggingEndpoint = config.remoteLoggingEndpoint;
    }

    if (config.maxLogAge !== undefined) {
      this.maxLogAge = config.maxLogAge;
      this.setupLogCleanup();
    }

    if (config.minLogLevel !== undefined) {
      this.minLogLevel = config.minLogLevel;
    }

    if (config.consoleLoggingEnabled !== undefined) {
      this.consoleLoggingEnabled = config.consoleLoggingEnabled;
    }

    if (config.defaultContext) {
      this.defaultContext = {
        ...this.defaultContext,
        ...config.defaultContext,
      };
    }
  }

  /**
   * Log a debug message
   * @param message Log message
   * @param context Additional context
   */
  public debug(message: string, context?: Partial<StructuredLogContext>): void {
    this.log('debug', message, context);
  }

  /**
   * Log an informational message
   * @param message Log message
   * @param context Additional context
   */
  public info(message: string, context?: Partial<StructuredLogContext>): void {
    this.log('info', message, context);
  }

  /**
   * Log a warning message
   * @param message Log message
   * @param context Additional context
   */
  public warn(message: string, context?: Partial<StructuredLogContext>): void {
    this.log('warn', message, context);
  }

  /**
   * Log an error message
   * @param message Log message
   * @param error Error object
   * @param context Additional context
   */
  public error(message: string, error?: Error, context?: Partial<StructuredLogContext>): void {
    const errorContext = error
      ? {
          ...context,
          errorMessage: error.message,
          stack: error.stack,
          name: error.name,
        }
      : context;

    this.log('error', message, errorContext);
  }

  /**
   * Log a critical error message
   * @param message Log message
   * @param error Error object
   * @param context Additional context
   */
  public critical(message: string, error?: Error, context?: Partial<StructuredLogContext>): void {
    const errorContext = error
      ? {
          ...context,
          errorMessage: error.message,
          stack: error.stack,
          name: error.name,
        }
      : context;

    this.log('critical', message, errorContext);
  }

  /**
   * Log a message with the specified level
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   */
  public log(level: LogLevel, message: string, context?: Partial<StructuredLogContext>): void {
    if (!this.isEnabled) return;

    // Check if we should log this level
    if (!this.shouldLogLevel(level)) return;

    // Merge with default context
    const mergedContext = this.mergeContext(context);

    // Log to console if enabled
    if (this.consoleLoggingEnabled) {
      this.logToConsole(level, message, mergedContext);
    }

    // Log to IndexedDB
    this.logToIndexedDB(level, message, mergedContext);

    // If we have a remote endpoint and it's an error or critical, try to send it immediately
    if (
      this.remoteLoggingEndpoint &&
      (level === 'error' || level === 'critical') &&
      offlineService.getOnlineStatus()
    ) {
      this.sendLogToRemote(level, message, mergedContext);
    }
  }

  /**
   * Get logs from IndexedDB
   * @param level Optional log level filter
   * @param limit Maximum number of logs to return
   * @returns Promise that resolves with logs
   */
  public async getLogs(level?: LogLevel, limit = 100): Promise<LogEntry[]> {
    try {
      const initialized = await indexedDBService.init();
      if (initialized) {
        return await indexedDBService.getLogs(level, limit);
      } else {
        console.warn('IndexedDB not available, returning empty logs array');
        return [];
      }
    } catch (error) {
      console.error('Failed to get logs from IndexedDB:', error);
      return [];
    }
  }

  /**
   * Clear logs from IndexedDB
   * @param olderThan Clear logs older than this date
   * @returns Promise that resolves when logs are cleared
   */
  public async clearLogs(olderThan?: Date): Promise<void> {
    try {
      const initialized = await indexedDBService.init();
      if (initialized) {
        await indexedDBService.clearLogs(olderThan);
      } else {
        console.warn('IndexedDB not available, skipping log cleanup');
      }
    } catch (error) {
      console.error('Failed to clear logs from IndexedDB:', error);
    }
  }

  /**
   * Sync logs to remote endpoint
   * @returns Promise that resolves when logs are synced
   */
  public async syncLogsToRemote(): Promise<void> {
    if (!this.remoteLoggingEndpoint || !offlineService.getOnlineStatus()) {
      return;
    }

    try {
      // Get all error logs first (most important)
      const errorLogs = await this.getLogs('error', 100);

      // Then get other logs
      const warnLogs = await this.getLogs('warn', 50);
      const infoLogs = await this.getLogs('info', 50);

      // Combine logs
      const logs = [...errorLogs, ...warnLogs, ...infoLogs];

      if (logs.length === 0) {
        return;
      }

      // Send logs to remote endpoint
      await this.sendLogsToRemote(logs);

      // If successful, clear the sent logs
      const oldestLog = new Date(Math.min(...logs.map(log => new Date(log.timestamp).getTime())));
      await this.clearLogs(oldestLog);
    } catch (error) {
      console.error('Failed to sync logs to remote:', error);

      // If we're configured to sync logs when online, add to sync queue
      if (this.syncLogsWhenOnline) {
        offlineService.addToSyncQueue(async () => {
          await this.syncLogsToRemote();
        });
      }
    }
  }

  /**
   * Log to console
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   */
  /**
   * Check if a log level should be logged based on the minimum log level
   * @param level Log level to check
   * @returns True if the level should be logged
   */
  private shouldLogLevel(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error', 'critical'];
    const minIndex = levels.indexOf(this.minLogLevel);
    const levelIndex = levels.indexOf(level);

    return levelIndex >= minIndex;
  }

  /**
   * Merge context with default context
   * @param context Context to merge
   * @returns Merged context
   */
  private mergeContext(context?: Partial<StructuredLogContext>): Record<string, unknown> {
    return {
      ...this.defaultContext,
      ...context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };
  }

  private logToConsole(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    const timestamp = new Date().toISOString();
    const formattedMessage = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

    switch (level) {
      case 'debug':
        console.debug(formattedMessage, context || '');
        break;
      case 'info':
        console.info(formattedMessage, context || '');
        break;
      case 'warn':
        console.warn(formattedMessage, context || '');
        break;
      case 'error':
        console.error(formattedMessage, context || '');
        break;
      case 'critical':
        console.error(`%c${formattedMessage}`, 'color: red; font-weight: bold', context || '');
        break;
    }
  }

  /**
   * Log to IndexedDB
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   */
  private async logToIndexedDB(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    try {
      const initialized = await indexedDBService.init();
      if (initialized) {
        await indexedDBService.log(level, message, {
          ...context,
          appVersion: this.applicationVersion,
          userAgent: navigator.userAgent,
          url: window.location.href,
        });
      } else {
        // If IndexedDB is not available, just log to console
        if (level === 'error' || level === 'warn') {
          console.warn('IndexedDB not available, log entry not saved to database');
        }
      }
    } catch (error) {
      console.error('Failed to log to IndexedDB:', error);
    }
  }

  /**
   * Send a log to the remote endpoint
   * @param level Log level
   * @param message Log message
   * @param context Additional context
   */
  private async sendLogToRemote(
    level: LogLevel,
    message: string,
    context?: Record<string, unknown>
  ): Promise<void> {
    if (!this.remoteLoggingEndpoint) return;

    try {
      const logData = {
        level,
        message,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          appVersion: this.applicationVersion,
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      };

      await fetch(this.remoteLoggingEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
    } catch (error) {
      console.error('Failed to send log to remote endpoint:', error);

      // If we're configured to sync logs when online, add to sync queue
      if (this.syncLogsWhenOnline) {
        offlineService.addToSyncQueue(async () => {
          await this.sendLogToRemote(level, message, context);
        });
      }
    }
  }

  /**
   * Send multiple logs to the remote endpoint
   * @param logs Logs to send
   */
  private async sendLogsToRemote(logs: LogEntry[]): Promise<void> {
    if (!this.remoteLoggingEndpoint) return;

    const response = await fetch(this.remoteLoggingEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        logs,
        appVersion: this.applicationVersion,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to send logs to remote: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Set up periodic log cleanup
   */
  private setupLogCleanup(): void {
    // Clear old logs once a day
    setInterval(
      () => {
        const cutoffDate = new Date(Date.now() - this.maxLogAge);
        this.clearLogs(cutoffDate).catch(error => {
          console.error('Failed to clean up old logs:', error);
        });
      },
      24 * 60 * 60 * 1000
    ); // 24 hours

    // Also clean up logs on startup
    const cutoffDate = new Date(Date.now() - this.maxLogAge);
    this.clearLogs(cutoffDate).catch(error => {
      console.error('Failed to clean up old logs on startup:', error);
    });
  }
}

// Export singleton instance
const loggerService = LoggerService.getInstance();
export default loggerService;
