import { vi } from 'vitest';

const mockOfflineService = {
  getOnlineStatus: vi.fn().mockReturnValue(true),
  addOnlineStatusListener: vi.fn().mockReturnValue(() => {}),
  handleOnline: vi.fn(),
  handleOffline: vi.fn(),
  addToSyncQueue: vi.fn(),
  processSyncQueue: vi.fn().mockResolvedValue(undefined),
  syncQueue: [],
  listeners: [],
};

export default mockOfflineService;
