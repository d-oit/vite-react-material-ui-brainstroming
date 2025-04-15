import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React, { useState } from 'react'; // Import useState
import type { ReactNode } from 'react';
import { vi } from 'vitest'; // Import vi

import { I18nProvider } from '../../../contexts/I18nContext';
import ComprehensiveBrainstorm from '../ComprehensiveBrainstorm';
import type { BrainstormNode, BrainstormSession } from '../types';

import { MOCK_NODE_BASE, MOCK_SESSION, TEST_PROJECT_ID } from './constants';
import { setupTest } from './testUtils'; // Remove mockGenerateId if not used directly here

// Isolate the mock specifically for this test file
vi.mock('reactflow', () => ({
  ReactFlow: ({ children }: { children: React.ReactNode }) =>
    React.createElement('div', null, children),
  Background: () => null,
  Controls: () => null,
  useNodesState: (initialNodes?: any[]) => {
    const [nodes, setNodes] = useState<any[]>(initialNodes || []);
    return [nodes, setNodes, vi.fn()];
  },
  useEdgesState: (initialEdges?: any[]) => {
    const [edges, setEdges] = useState<any[]>(initialEdges || []);
    return [edges, setEdges, vi.fn()];
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
  addEdge: vi.fn((params, edges) => [...edges, { id: `${params.source}-${params.target}`, ...params }]),
  Position: {
    Left: 'left',
    Top: 'top',
    Right: 'right',
    Bottom: 'bottom',
  },
}));

// const mockUseNodesState = vi.fn(() => {
// const mockUseNodesState = vi.fn(() => {
//   const [nodes, setNodes] = React.useState<BrainstormNode[]>([]);
//   return [nodes, setNodes, vi.fn()];
// });
// const mockUseEdgesState = vi.fn(() => {
//   const [edges, setEdges] = React.useState<any[]>([]);
//   return [edges, setEdges, vi.fn()];
// });
// vi.mocked(useNodesState).mockImplementation(mockUseNodesState);
// vi.mocked(useEdgesState).mockImplementation(mockUseEdgesState);
// vi.mocked(ReactFlow).mockImplementation(({ children }) => <div>{children}</div>);
// vi.mocked(Background).mockImplementation(() => null);
// vi.mocked(Controls).mockImplementation(() => null);


describe('ComprehensiveBrainstorm', () => {
  // Use type assertion to force compatibility
  const mockOnSave = vi.fn() as unknown as (session: BrainstormSession) => Promise<void>;
  const mockOnClose = vi.fn();

  setupTest();

  const renderComponent = (session = MOCK_SESSION) =>
    render(
      <I18nProvider initialLocale="en">
        <ComprehensiveBrainstorm
          projectId={TEST_PROJECT_ID}
          session={session}
          onSave={mockOnSave}
          onClose={mockOnClose}
        />
      </I18nProvider>
    );

  it('should render existing nodes from session', () => {
    renderComponent();
    expect(screen.getByText('Test Idea 1')).toBeInTheDocument();
    expect(screen.getByText('Test Idea 2')).toBeInTheDocument();
  });

  it('should save changes when save button is clicked', async () => {
    renderComponent();
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      const expectedSession: Partial<BrainstormSession> = {
        ...MOCK_SESSION,
        nodes: MOCK_SESSION.nodes,
      };
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining(expectedSession));
    });
  });

  it('should close when close button is clicked', async () => {
    renderComponent();
    const closeButton = screen.getByRole('button', { name: /close/i });
    await userEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should support undo/redo operations', async () => {
    renderComponent();

    // Initial state should have both ideas
    expect(screen.getByText('Test Idea 1')).toBeInTheDocument();
    expect(screen.getByText('Test Idea 2')).toBeInTheDocument();

    // Mock a change and save
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Try undo
    const undoButton = screen.getByRole('button', { name: /undo/i });
    await userEvent.click(undoButton);

    // Try redo
    const redoButton = screen.getByRole('button', { name: /redo/i });
    await userEvent.click(redoButton);

    expect(screen.getByText('Test Idea 1')).toBeInTheDocument();
    expect(screen.getByText('Test Idea 2')).toBeInTheDocument();
  });

  it('should handle empty session gracefully', () => {
    renderComponent(undefined);
    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeInTheDocument();
  });

  it('should maintain node positions after save', async () => {
    const nodeWithPosition: BrainstormNode = {
      ...MOCK_NODE_BASE,
      position: { x: 100, y: 200 },
    };

    const sessionWithPositions: BrainstormSession = {
      ...MOCK_SESSION,
      nodes: [nodeWithPosition],
    };

    renderComponent(sessionWithPositions);
    const saveButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    await waitFor(() => {
      const expectedSession: Partial<BrainstormSession> = {
        ...sessionWithPositions,
        nodes: [
          expect.objectContaining({
            ...nodeWithPosition,
          }),
        ],
      };
      expect(mockOnSave).toHaveBeenCalledWith(expect.objectContaining(expectedSession));
    });
  });
});
