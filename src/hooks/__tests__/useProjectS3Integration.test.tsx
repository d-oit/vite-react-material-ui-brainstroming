import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

import { uploadProject, downloadProject, isS3Enabled } from '../../lib/s3Service';
import ToastProviderWrapper from '../../tests/wrappers/ToastProviderWrapper';
import type { Project } from '../../types';
import { ProjectTemplate } from '../../types/project';
import { hasProjectChanged } from '../../utils/projectUtils';
import { useProject } from '../useProject';

// Import the mocked modules

// Define mockProject at the top level since vi.mock is hoisted
const mockProject: Project = {
  id: 'test-project-id',
  name: 'Test Project',
  description: 'Test Description',
  createdAt: '2023-01-01T00:00:00.000Z',
  updatedAt: '2023-01-01T00:00:00.000Z',
  version: '1.0.0',
  template: ProjectTemplate.CUSTOM,
  nodes: [],
  edges: [],
  syncSettings: {
    enableS3Sync: false,
    syncFrequency: 'manual',
    intervalMinutes: 30,
  },
};

// Mock the s3Service
vi.mock('../../lib/s3Service', () => ({
  uploadProject: vi.fn(),
  downloadProject: vi.fn(),
  isS3Enabled: vi.fn(),
}));

// Mock the projectService
vi.mock('../../services/ProjectService', () => {
  return {
    default: {
      getProject: vi.fn().mockResolvedValue(mockProject),
      updateProject: vi.fn().mockResolvedValue(true),
    },
  };
});

// Mock the hasProjectChanged function
vi.mock('../../utils/projectUtils', () => ({
  hasProjectChanged: vi.fn(),
}));

describe('useProject S3 integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.useFakeTimers();

    // Default mock implementations
    vi.mocked(hasProjectChanged).mockReturnValue(false);
    vi.mocked(downloadProject).mockResolvedValue(mockProject);
    vi.mocked(isS3Enabled).mockReturnValue(false); // Default to S3 disabled
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not attempt S3 upload when S3 is disabled', async () => {
    // Ensure S3 is disabled
    vi.mocked(isS3Enabled).mockReturnValue(false);

    // Render the hook
    const { result } = renderHook(
      () =>
        useProject({
          projectId: 'test-project-id',
        }),
      { wrapper: ToastProviderWrapper }
    );

    // Wait for the project to load
    await vi.runAllTimersAsync();

    // Attempt to save the project
    await act(async () => {
      await result.current.saveProject({
        ...mockProject,
        name: 'Updated Name',
      });
    });

    // Verify uploadProject was not called
    expect(uploadProject).not.toHaveBeenCalled();
  });

  it('should not attempt S3 upload when project has S3 sync disabled', async () => {
    // Enable S3 globally but keep project sync disabled
    vi.mocked(isS3Enabled).mockReturnValue(true);

    // Render the hook
    const { result } = renderHook(
      () =>
        useProject({
          projectId: 'test-project-id',
        }),
      { wrapper: ToastProviderWrapper }
    );

    // Wait for the project to load
    await vi.runAllTimersAsync();

    // Attempt to save the project with S3 sync disabled
    await act(async () => {
      await result.current.saveProject({
        ...mockProject,
        syncSettings: {
          ...mockProject.syncSettings,
          enableS3Sync: false,
        },
      });
    });

    // Verify uploadProject was not called
    expect(uploadProject).not.toHaveBeenCalled();
  });

  it('should attempt S3 upload when both S3 is enabled and project has S3 sync enabled', async () => {
    // Enable S3 globally
    vi.mocked(isS3Enabled).mockReturnValue(true);

    // Render the hook
    const { result } = renderHook(
      () =>
        useProject({
          projectId: 'test-project-id',
        }),
      { wrapper: ToastProviderWrapper }
    );

    // Wait for the project to load
    await vi.runAllTimersAsync();

    // Attempt to save the project with S3 sync enabled
    await act(async () => {
      await result.current.saveProject({
        ...mockProject,
        syncSettings: {
          ...mockProject.syncSettings,
          enableS3Sync: true,
        },
      });
    });

    // Verify uploadProject was called
    expect(uploadProject).toHaveBeenCalled();
  });

  it('should not attempt S3 upload in createNewVersion when S3 is disabled', async () => {
    // Ensure S3 is disabled
    vi.mocked(isS3Enabled).mockReturnValue(false);

    // Render the hook
    const { result } = renderHook(
      () =>
        useProject({
          projectId: 'test-project-id',
        }),
      { wrapper: ToastProviderWrapper }
    );

    // Wait for the project to load
    await vi.runAllTimersAsync();

    // Attempt to create a new version
    await act(async () => {
      await result.current.createNewVersion();
    });

    // Verify uploadProject was not called
    expect(uploadProject).not.toHaveBeenCalled();
  });

  it('should not attempt S3 upload in createNewVersion when project has S3 sync disabled', async () => {
    // Enable S3 globally but keep project sync disabled
    vi.mocked(isS3Enabled).mockReturnValue(true);

    // Mock ProjectService to return a project with S3 sync disabled
    const projectService = await import('../../services/ProjectService');
    vi.mocked(projectService.default.getProject).mockResolvedValueOnce({
      ...mockProject,
      syncSettings: {
        ...mockProject.syncSettings,
        enableS3Sync: false,
      },
    });

    // Render the hook
    const { result } = renderHook(
      () =>
        useProject({
          projectId: 'test-project-id',
        }),
      { wrapper: ToastProviderWrapper }
    );

    // Wait for the project to load
    await vi.runAllTimersAsync();

    // Attempt to create a new version
    await act(async () => {
      await result.current.createNewVersion();
    });

    // Verify uploadProject was not called
    expect(uploadProject).not.toHaveBeenCalled();
  });

  it('should attempt S3 upload in createNewVersion when both S3 is enabled and project has S3 sync enabled', async () => {
    // Enable S3 globally
    vi.mocked(isS3Enabled).mockReturnValue(true);

    // Create a project with S3 sync enabled
    const projectWithS3Enabled = {
      ...mockProject,
      syncSettings: {
        ...mockProject.syncSettings,
        enableS3Sync: true,
      },
    };

    // Mock ProjectService to return a project with S3 sync enabled
    const projectService = await import('../../services/ProjectService');
    vi.mocked(projectService.default.getProject).mockResolvedValue(projectWithS3Enabled);

    // Render the hook with a project that has S3 sync enabled
    let result: any;
    await act(async () => {
      const rendered = renderHook(
        () =>
          useProject({
            projectId: 'test-project-id',
          }),
        { wrapper: ToastProviderWrapper }
      );
      result = rendered.result;

      // Wait for the project to load
      await vi.runAllTimersAsync();
    });

    // Manually set the project in the hook's state to ensure it's loaded with S3 sync enabled
    await act(async () => {
      await result.current.saveProject(projectWithS3Enabled);
    });

    // Attempt to create a new version
    await act(async () => {
      await result.current.createNewVersion();
    });

    // Verify uploadProject was called
    expect(uploadProject).toHaveBeenCalled();
  });
});
