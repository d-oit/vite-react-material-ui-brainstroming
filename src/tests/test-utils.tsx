import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { SettingsProvider } from '../contexts/SettingsContext';
import { I18nProvider } from '../contexts/I18nContext';
import { SnackbarProvider } from './mocks/SnackbarContext';

// Create a light theme for testing
const theme = createTheme({
  palette: {
    mode: 'light',
  },
});

// Custom render function that wraps components with necessary providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <SnackbarProvider>
          <I18nProvider>
            <SettingsProvider>{children}</SettingsProvider>
          </I18nProvider>
        </SnackbarProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Mock IndexedDB for testing
const mockIndexedDB = () => {
  // Create a mock implementation of IndexedDB
  const mockIDBFactory = {
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
          oncomplete: null,
          onerror: null,
        }),
        createObjectStore: vi.fn(),
        objectStoreNames: {
          contains: vi.fn().mockReturnValue(true),
        },
      },
      onupgradeneeded: null,
      onsuccess: null,
      onerror: null,
    }),
    deleteDatabase: vi.fn(),
  };

  // Mock the window.indexedDB
  Object.defineProperty(window, 'indexedDB', {
    value: mockIDBFactory,
    writable: true,
  });

  return mockIDBFactory;
};

// Mock for ResizeObserver which is not available in jsdom
const mockResizeObserver = () => {
  class ResizeObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  window.ResizeObserver = ResizeObserverMock;
  return ResizeObserverMock;
};

// Mock for IntersectionObserver which is not available in jsdom
const mockIntersectionObserver = () => {
  class IntersectionObserverMock {
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }

  window.IntersectionObserver = IntersectionObserverMock;
  return IntersectionObserverMock;
};

// Mock for navigator.onLine
const mockOnlineStatus = (online = true) => {
  Object.defineProperty(navigator, 'onLine', {
    value: online,
    writable: true,
  });
};

// Mock for localStorage
const mockLocalStorage = () => {
  const store: Record<string, string> = {};

  const mockStorage = {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => {
        delete store[key];
      });
    }),
    key: vi.fn((index: number) => Object.keys(store)[index] || null),
    length: Object.keys(store).length,
  };

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });

  return mockStorage;
};

// Export everything from RTL
export * from '@testing-library/react';
export { customRender as render, mockIndexedDB, mockResizeObserver, mockIntersectionObserver, mockOnlineStatus, mockLocalStorage };
