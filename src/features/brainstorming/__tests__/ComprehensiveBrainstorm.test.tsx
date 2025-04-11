import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { ReactNode } from 'react';

import { I18nProvider } from '../../../contexts/I18nContext';
import ComprehensiveBrainstorm from '../ComprehensiveBrainstorm';
import type { BrainstormNode, BrainstormSession } from '../types';
import { MOCK_NODE_BASE, MOCK_SESSION, TEST_PROJECT_ID } from './constants';
import { mockGenerateId, setupTest } from './testUtils';

// Mock ReactFlow components and hooks
jest.mock('reactflow', () => ({
  ...jest.requireActual('reactflow'),
  ReactFlow: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Background: () => null,
  Controls: () => null,
  useNodesState: () => {
    const [nodes, setNodes] = React.useState<BrainstormNode[]>([]);
    return [nodes, setNodes, jest.fn()];
  },
  useEdgesState: () => {
    const [edges, setEdges] = React.useState<any[]>([]);
    return [edges, setEdges, jest.fn()];
  },
  MarkerType: {
    ArrowClosed: 'arrowclosed',
  },
}));

describe('ComprehensiveBrainstorm', () => {
  const mockOnSave = jest.fn();
  const mockOnClose = jest.fn();

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