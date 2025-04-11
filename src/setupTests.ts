import '@testing-library/jest-dom';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';
import { cleanup } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';
import { vi, beforeEach, afterEach } from 'vitest';

declare module 'vitest' {
  interface Assertion<T = any> extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
}

// Mock window.matchMedia
beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];

  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
    this.takeRecords = vi.fn();
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
  takeRecords = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  configurable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver - Ensure this is correctly assigned globally
class MockResizeObserver implements ResizeObserver {
  constructor() {
    this.observe = vi.fn();
    this.unobserve = vi.fn();
    this.disconnect = vi.fn();
  }

  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  configurable: true,
  value: MockResizeObserver,
});

// Mock fetch
window.fetch = vi.fn();

// Create a mock React component
const MockReactFlow = ({ children }: { children: ReactNode }) => {
  return React.createElement('div', null, children);
};

// Mock react-flow
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    ReactFlow: MockReactFlow,
    Background: () => null,
    Controls: () => null,
    useNodesState: () => [React.useState([])[0], vi.fn(), vi.fn()],
    useEdgesState: () => [React.useState([])[0], vi.fn(), vi.fn()],
    MarkerType: {
      ArrowClosed: 'arrowclosed',
    },
  };
});

// Mock idGenerator - Keep actual isValidId, mock generateUniqueId with counter and better format
vi.mock('./utils/idGenerator', async () => {
  const actual = await vi.importActual<typeof import('./utils/idGenerator')>('./utils/idGenerator');
  let counter = 0;
  return {
    ...actual, // Keep actual implementation for isValidId
    generateUniqueId: vi.fn(() => `abc-${counter++}`), // Generate format closer to regex
  };
});

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});
