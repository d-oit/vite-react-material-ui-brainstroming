import { render, RenderResult } from '@testing-library/react';
import { vi, beforeEach, afterEach } from 'vitest';
import React, { ReactElement } from 'react';

import { I18nProvider } from '../../../contexts/I18nContext';
import type { BrainstormNode } from '../types';

export const mockGenerateId = vi.fn(() => 'test-id');

// Mock for generateUniqueId
vi.mock('../../../utils/idGenerator', () => ({
  generateUniqueId: () => mockGenerateId(),
}));

// Mock for ReactFlow
vi.mock('reactflow', () => ({
  ...vi.importActual('reactflow'),
  ReactFlow: ({ children }: { children: React.ReactNode }) => React.createElement('div', null, children),
  Background: () => null,
  Controls: () => null,
  useNodesState: () => {
    const [nodes, setNodes] = React.useState<any[]>([]);
    return [nodes, setNodes, vi.fn()];
  },
  useEdgesState: () => {
    const [edges, setEdges] = React.useState<any[]>([]);
    return [edges, setEdges, vi.fn()];
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
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