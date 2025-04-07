import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EnhancedBrainstormFlow } from '../../components/BrainstormFlow/EnhancedBrainstormFlow';
import { I18nProvider } from '../../contexts/I18nContext';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { NodeType } from '../../types';
import { mockResizeObserver } from '../test-utils';

// Mock ReactFlow
vi.mock('reactflow', async () => {
  const actual = await vi.importActual('reactflow');
  return {
    ...actual,
    ReactFlow: vi
      .fn()
      .mockImplementation(({ children }) => <div data-testid="react-flow">{children}</div>),
    useReactFlow: vi.fn().mockReturnValue({
      fitView: vi.fn(),
      zoomIn: vi.fn(),
      zoomOut: vi.fn(),
      setCenter: vi.fn(),
      getNodes: vi.fn().mockReturnValue([]),
      getEdges: vi.fn().mockReturnValue([]),
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      project: vi.fn().mockImplementation(({ x, y }) => ({ x, y })),
    }),
    Background: vi.fn().mockImplementation(() => <div data-testid="background" />),
    Controls: vi.fn().mockImplementation(() => <div data-testid="controls" />),
    MiniMap: vi.fn().mockImplementation(() => <div data-testid="minimap" />),
    ReactFlowProvider: vi.fn().mockImplementation(({ children }) => children),
    useNodesState: vi.fn().mockReturnValue([[], vi.fn()]),
    useEdgesState: vi.fn().mockReturnValue([[], vi.fn()]),
    addEdge: vi.fn().mockReturnValue([]),
  };
});

// Wrap component with required providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <I18nProvider>
      <SettingsProvider>{ui}</SettingsProvider>
    </I18nProvider>
  );
};

describe('EnhancedBrainstormFlow', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    mockResizeObserver();

    // Reset mocks
    vi.clearAllMocks();
  });

  it('renders with the correct initial nodes and edges', () => {
    // Create test data
    const nodes = [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        data: {
          label: 'Test Node 1',
          content: 'This is test node 1',
          tags: ['tag1'],
        },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-2',
        type: NodeType.TASK,
        data: {
          label: 'Test Node 2',
          content: 'This is test node 2',
          tags: ['tag2'],
        },
        position: { x: 200, y: 0 },
      },
    ];

    const edges = [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
        type: 'smoothstep',
      },
    ];

    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={nodes}
        initialEdges={edges}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Check that the component is rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // Check that the controls are rendered
    expect(screen.getByLabelText('Add Node')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom In')).toBeInTheDocument();
    expect(screen.getByLabelText('Zoom Out')).toBeInTheDocument();
    expect(screen.getByLabelText('Fit View')).toBeInTheDocument();
  });

  it('opens the add node dialog when the add button is clicked', async () => {
    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={[]}
        initialEdges={[]}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Click the add button
    fireEvent.click(screen.getByLabelText('Add Node'));

    // Check that the dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Add New Node')).toBeInTheDocument();
    });
  });

  it('adds a new node when the add node dialog is submitted', async () => {
    // Create a mock for onNodesChange
    const mockOnNodesChange = vi.fn();

    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={[]}
        initialEdges={[]}
        onNodesChange={mockOnNodesChange}
        onEdgesChange={vi.fn()}
      />
    );

    // Click the add button
    fireEvent.click(screen.getByLabelText('Add Node'));

    // Fill in the form
    await waitFor(() => {
      expect(screen.getByText('Add New Node')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'New Node' } });
    fireEvent.change(screen.getByLabelText('Content'), { target: { value: 'This is a new node' } });

    // Submit the form
    fireEvent.click(screen.getByText('Add'));

    // Check that onNodesChange was called
    await waitFor(() => {
      expect(mockOnNodesChange).toHaveBeenCalled();
    });
  });

  it('opens the edit node dialog when a node is clicked', async () => {
    // Create test data
    const nodes = [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        data: {
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={nodes}
        initialEdges={[]}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Simulate a node click
    // Since ReactFlow is mocked, we need to simulate the onNodeClick callback directly
    const instance = EnhancedBrainstormFlow.prototype;
    const onNodeClick = instance.onNodeClick || instance.handleNodeClick;

    if (onNodeClick) {
      onNodeClick.call(
        { setSelectedNode: instance.setSelectedNode, setNodeEditOpen: instance.setNodeEditOpen },
        { id: 'node-1' },
        {} // Event
      );
    }

    // Check that the edit dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Edit Node')).toBeInTheDocument();
    });
  });

  it('shows a confirmation dialog when a node is deleted', async () => {
    // Create test data
    const nodes = [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        data: {
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={nodes}
        initialEdges={[]}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Simulate a node delete request
    const instance = EnhancedBrainstormFlow.prototype;
    const handleNodeDeleteRequest = instance.handleNodeDeleteRequest;

    if (handleNodeDeleteRequest) {
      handleNodeDeleteRequest.call(
        {
          setNodeToDelete: instance.setNodeToDelete,
          setDeleteConfirmOpen: instance.setDeleteConfirmOpen,
          handleNodeDelete: instance.handleNodeDelete,
          settings: { skipDeleteConfirmation: false },
        },
        'node-1'
      );
    }

    // Check that the confirmation dialog is opened
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });
  });

  it('shows the chat panel when the chat button is clicked', async () => {
    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={[]}
        initialEdges={[]}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Check that the chat button is rendered
    const chatButton = screen.getByLabelText('Open Chat');
    expect(chatButton).toBeInTheDocument();

    // Click the chat button
    fireEvent.click(chatButton);

    // Check that the chat panel is opened
    await waitFor(() => {
      expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
    });
  });

  it('adds the "Don\'t ask again" checkbox to the delete confirmation dialog', async () => {
    // Mock the useSettings hook to return skipDeleteConfirmation: false
    vi.mock('../../contexts/SettingsContext', async () => {
      const actual = await vi.importActual('../../contexts/SettingsContext');
      return {
        ...actual,
        useSettings: () => ({
          settings: {
            skipDeleteConfirmation: false,
          },
          updateSettings: vi.fn(),
          getNodeColor: vi.fn().mockReturnValue('#e3f2fd'),
          nodePreferences: {
            nodeSizes: {
              small: { width: 150, fontSize: 0.8 },
              medium: { width: 200, fontSize: 1 },
              large: { width: 250, fontSize: 1.2 },
            },
          },
        }),
      };
    });

    // Create test data
    const nodes = [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        data: {
          label: 'Test Node',
          content: 'This is a test node',
          tags: [],
          onEdit: vi.fn(),
          onDelete: vi.fn(),
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(
      <EnhancedBrainstormFlow
        initialNodes={nodes}
        initialEdges={[]}
        onNodesChange={vi.fn()}
        onEdgesChange={vi.fn()}
      />
    );

    // Simulate a node delete request
    nodes[0].data.onDelete('node-1', new MouseEvent('click') as unknown as React.MouseEvent);

    // Wait for the confirmation dialog
    await waitFor(() => {
      expect(screen.getByText('Confirm Delete')).toBeInTheDocument();
    });

    // Check that the "Don't ask again" checkbox is rendered
    expect(screen.getByLabelText("Don't ask again")).toBeInTheDocument();
  });
});
