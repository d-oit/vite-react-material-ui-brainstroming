import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import React from 'react';
import type { ReactNode } from 'react';
import type { TestingLibraryMatchers } from '@testing-library/jest-dom/matchers';

declare module 'vitest' {
  interface Assertion<T = any>
    extends TestingLibraryMatchers<typeof expect.stringContaining, T> {}
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

window.IntersectionObserver = MockIntersectionObserver;

// Mock ResizeObserver
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

window.ResizeObserver = MockResizeObserver;

// Mock fetch
window.fetch = vi.fn();

// Create a mock React component
const MockReactFlow = ({ children }: { children: ReactNode }) => {
  return React.createElement('div', null, children);
};

// Mock react-flow
vi.mock('reactflow', async () => {
  return {
    ReactFlow: MockReactFlow,
    Background: () => null,
    Controls: () => null,
    useNodesState: () => {
      const [nodes, setNodes] = React.useState([]);
      return [nodes, setNodes, vi.fn()];
    },
    useEdgesState: () => {
      const [edges, setEdges] = React.useState([]);
      return [edges, setEdges, vi.fn()];
    },
    MarkerType: {
      ArrowClosed: 'arrowclosed',
    },
  };
});

// Mock generateUniqueId
vi.mock('./utils/idGenerator', () => ({
  generateUniqueId: () => 'test-id',
}));

// Clean up after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});