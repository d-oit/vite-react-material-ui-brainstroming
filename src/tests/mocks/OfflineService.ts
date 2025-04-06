import { vi } from 'vitest';

const mockOfflineService = {
  getOnlineStatus: vi.fn().mockImplementation(() => {
    return navigator.onLine;
  }),
  addOnlineStatusListener: vi.fn().mockImplementation(listener => {
    mockOfflineService.listeners.push(listener);
    // Call the listener with the current status
    listener(mockOfflineService.getOnlineStatus());
    // Return a function to remove the listener
    return () => {
      const index = mockOfflineService.listeners.indexOf(listener);
      if (index !== -1) {
        mockOfflineService.listeners.splice(index, 1);
      }
    };
  }),
  handleOnline: vi.fn().mockImplementation(() => {
    mockOfflineService.listeners.forEach(listener => listener(true));
    mockOfflineService.processSyncQueue();
  }),
  handleOffline: vi.fn().mockImplementation(() => {
    mockOfflineService.listeners.forEach(listener => listener(false));
  }),
  addToSyncQueue: vi.fn().mockImplementation(fn => {
    mockOfflineService.syncQueue.push(fn);
    // Save to localStorage
    localStorage.setItem('offlineSyncQueue', JSON.stringify(mockOfflineService.syncQueue));
  }),
  processSyncQueue: vi.fn().mockImplementation(async () => {
    const queue = [...mockOfflineService.syncQueue];
    mockOfflineService.syncQueue = [];

    for (const fn of queue) {
      try {
        await fn();
      } catch (error) {
        console.error('Error processing sync queue item:', error);
      }
    }
  }),
  syncQueue: [],
  listeners: [],
};

export default mockOfflineService;
