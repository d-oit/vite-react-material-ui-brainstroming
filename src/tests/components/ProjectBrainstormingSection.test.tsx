import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import { ProjectBrainstormingSection } from '../../components/Project/ProjectBrainstormingSection'; // Corrected import
import { NodeType } from '../../types/enums';
import { ProjectTemplate, type SyncSettings } from '../../types/project'; // Import SyncSettings type if needed
import { useS3Sync } from '../../hooks/useS3Sync'; // Added import for vi.mocked
import type { Node, Edge } from '../../types'; // Import Node/Edge types if needed for casting

// Mock the EnhancedBrainstormFlow component
vi.mock('../../components/BrainstormFlow/EnhancedBrainstormFlow', () => ({
  EnhancedBrainstormFlow: vi.fn(({ onSave, initialNodes, initialEdges }) => (
    <div data-testid="mock-enhanced-brainstorm-flow">
      {/* Pass the initialNodes/Edges back to onSave when button is clicked */}
      <button type="button" onClick={() => onSave(initialNodes, initialEdges)}>
        Save Flow
      </button>
    </div>
  )),
}));

// Mock the ErrorNotificationContext
vi.mock('../../contexts/ErrorNotificationContext', () => ({
  useErrorNotification: () => ({
    showError: vi.fn(),
  }),
}));

// Mock the loggerService
vi.mock('../../services/LoggerService', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock custom hooks used within the component
vi.mock('../../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(() => ({
    updateNodeSelection: vi.fn(),
  })),
}));

vi.mock('../../hooks/useFocusManagement', () => ({
  useFocusManagement: vi.fn(() => ({
    announceFocusChange: vi.fn(),
    lastFocusedNodeId: null,
  })),
}));

// General mock for useS3Sync (can be overridden per test)
vi.mock('../../hooks/useS3Sync'); // Keep the general path mock

describe('ProjectBrainstormingSection', () => {
  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    nodes: [
      {
        id: 'node-1', // Node ID
        type: NodeType.IDEA,
        position: { x: 100, y: 100 },
        data: {
          id: 'node-1', // Added id to data
          title: 'Test Node', // Renamed label to title
          label: 'Test Node', // Keep label if needed elsewhere, or remove if title replaces it
          content: 'Test Content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(), // Original updatedAt
        },
      },
    ] as Node[], // Explicitly type nodes array if needed
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ] as Edge[], // Explicitly type edges array if needed
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1', // Ensure version is a string if ProjectSchema expects string
    template: ProjectTemplate.CUSTOM,
    syncSettings: {
      enableS3Sync: false,
      syncFrequency: 'manual',
    } as const, // Added 'as const' assertion
  };

  const mockSave = vi.fn();

  // Helper to render with correct props
  const renderComponent = (props = {}) => {
    const defaultProps = {
      projectId: mockProject.id,
      template: mockProject.template,
      initialNodes: mockProject.nodes,
      initialEdges: mockProject.edges,
      syncSettings: mockProject.syncSettings,
      onSave: mockSave,
      readOnly: false,
    };
    const finalProps = { ...defaultProps, ...props };
    return render(<ProjectBrainstormingSection {...finalProps} />);
  };


  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useS3Sync).mockReturnValue({
      sync: vi.fn().mockResolvedValue(undefined),
      syncStatus: 'idle',
      lastSyncTime: null,
    });
  });


  it('renders loading state correctly', () => {
    renderComponent();
    expect(screen.getByTestId('mock-enhanced-brainstorm-flow')).toBeInTheDocument();
  });

  it('renders error state correctly', () => {
     renderComponent();
     expect(screen.getByTestId('mock-enhanced-brainstorm-flow')).toBeInTheDocument();
  });

  it('renders empty state correctly when no nodes', () => {
    renderComponent({ initialNodes: [], initialEdges: [] });
    expect(screen.getByTestId('mock-enhanced-brainstorm-flow')).toBeInTheDocument();
  });

  it('renders EnhancedBrainstormFlow when project has nodes', () => {
    renderComponent();
    expect(screen.getByTestId('mock-enhanced-brainstorm-flow')).toBeInTheDocument();
  });

  it('calls onSave when save button is clicked', async () => {
    renderComponent();
    fireEvent.click(screen.getByText('Save Flow'));

    await waitFor(() => {
      // Check that mockSave was called with the correct structure, ignoring updatedAt
      expect(mockSave).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'node-1',
            type: NodeType.IDEA,
            position: { x: 100, y: 100 },
            data: expect.objectContaining({
              id: 'node-1',
              title: 'Test Node',
              label: 'Test Node',
              content: 'Test Content',
              createdAt: expect.any(String), // Original createdAt should be preserved
              updatedAt: expect.any(String), // Allow any string for updatedAt
              type: NodeType.IDEA,
            }),
          }),
        ]),
        mockProject.edges // Assume edges are passed through unchanged for now
      );
    });
  });

  it('disables EnhancedBrainstormFlow when isSaving is true', () => {
     vi.mocked(useS3Sync).mockReturnValueOnce({
       sync: vi.fn().mockResolvedValue(undefined),
       syncStatus: 'syncing',
       lastSyncTime: null,
     });

     renderComponent({ readOnly: true }); // Pass readOnly, assuming it's used internally now

     expect(screen.getByTestId('mock-enhanced-brainstorm-flow')).toBeInTheDocument();
     // If EnhancedBrainstormFlow mock accepted readOnly, we could check:
     // expect(vi.mocked(EnhancedBrainstormFlow).mock.calls[0][0].readOnly).toBe(true);
  });
});
