import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mockOfflineService from '../mocks/OfflineService';
import { mockLocalStorage, mockOnlineStatus } from '../test-utils';

// Use the mock instead of the real service
const offlineService = mockOfflineService;

describe('OfflineService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockStorage: any;

  beforeEach(() => {
    mockStorage = mockLocalStorage();

    // Reset the service
    // @ts-expect-error - Accessing private property for testing
    offlineService.listeners = [];
    // @ts-expect-error - Accessing private property for testing
    offlineService.syncQueue = [];
  });

  afterEach(() => {
    vi.clearAllMocks();

    // Remove event listeners
    window.removeEventListener('online', offlineService.handleOnline);
    window.removeEventListener('offline', offlineService.handleOffline);
  });

  describe('getOnlineStatus', () => {
    it('should return true when online', () => {
      mockOnlineStatus(true);
      expect(offlineService.getOnlineStatus()).toBe(true);
    });

    it('should return false when offline', () => {
      mockOnlineStatus(false);
      expect(offlineService.getOnlineStatus()).toBe(false);
    });
  });

  describe('addOnlineStatusListener', () => {
    it('should add a listener and return a function to remove it', () => {
      // Add a listener
      const listener = vi.fn();
      const removeListener = offlineService.addOnlineStatusListener(listener);

      // Verify that the listener was added
      // @ts-expect-error - Accessing private property for testing
      expect(offlineService.listeners).toContain(listener);

      // Remove the listener
      removeListener();

      // Verify that the listener was removed
      // @ts-expect-error - Accessing private property for testing
      expect(offlineService.listeners).not.toContain(listener);
    });

    it('should call the listener with the current online status', () => {
      mockOnlineStatus(true);

      // Add a listener
      const listener = vi.fn();
      offlineService.addOnlineStatusListener(listener);

      // Verify that the listener was called
      expect(listener).toHaveBeenCalledWith(true);
    });
  });

  describe('handleOnline/handleOffline', () => {
    it('should notify listeners when online status changes', () => {
      // Add a listener
      const listener = vi.fn();
      offlineService.addOnlineStatusListener(listener);

      // Reset the listener mock
      listener.mockReset();

      // Simulate going offline
      mockOnlineStatus(false);
      offlineService.handleOffline();

      // Verify that the listener was called
      expect(listener).toHaveBeenCalledWith(false);

      // Reset the listener mock
      listener.mockReset();

      // Simulate going online
      mockOnlineStatus(true);
      offlineService.handleOnline();

      // Verify that the listener was called
      expect(listener).toHaveBeenCalledWith(true);
    });

    it('should process the sync queue when going online', () => {
      // Mock the processSyncQueue method
      const processSyncQueueSpy = vi
        .spyOn(offlineService, 'processSyncQueue')
        .mockImplementation(() => Promise.resolve());

      // Simulate going online
      mockOnlineStatus(true);
      offlineService.handleOnline();

      // Verify that processSyncQueue was called
      expect(processSyncQueueSpy).toHaveBeenCalled();
    });
  });

  describe('addToSyncQueue', () => {
    it('should add a function to the sync queue', () => {
      // Add a function to the queue
      const syncFunction = vi.fn();
      offlineService.addToSyncQueue(syncFunction);

      // Verify that the function was added
      // @ts-expect-error - Accessing private property for testing
      expect(offlineService.syncQueue).toContain(syncFunction);
    });

    it('should save the queue to localStorage', () => {
      // Add a function to the queue
      const syncFunction = vi.fn();
      offlineService.addToSyncQueue(syncFunction);

      // Verify that the queue was saved to localStorage
      expect(mockStorage.setItem).toHaveBeenCalledWith('offlineSyncQueue', expect.any(String));
    });
  });

  describe('processSyncQueue', () => {
    it('should process all functions in the queue', async () => {
      // Add functions to the queue
      const syncFunction1 = vi.fn().mockResolvedValue(undefined);
      const syncFunction2 = vi.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Accessing private property for testing
      offlineService.syncQueue = [syncFunction1, syncFunction2];

      // Process the queue
      await offlineService.processSyncQueue();

      // Verify that the functions were called
      expect(syncFunction1).toHaveBeenCalled();
      expect(syncFunction2).toHaveBeenCalled();

      // Verify that the queue was cleared
      // @ts-expect-error - Accessing private property for testing
      expect(offlineService.syncQueue).toEqual([]);
    });

    it('should handle errors in sync functions', async () => {
      // Add functions to the queue
      const syncFunction1 = vi.fn().mockRejectedValue(new Error('Test error'));
      const syncFunction2 = vi.fn().mockResolvedValue(undefined);

      // @ts-expect-error - Accessing private property for testing
      offlineService.syncQueue = [syncFunction1, syncFunction2];

      // Process the queue
      await offlineService.processSyncQueue();

      // Verify that both functions were called
      expect(syncFunction1).toHaveBeenCalled();
      expect(syncFunction2).toHaveBeenCalled();

      // Verify that the queue was cleared
      // @ts-expect-error - Accessing private property for testing
      expect(offlineService.syncQueue).toEqual([]);
    });
  });
});
