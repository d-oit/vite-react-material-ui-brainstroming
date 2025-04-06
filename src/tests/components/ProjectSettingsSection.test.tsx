import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

import ProjectSettingsSection from '../../components/Project/ProjectSettingsSection';
import { NodeType } from '../../types/enums';
import { ProjectTemplate } from '../../types/project';

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

// Mock the s3Service
vi.mock('../../lib/s3Service', () => ({
  uploadProject: vi.fn().mockResolvedValue({}),
  downloadProject: vi.fn().mockResolvedValue({
    id: 'test-project-id',
    name: 'Test Project from S3',
    description: 'Test Description from S3',
    nodes: [],
    edges: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
  }),
}));

describe('ProjectSettingsSection', () => {
  const mockProject = {
    id: 'test-project-id',
    name: 'Test Project',
    description: 'Test Description',
    nodes: [
      {
        id: 'node-1',
        type: NodeType.IDEA,
        position: { x: 100, y: 100 },
        data: {
          label: 'Test Node',
          content: 'Test Content',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      },
    ],
    edges: [
      {
        id: 'edge-1',
        source: 'node-1',
        target: 'node-2',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    template: ProjectTemplate.CUSTOM,
    syncSettings: {
      enableS3Sync: false,
      syncFrequency: 'manual',
      intervalMinutes: 30,
    },
  };

  const mockSave = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders error state correctly', () => {
    render(<ProjectSettingsSection project={mockProject} onSave={mockSave} error="Test error" />);

    expect(screen.getByText('Test error')).toBeInTheDocument();
  });

  it('renders S3 synchronization section', () => {
    render(<ProjectSettingsSection project={mockProject} onSave={mockSave} />);

    expect(screen.getByText('S3 Synchronization')).toBeInTheDocument();
    expect(screen.getByText('Enable S3 Synchronization')).toBeInTheDocument();
  });

  it('renders import/export section', () => {
    render(<ProjectSettingsSection project={mockProject} onSave={mockSave} />);

    expect(screen.getByText('Import/Export')).toBeInTheDocument();
    expect(screen.getByText('Local File')).toBeInTheDocument();
    expect(screen.getByText('S3 Storage')).toBeInTheDocument();
  });

  it('toggles S3 sync when switch is clicked', async () => {
    render(<ProjectSettingsSection project={mockProject} onSave={mockSave} />);

    const switchElement = screen.getByRole('checkbox');
    fireEvent.click(switchElement);

    await waitFor(() => {
      expect(mockSave).toHaveBeenCalledWith(
        expect.objectContaining({
          syncSettings: expect.objectContaining({
            enableS3Sync: true,
          }),
        })
      );
    });
  });

  it('shows sync frequency options when S3 sync is enabled', async () => {
    const projectWithSyncEnabled = {
      ...mockProject,
      syncSettings: {
        ...mockProject.syncSettings,
        enableS3Sync: true,
      },
    };

    render(<ProjectSettingsSection project={projectWithSyncEnabled} onSave={mockSave} />);

    expect(screen.getByLabelText('Sync Frequency')).toBeInTheDocument();
  });

  it('shows interval input when sync frequency is set to interval', async () => {
    const projectWithIntervalSync = {
      ...mockProject,
      syncSettings: {
        ...mockProject.syncSettings,
        enableS3Sync: true,
        syncFrequency: 'interval',
      },
    };

    render(<ProjectSettingsSection project={projectWithIntervalSync} onSave={mockSave} />);

    expect(screen.getByLabelText('Interval (minutes)')).toBeInTheDocument();
  });

  it('disables buttons when isSaving is true', () => {
    render(<ProjectSettingsSection project={mockProject} onSave={mockSave} isSaving={true} />);

    const exportButton = screen.getByText('Export to File');
    expect(exportButton).toBeDisabled();
  });
});
