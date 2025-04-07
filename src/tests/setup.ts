import '@testing-library/jest-dom';
import { vi, expect } from 'vitest';

import { mockIndexedDB, mockIntersectionObserver, mockLocalStorage } from './test-utils';

// Extend matchers
expect.extend({
  toBeInTheDocument(received) {
    const pass = received !== null;
    return {
      message: () => `expected ${received} ${pass ? 'not ' : ''}to be in the document`,
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
  vi.clearAllMocks();
});

beforeEach(() => {
  // Mock PWA register
  vi.mock('virtual:pwa-register', () => ({
    registerSW: () => ({
      onNeedRefresh: vi.fn(),
      onOfflineReady: vi.fn(),
      onRegistered: vi.fn(),
      onRegisterError: vi.fn(),
    }),
  }));

  // Mock LoggerService
  vi.mock('../services/LoggerService', async () => {
    const { LoggerService } = await import('./mocks/LoggerService');
    return {
      default: new LoggerService('test'),
      LoggerService,
    };
  });

  // Mock AWS SDK
  vi.mock('aws-sdk', async () => {
    const awsMock = await import('./mocks/aws-sdk');
    return {
      ...awsMock,
      default: awsMock.default,
    };
  });

  // Mock AWS SDK clients
  vi.mock('aws-sdk/clients/s3', async () => {
    const { S3 } = await import('./mocks/aws-sdk');
    return { S3 };
  });
});
