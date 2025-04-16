import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EnhancedBrainstormFlow } from '../../components/BrainstormFlow/EnhancedBrainstormFlow';
import { I18nProvider } from '../../contexts/I18nContext';
import { SettingsProvider } from '../../contexts/SettingsContext';
import { NodeType } from '../../types';
import { mockResizeObserver } from '../test-utils';

// Mock ReactFlow
type MockNode = {
  id: string;
  data?: { label?: string };
};

interface MockReactFlowProps {
  children: React.ReactNode;
  nodes: MockNode[];
}

// Mock components used in the test
vi.mock('../../components/NodeEditDialog', () => ({
  default: ({ open, onClose, dialogTitle, node }: any) =>
    open ? (
      <div role="dialog" aria-label={dialogTitle}>
        <h2>{dialogTitle}</h2>
        <div data-testid="edit-form">
          <span>Editing node: {node?.id}</span>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    ) : null
}));

vi.mock('../../components/DeleteConfirmationDialog', () => ({
  default: ({ open, onClose, onConfirm }: any) =>
    open ? (
      <div role="dialog" aria-label="Delete Confirmation">
        <h2>Delete Confirmation</h2>
        <div>Are you sure you want to delete this node?</div>
        <button onClick={onConfirm}>Delete</button>
        <button onClick={onClose}>Cancel</button>
        <label>
          <input type="checkbox" data-testid="dont-ask-again" />
          Don't ask again
        </label>
      </div>
    ) : null
}));

vi.mock('../../components/LLMChatPanel', () => ({
  default: ({ open, onClose }: any) =>
    open ? (
      <div role="dialog" aria-label="Chat">
        <h2>Chat Panel</h2>
        <textarea placeholder="Type your message..." />
        <button>Send</button>
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
}));

vi.mock('reactflow', async () => {
  const mockDispatch = vi.fn();
  const mockNodes = new Map();

  const NodeComponent = ({ id, data }: { id: string; data?: { label?: string } }) => (
    <div key={id} data-testid={`node-${id}`}>
      {data?.label}
      <button aria-label="Delete node" data-testid={`delete-${id}`} onClick={() => {
        mockNodes.get(id)?.onDelete?.();
      }} />
      <button aria-label="Chat panel" data-testid={`chat-${id}`} onClick={() => {
        mockNodes.get(id)?.onChat?.();
      }} />
    </div>
  );

  interface ReactFlowProps {
    children?: React.ReactNode;
    nodes?: Array<{
      id: string;
      data?: { label?: string };
    }>;
    onNodeClick?: (event: any, node: any) => void;
    onNodeDelete?: (node: any) => void;
  }

  const MockReactFlow = vi.fn().mockImplementation(({ children, nodes, onNodeClick, onNodeDelete }: ReactFlowProps) => {
    nodes?.forEach((node: any) => {
      mockNodes.set(node.id, {
        onDelete: () => {
          mockDispatch({ type: 'SHOW_DELETE_DIALOG', node });
          onNodeDelete?.(node);
        },
        onChat: () => {
          mockDispatch({ type: 'SHOW_CHAT_PANEL', node });
          onNodeClick?.(undefined, node);
        },
      });
    });

    return (
      <div data-testid="react-flow">
        {nodes?.map((node: any) => (
          <NodeComponent key={node.id} id={node.id} data={node.data} />
        ))}
        {children}
      </div>
    );
  });

  const mockComponents = {
    Panel: vi.fn().mockImplementation(() => <div data-testid="panel" />),
    Controls: vi.fn().mockImplementation(() => <div data-testid="controls" />),
    MiniMap: vi.fn().mockImplementation(() => <div data-testid="minimap" />),
    Background: vi.fn().mockImplementation(() => <div data-testid="background" />),
  };

  return {
    __esModule: true,
    default: MockReactFlow,
    ReactFlow: MockReactFlow,
    ...mockComponents,
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
          type: NodeType.IDEA,
          notes: 'This is test node 1',
        },
        position: { x: 0, y: 0 },
      },
      {
        id: 'node-2',
        type: NodeType.TASK,
        data: {
          label: 'Test Node 2',
          type: NodeType.TASK,
          notes: 'This is test node 2',
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
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={nodes} initialEdges={edges} />);

    // Check that the component is rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();

    // Check that the controls are rendered
    const addNodeButton = screen.getByRole('button', { name: 'Add node' });
    expect(addNodeButton).toBeInTheDocument();
  });

  it('opens the add node dialog when the add button is clicked', async () => {
    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} />);

    // Click the add button
    const addNodeButton = screen.getByRole('button', { name: 'Add node' });
    expect(addNodeButton).toBeInTheDocument();
    fireEvent.click(addNodeButton);

    // Click on a specific node type
    const addIdeaButton = screen.getByRole('menuitem', { name: 'Add Idea' });
    expect(addIdeaButton).toBeInTheDocument();
    fireEvent.click(addIdeaButton);

    // Check that the dialog is opened
    // Wait for the dialog (Material-UI)
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /add.*node/i });
      const title = screen.getByText(/add.*node/i);
      expect(dialog).toBeInTheDocument();
      expect(title).toBeInTheDocument();
    });
  });

  it('adds a new node when the add node dialog is submitted', async () => {
    // Create a mock for onNodesChange
    const mockOnNodesChange = vi.fn();

    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} />);

    // Click the add button
    const addNodeButton = screen.getByRole('button', { name: 'Add node' });
    expect(addNodeButton).toBeInTheDocument();
    fireEvent.click(addNodeButton);

    // Click on a specific node type
    const addIdeaButton = screen.getByRole('menuitem', { name: 'Add Idea' });
    expect(addIdeaButton).toBeInTheDocument();
    fireEvent.click(addIdeaButton);

    // Fill in the form
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /add.*node/i });
      expect(dialog).toBeInTheDocument();
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
          type: NodeType.IDEA,
          notes: 'This is a test node',
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={nodes} initialEdges={[]} />);

    // Simulate a node click
    // Since ReactFlow is mocked, we need to simulate the onNodeClick callback directly
    // Click the node itself
    const node = screen.getByTestId('node-node-1');
    expect(node).toBeInTheDocument();
    fireEvent.click(node);

    // Check that the edit dialog is opened
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /edit.*node/i });
      expect(dialog).toBeInTheDocument();
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
          type: NodeType.IDEA,
          notes: 'This is a test node',
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={nodes} initialEdges={[]} />);

    // Click the delete button
    const deleteButton = screen.getByTestId('delete-node-1');
    expect(deleteButton).toBeInTheDocument();
    fireEvent.click(deleteButton);

    // Check that the confirmation dialog is opened
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /delete.*confirmation/i });
      expect(dialog).toBeInTheDocument();
      
      // Check dialog content
      const confirmButton = screen.getByRole('button', { name: /delete/i });
      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(confirmButton).toBeInTheDocument();
      expect(cancelButton).toBeInTheDocument();
    });
  });

  it('shows the chat panel when the chat button is clicked', async () => {
    // Create test data
    const nodes = [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        data: {
          label: 'Test Node',
          type: NodeType.IDEA,
          notes: 'This is a test node',
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={nodes} initialEdges={[]} />);

    // Find and click the chat button
    const chatButton = screen.getByTestId('chat-node-1');
    expect(chatButton).toBeInTheDocument();
    fireEvent.click(chatButton);

    // Check that the chat panel is opened
    await waitFor(() => {
      const chatPanel = screen.getByRole('dialog', { name: /chat/i });
      expect(chatPanel).toBeInTheDocument();
      
      // Verify chat elements are present
      expect(screen.getByRole('textbox', { name: /message/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
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
          type: NodeType.IDEA,
          notes: 'This is a test node',
          onEdit: vi.fn(),
          onDelete: vi.fn(),
        },
        position: { x: 0, y: 0 },
      },
    ];

    // Render the component
    renderWithProviders(<EnhancedBrainstormFlow initialNodes={nodes} initialEdges={[]} />);

    // Simulate a node delete request
    nodes[0].data.onDelete('node-1', new MouseEvent('click') as unknown as React.MouseEvent);

    // Wait for the confirmation dialog
    await waitFor(() => {
      const dialog = screen.getByRole('dialog', { name: /delete.*confirmation/i });
      expect(dialog).toBeInTheDocument();
    });

    // Check that the "Don't ask again" checkbox is rendered
    expect(screen.getByLabelText("Don't ask again")).toBeInTheDocument();
  });
});
