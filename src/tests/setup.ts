import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';
import { cleanup } from '@testing-library/react';
import { mockIndexedDB, mockIntersectionObserver, mockLocalStorage } from './test-utils';

// Extend matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      message: () =>
        `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
      pass,
    };
  },
});

// Setup mocks
beforeAll(() => {
  mockIndexedDB();
  mockIntersectionObserver();
  mockLocalStorage();
  
  // Mock window.fetch
  global.fetch = vi.fn();
  
  // Mock service worker
  global.navigator.serviceWorker = {
    register: vi.fn().mockResolvedValue({}),
    ready: Promise.resolve({
      active: {
        postMessage: vi.fn(),
      },
    }),
  } as unknown as ServiceWorkerContainer;
});

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.mock('virtual:pwa-register', () => ({
    registerSW: () => ({
      onNeedRefresh: vi.fn(),
      onOfflineReady: vi.fn(),
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    }),
  }));
});
