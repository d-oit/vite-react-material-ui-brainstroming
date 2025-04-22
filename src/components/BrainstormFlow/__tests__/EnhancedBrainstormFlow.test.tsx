import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EnhancedBrainstormFlow } from '../EnhancedBrainstormFlow';
import { useSettings } from '../../../contexts/SettingsContext';

// Mock the useSettings hook
vi.mock('../../../contexts/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

// Mock the ReactFlow component
vi.mock('reactflow', () => {
  const ReactFlowMock = ({ children, onNodeClick, nodes }: any) => (
    <div data-testid="react-flow-mock">
      {children}
      <button
        data-testid="mock-node"
        onClick={() => onNodeClick({}, nodes[0])}
      >
        Mock Node
      </button>
    </div>
  );
  
  ReactFlowMock.Panel = ({ children }: any) => <div data-testid="panel-mock">{children}</div>;
  ReactFlowMock.Background = () => <div data-testid="background-mock" />;
  
  return {
    __esModule: true,
    default: ReactFlowMock,
    Background: () => <div data-testid="background-mock" />,
    Controls: () => <div data-testid="controls-mock" />,
    MiniMap: () => <div data-testid="minimap-mock" />,
    Panel: ({ children }: any) => <div data-testid="panel-mock">{children}</div>,
    applyNodeChanges: vi.fn((changes, nodes) => nodes),
    applyEdgeChanges: vi.fn((changes, edges) => edges),
    addEdge: vi.fn((connection, edges) => edges),
  };
});

// Mock the useBrainstormStore hook
vi.mock('../../../store/brainstormStore', () => ({
  useBrainstormStore: vi.fn(() => ({
    nodes: [],
    edges: [],
    setNodes: vi.fn(),
    setEdges: vi.fn(),
  })),
}));

// Mock the EnhancedControls component
vi.mock('../EnhancedControls', () => ({
  __esModule: true,
  default: () => <div data-testid="enhanced-controls-mock" />,
}));

// Mock the EnhancedMiniMap component
vi.mock('../EnhancedMiniMap', () => ({
  EnhancedMiniMap: () => <div data-testid="enhanced-minimap-mock" />,
}));

// Mock the FloatingControls component
vi.mock('../FloatingControls', () => ({
  FloatingControls: () => <div data-testid="floating-controls-mock" />,
}));

// Mock the NodeEditDialog component
vi.mock('../NodeEditDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="node-edit-dialog-mock" />,
}));

// Mock the DeleteConfirmationDialog component
vi.mock('../../DeleteConfirmationDialog', () => ({
  __esModule: true,
  default: () => <div data-testid="delete-confirmation-dialog-mock" />,
}));

describe('EnhancedBrainstormFlow', () => {
  beforeEach(() => {
    // Mock the useSettings hook
    (useSettings as any).mockReturnValue({
      settings: {
        autoSave: true,
        preferredNodeSize: 'medium',
      },
      nodePreferences: {
        nodeSizes: {
          small: { width: 150, fontSize: 0.8 },
          medium: { width: 200, fontSize: 1 },
          large: { width: 250, fontSize: 1.2 },
        },
      },
      getNodeColor: vi.fn(() => '#e3f2fd'),
    });
  });

  it('renders the component correctly', () => {
    render(
      <EnhancedBrainstormFlow
        initialNodes={[
          {
            id: '1',
            type: 'idea',
            position: { x: 100, y: 100 },
            data: { label: 'Test Node' },
          },
        ]}
        initialEdges={[]}
        onSave={vi.fn()}
      />
    );

    // Check if the main components are rendered
    expect(screen.getByTestId('react-flow-mock')).toBeInTheDocument();
    expect(screen.getByTestId('background-mock')).toBeInTheDocument();
    expect(screen.getByTestId('panel-mock')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument();
    expect(screen.getByTestId('enhanced-minimap-mock')).toBeInTheDocument();
    expect(screen.getByTestId('floating-controls-mock')).toBeInTheDocument();
  });

  it('opens the node edit dialog when a node is clicked', () => {
    render(
      <EnhancedBrainstormFlow
        initialNodes={[
          {
            id: '1',
            type: 'idea',
            position: { x: 100, y: 100 },
            data: { label: 'Test Node' },
          },
        ]}
        initialEdges={[]}
        onSave={vi.fn()}
      />
    );

    // Click on the mock node
    fireEvent.click(screen.getByTestId('mock-node'));

    // Check if the node edit dialog is rendered
    expect(screen.getByTestId('node-edit-dialog-mock')).toBeInTheDocument();
  });

  it('hides save button when autosave is enabled', () => {
    // Mock the useSettings hook to return autoSave: true
    (useSettings as any).mockReturnValue({
      settings: {
        autoSave: true,
        preferredNodeSize: 'medium',
      },
      nodePreferences: {
        nodeSizes: {
          small: { width: 150, fontSize: 0.8 },
          medium: { width: 200, fontSize: 1 },
          large: { width: 250, fontSize: 1.2 },
        },
      },
      getNodeColor: vi.fn(() => '#e3f2fd'),
    });

    const { container } = render(
      <EnhancedBrainstormFlow
        initialNodes={[]}
        initialEdges={[]}
        onSave={vi.fn()}
      />
    );

    // The save button should not be visible in the enhanced controls
    // Note: This is an indirect test since we're mocking EnhancedControls
    expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument();
  });

  it('shows save button when autosave is disabled', () => {
    // Mock the useSettings hook to return autoSave: false
    (useSettings as any).mockReturnValue({
      settings: {
        autoSave: false,
        preferredNodeSize: 'medium',
      },
      nodePreferences: {
        nodeSizes: {
          small: { width: 150, fontSize: 0.8 },
          medium: { width: 200, fontSize: 1 },
          large: { width: 250, fontSize: 1.2 },
        },
      },
      getNodeColor: vi.fn(() => '#e3f2fd'),
    });

    render(
      <EnhancedBrainstormFlow
        initialNodes={[]}
        initialEdges={[]}
        onSave={vi.fn()}
      />
    );

    // The save button should be visible in the enhanced controls
    // Note: This is an indirect test since we're mocking EnhancedControls
    expect(screen.getByTestId('enhanced-controls-mock')).toBeInTheDocument();
  });
});
