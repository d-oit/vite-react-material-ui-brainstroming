import type { RenderResult } from '@testing-library/react';
import { render } from '@testing-library/react';
import type { ReactElement } from 'react';
import React from 'react';
import { vi, beforeEach, afterEach } from 'vitest';

import { I18nProvider } from '../../../contexts/I18nContext';
import type { BrainstormNode } from '../types';

export const mockGenerateId = vi.fn(() => 'test-id');

// Mock for generateUniqueId
vi.mock('../../../utils/idGenerator', () => ({
  generateUniqueId: () => mockGenerateId(),
}));

// Mock for ReactFlow
vi.mock('reactflow', () => ({
  // Remove importActual as we are mocking all used parts explicitly
  ReactFlow: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  Background: () => null,
  Controls: () => null,
  useNodesState: (initialNodes?: any[]) => {
    // Accept initialNodes
    const [nodes, setNodes] = React.useState<any[]>(initialNodes || []); // Use initialNodes
    return [nodes, setNodes, vi.fn()];
  },
  useEdgesState: (initialEdges?: any[]) => {
    // Accept initialEdges
    const [edges, setEdges] = React.useState<any[]>(initialEdges || []); // Use initialEdges
    return [edges, setEdges, vi.fn()];
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
  // Add mocks for other used exports
  addEdge: vi.fn((params, edges) => [
    ...edges,
    { id: `${params.source}-${params.target}`, ...params },
  ]),
  Position: {
    // Mock the Position enum/object
    Left: 'left',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
  },
}));

export const renderWithProviders = (ui: ReactElement): RenderResult =>
  render(<I18nProvider initialLocale="en">{ui}</I18nProvider>);

interface NodeMatchResult {
  message: () => string;
  pass: boolean;
}

export const mockNodeMatchers = {
  toMatchNode: (received: BrainstormNode, expected: Partial<BrainstormNode>): NodeMatchResult => {
    const matches = Object.entries(expected).every(
      ([key, value]) => received[key as keyof BrainstormNode] === value
    );
    return {
      message: () =>
        `expected ${JSON.stringify(received)} ${matches ? 'not ' : ''}to match ${JSON.stringify(expected)}`,
      pass: matches,
    };
  },
};

export const setupTest = (): void => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGenerateId.mockImplementation(() => `test-id-${Math.random()}`);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });
};

export const setupTimers = (): void => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });
};

// Add custom matchers to expect
expect.extend(mockNodeMatchers);

// Extend expect interface
declare module 'vitest' {
  interface AsymmetricMatchers {
    toMatchNode(expected: Partial<BrainstormNode>): void;
  }
  interface Assertion<T = any> {
    toMatchNode(expected: Partial<BrainstormNode>): void;
  }
}
