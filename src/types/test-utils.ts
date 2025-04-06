import type { Mock } from 'vitest';

import { NodeType, EdgeType } from './enums';
import type { NodeData, Node, Edge } from './models';
import type { Project } from './project';

export interface MockResizeObserver {
  observe: Mock;
  unobserve: Mock;
  disconnect: Mock;
}

export interface MockStorage {
  getItem: Mock;
  setItem: Mock;
  removeItem: Mock;
  clear: Mock;
  key: Mock;
  length: number;
}

export interface MockNetworkStatus {
  online: boolean;
  type: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface TestNodeData extends NodeData {
  label?: string; // For backward compatibility in tests
}

export interface TestNode extends Node {
  data: TestNodeData;
}

export interface TestProject extends Project {
  nodes: TestNode[];
}

// Test data generators
export function createTestNode(overrides: Partial<TestNode> = {}): TestNode {
  return {
    id: 'test-node-1',
    type: NodeType.IDEA,
    position: { x: 0, y: 0 },
    data: {
      id: 'test-node-1',
      title: 'Test Node',
      content: 'Test Content',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      label: 'Test Label',
      ...overrides.data,
    },
    ...overrides,
  };
}

export function createTestEdge(overrides: Partial<Edge> = {}): Edge {
  return {
    id: 'test-edge-1',
    source: 'source-node',
    target: 'target-node',
    type: EdgeType.DEFAULT,
    ...overrides,
  };
}

export function createTestProject(overrides: Partial<TestProject> = {}): TestProject {
  return {
    id: 'test-project-1',
    name: 'Test Project',
    description: 'Test Description',
    nodes: [createTestNode()],
    edges: [createTestEdge()],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    isArchived: false,
    ...overrides,
  };
}

// Mock factories for test environment
export function createMockResizeObserver(): MockResizeObserver {
  return {
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  };
}

export function createMockStorage(): MockStorage {
  const store = new Map<string, string>();

  return {
    getItem: vi.fn((key: string) => store.get(key) ?? null),
    setItem: vi.fn((key: string, value: string) => store.set(key, value)),
    removeItem: vi.fn((key: string) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    key: vi.fn((index: number) => Array.from(store.keys())[index] || null),
    length: store.size,
  };
}

export function createMockNetworkStatus(
  overrides: Partial<MockNetworkStatus> = {}
): MockNetworkStatus {
  return {
    online: true,
    type: 'wifi',
    effectiveType: '4g',
    downlink: 10,
    rtt: 50,
    saveData: false,
    ...overrides,
  };
}
