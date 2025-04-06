import { render, type RenderOptions } from '@testing-library/react';
import React, { type ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';

import { ErrorNotificationProvider } from '../contexts/ErrorNotificationContext';
import { SettingsProvider } from '../contexts/SettingsContext';

interface MockLocalStorage {
  [key: string]: string;
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  route?: string;
}

// Mock IndexedDB
export function mockIndexedDB() {
  const store: Record<string, any> = {};

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
  const store: MockLocalStorage = {};

  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key]);
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    length: Object.keys(store).length,
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
