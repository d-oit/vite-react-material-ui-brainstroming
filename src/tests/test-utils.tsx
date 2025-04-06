import { render, type RenderOptions } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { ErrorNotificationProvider } from '../contexts/ErrorNotificationContext';
import { SettingsProvider } from '../contexts/SettingsContext';

// Map is used instead of object literal to avoid object injection warnings

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

// Mock online status
export function mockOnlineStatus(isOnline: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    value: isOnline,
    writable: true,
  });
}

// Mock IndexedDB
export function mockIndexedDB() {
  // Store is not needed for this mock

  const indexedDB = {
    open: vi.fn().mockReturnValue({
      result: {
        transaction: vi.fn().mockReturnValue({
          objectStore: vi.fn().mockReturnValue({
            get: vi.fn(),
            put: vi.fn(),
            delete: vi.fn(),
            getAll: vi.fn(),
            clear: vi.fn(),
            index: vi.fn().mockReturnValue({
              get: vi.fn(),
              getAll: vi.fn(),
            }),
          }),
        }),
        createObjectStore: vi.fn(),
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(true),
        },
      },
      onupgradeneeded: null,
    }),
    deleteDatabase: vi.fn(),
  };

  Object.defineProperty(window, 'indexedDB', {
    value: indexedDB,
    writable: true,
  });
}

// Mock Intersection Observer
export function mockIntersectionObserver() {
  class IntersectionObserverMock {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];

    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
    takeRecords = vi.fn();

    constructor() {
      return this;
    }
  }

  Object.defineProperty(window, 'IntersectionObserver', {
    writable: true,
    configurable: true,
    value: IntersectionObserverMock,
  });
}

// Mock localStorage
export function mockLocalStorage() {
  const store = new Map<string, string>();

  const mockStorage = {
    getItem: vi.fn((key: string) => store.get(key) || null),
    setItem: vi.fn((key: string, value: string) => {
      store.set(key, value);
    }),
    removeItem: vi.fn((key: string) => {
      store.delete(key);
    }),
    clear: vi.fn(() => {
      store.clear();
    }),
    key: vi.fn((index: number) => {
      // Convert Map keys to array for indexing
      return Array.from(store.keys())[index] || null;
    }),
    length: vi.fn(() => store.size),
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
}

// Custom render with providers
const customRender = (
  ui: ReactElement,
  { route = '/', ...renderOptions }: ExtendedRenderOptions = {}
) => {
  window.history.pushState({}, 'Test page', route);

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <BrowserRouter>
      <ErrorNotificationProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </ErrorNotificationProvider>
    </BrowserRouter>
  );

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};

// Re-export everything except render
export { screen, fireEvent, waitFor, act, within } from '@testing-library/react';
export { customRender as render };
