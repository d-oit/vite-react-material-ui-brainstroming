import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import loggerService from '../../services/LoggerService';
import indexedDBService from '../../services/IndexedDBService';
import offlineService from '../../services/OfflineService';
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';

// Mock dependencies
vi.mock('../../services/IndexedDBService', () => ({
  default: {
    log: vi.fn(),
    getLogs: vi.fn(),
    clearLogs: vi.fn(),
  },
}));

vi.mock('../../services/OfflineService', () => ({
  default: {
    getOnlineStatus: vi.fn(),
    addToSyncQueue: vi.fn(),
  },
}));

describe('LoggerService', () => {
  let mockStorage: any;
  
  beforeEach(() => {
    mockStorage = mockLocalStorage();
    mockOnlineStatus(true);
    
    // Reset mocks
    vi.clearAllMocks();
    
    // Configure logger for testing
    loggerService.configure({
      enabled: true,
      consoleLoggingEnabled: false, // Disable console logging for tests
      minLogLevel: 'debug',
    });
  });
  
  afterEach(() => {
    vi.clearAllMocks();
  });
  
  describe('log', () => {
    it('should log messages to IndexedDB', async () => {
      // Mock dependencies
      (indexedDBService.log as any).mockResolvedValue(undefined);
      (offlineService.getOnlineStatus as any).mockReturnValue(true);
      
      // Call the method
      loggerService.log('info', 'Test message', { category: 'test' });
      
      // Verify the result
      expect(indexedDBService.log).toHaveBeenCalledWith('info', 'Test message', expect.objectContaining({
        category: 'test',
        appVersion: expect.any(String),
        userAgent: expect.any(String),
        url: expect.any(String),
      }));
    });
    
    it('should respect the minimum log level', async () => {
      // Configure logger to only log errors
      loggerService.configure({ minLogLevel: 'error' });
      
      // Call the method with different levels
      loggerService.debug('Debug message');
      loggerService.info('Info message');
      loggerService.warn('Warning message');
      loggerService.error('Error message');
      
      // Verify that only error messages were logged
      expect(indexedDBService.log).toHaveBeenCalledTimes(1);
      expect(indexedDBService.log).toHaveBeenCalledWith('error', 'Error message', expect.any(Object));
    });
    
    it('should not log when disabled', async () => {
      // Disable logging
      loggerService.configure({ enabled: false });
      
      // Call the method
      loggerService.info('Test message');
      
      // Verify that nothing was logged
      expect(indexedDBService.log).not.toHaveBeenCalled();
    });
  });
  
  describe('getLogs', () => {
    it('should get logs from IndexedDB', async () => {
      // Mock data
      const mockLogs = [
        { id: '1', level: 'info', message: 'Test message 1', timestamp: new Date().toISOString() },
        { id: '2', level: 'error', message: 'Test message 2', timestamp: new Date().toISOString() },
      ];
      
      // Mock dependencies
      (indexedDBService.getLogs as any).mockResolvedValue(mockLogs);
      
      // Call the method
      const logs = await loggerService.getLogs();
      
      // Verify the result
      expect(logs).toEqual(mockLogs);
      expect(indexedDBService.getLogs).toHaveBeenCalledWith(undefined, 100);
    });
    
    it('should filter logs by level', async () => {
      // Mock data
      const mockLogs = [
        { id: '1', level: 'error', message: 'Test message 1', timestamp: new Date().toISOString() },
      ];
      
      // Mock dependencies
      (indexedDBService.getLogs as any).mockResolvedValue(mockLogs);
      
      // Call the method
      const logs = await loggerService.getLogs('error');
      
      // Verify the result
      expect(logs).toEqual(mockLogs);
      expect(indexedDBService.getLogs).toHaveBeenCalledWith('error', 100);
    });
    
    it('should limit the number of logs', async () => {
      // Mock data
      const mockLogs = [
        { id: '1', level: 'info', message: 'Test message 1', timestamp: new Date().toISOString() },
      ];
      
      // Mock dependencies
      (indexedDBService.getLogs as any).mockResolvedValue(mockLogs);
      
      // Call the method
      const logs = await loggerService.getLogs(undefined, 10);
      
      // Verify the result
      expect(logs).toEqual(mockLogs);
      expect(indexedDBService.getLogs).toHaveBeenCalledWith(undefined, 10);
    });
    
    it('should handle errors', async () => {
      // Mock dependencies
      (indexedDBService.getLogs as any).mockRejectedValue(new Error('Test error'));
      
      // Call the method
      const logs = await loggerService.getLogs();
      
      // Verify the result
      expect(logs).toEqual([]);
    });
  });
  
  describe('clearLogs', () => {
    it('should clear logs from IndexedDB', async () => {
      // Mock dependencies
      (indexedDBService.clearLogs as any).mockResolvedValue(undefined);
      
      // Call the method
      await loggerService.clearLogs();
      
      // Verify the result
      expect(indexedDBService.clearLogs).toHaveBeenCalledWith(undefined);
    });
    
    it('should clear logs older than a specific date', async () => {
      // Mock dependencies
      (indexedDBService.clearLogs as any).mockResolvedValue(undefined);
      
      // Call the method
      const date = new Date();
      await loggerService.clearLogs(date);
      
      // Verify the result
      expect(indexedDBService.clearLogs).toHaveBeenCalledWith(date);
    });
    
    it('should handle errors', async () => {
      // Mock dependencies
      (indexedDBService.clearLogs as any).mockRejectedValue(new Error('Test error'));
      
      // Call the method
      await loggerService.clearLogs();
      
      // Verify that the error was handled
      expect(indexedDBService.clearLogs).toHaveBeenCalled();
      // No error should be thrown
    });
  });
  
  describe('convenience methods', () => {
    it('should provide debug method', () => {
      // Mock the log method
      const logSpy = vi.spyOn(loggerService, 'log');
      
      // Call the method
      loggerService.debug('Debug message', { category: 'test' });
      
      // Verify the result
      expect(logSpy).toHaveBeenCalledWith('debug', 'Debug message', { category: 'test' });
    });
    
    it('should provide info method', () => {
      // Mock the log method
      const logSpy = vi.spyOn(loggerService, 'log');
      
      // Call the method
      loggerService.info('Info message', { category: 'test' });
      
      // Verify the result
      expect(logSpy).toHaveBeenCalledWith('info', 'Info message', { category: 'test' });
    });
    
    it('should provide warn method', () => {
      // Mock the log method
      const logSpy = vi.spyOn(loggerService, 'log');
      
      // Call the method
      loggerService.warn('Warning message', { category: 'test' });
      
      // Verify the result
      expect(logSpy).toHaveBeenCalledWith('warn', 'Warning message', { category: 'test' });
    });
    
    it('should provide error method', () => {
      // Mock the log method
      const logSpy = vi.spyOn(loggerService, 'log');
      
      // Call the method
      const error = new Error('Test error');
      loggerService.error('Error message', error);
      
      // Verify the result
      expect(logSpy).toHaveBeenCalledWith('error', 'Error message', error);
    });
  });
});
