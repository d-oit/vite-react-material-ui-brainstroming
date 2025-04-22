import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { EnhancedBrainstormFlow } from './EnhancedBrainstormFlow';
import { useBrainstormStore } from '../../store/brainstormStore';
import { useSettings } from '../../contexts/SettingsContext';

// Mock the ReactFlow component and other dependencies
vi.mock('reactflow', async () => {
  return {
    Background: () => <div data-testid="background" />,
    Panel: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="panel">{children}</div>
    ),
    addEdge: vi.fn(),
    applyNodeChanges: vi.fn(),
    applyEdgeChanges: vi.fn(),
    ReactFlow: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="react-flow">{children}</div>
    ),
    // Add default export
    default: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="react-flow">{children}</div>
    ),
  };
});

// Mock the hooks
vi.mock('../../store/brainstormStore', () => ({
  useBrainstormStore: vi.fn(),
}));

vi.mock('../../contexts/SettingsContext', () => ({
  useSettings: vi.fn(),
}));

// Mock the components
vi.mock('./EnhancedMiniMap', () => ({
  __esModule: true,
  default: () => <div data-testid="minimap" />,
  EnhancedMiniMap: () => <div data-testid="minimap" />,
}));

vi.mock('./FloatingControls', () => ({
  FloatingControls: () => <div data-testid="floating-controls" />,
}));

describe('EnhancedBrainstormFlow', () => {
  beforeEach(() => {
    // Setup mocks
    (useBrainstormStore as any).mockReturnValue({
      nodes: [],
      edges: [],
      setNodes: vi.fn(),
      setEdges: vi.fn(),
      addNode: vi.fn(),
    });

    (useSettings as any).mockReturnValue({
      settings: {
        autoSave: true,
      },
      nodePreferences: {
        nodeSizes: {
          small: { width: 150, fontSize: 0.8 },
          medium: { width: 200, fontSize: 1 },
          large: { width: 300, fontSize: 1.2 },
        },
      },
    });
  });

  it('renders without crashing', () => {
    render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />);

    // Check if the main components are rendered
    expect(screen.getByTestId('react-flow')).toBeInTheDocument();
  });

  it('renders controls and minimap', () => {
    render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />);

    // Check if controls and minimap are rendered
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(screen.getByTestId('minimap')).toBeInTheDocument();
  });

  it('toggles fullscreen mode when fullscreen button is clicked', () => {
    // Mock document methods
    const requestFullscreenMock = vi.fn();
    const exitFullscreenMock = vi.fn();

    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      value: requestFullscreenMock,
      writable: true,
    });

    Object.defineProperty(document, 'exitFullscreen', {
      value: exitFullscreenMock,
      writable: true,
    });

    render(<EnhancedBrainstormFlow initialNodes={[]} initialEdges={[]} onSave={vi.fn()} />);

    // Find and click the fullscreen button
    const fullscreenButton = screen.getAllByRole('button')[2]; // Third button is fullscreen
    fireEvent.click(fullscreenButton);

    // Check if requestFullscreen was called
    expect(requestFullscreenMock).toHaveBeenCalled();
  });
});
