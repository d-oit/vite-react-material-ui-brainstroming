import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import _gitService from '../../services/GitService';
import indexedDBService from '../../services/IndexedDBService';
import loggerService from '../../services/LoggerService';
import _offlineService from '../../services/OfflineService';
import { ProjectService } from '../../services/ProjectService';
import _s3Service from '../../services/S3Service';
// Import correct types
import type { Project, ProjectHistoryEntry, Node, Edge } from '../../types';
// Import ProjectTemplate enum and SyncSettings type from correct path
import { ProjectTemplate, type SyncSettings } from '../../types/project';

// Mock dependencies
vi.mock('../../services/IndexedDBService', () => ({
  default: {
    init: vi.fn().mockResolvedValue(true),
    getAllProjects: vi.fn(),
    getProject: vi.fn(),
    // Mock saveProject to resolve with the project ID (string)
    saveProject: vi.fn().mockImplementation((project: Project) => Promise.resolve(project.id)),
    deleteProject: vi.fn(),
    getProjectHistory: vi.fn(),
    addProjectHistoryEntry: vi.fn(),
  },
}));

// Mock LoggerService to provide getInstance and the logging methods
vi.mock('../../services/LoggerService', () => {
  const mockLoggerInstance = {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
    log: vi.fn(),
    configure: vi.fn(),
    getLogs: vi.fn().mockResolvedValue([]),
    clearLogs: vi.fn().mockResolvedValue(undefined),
    initialize: vi.fn().mockResolvedValue(true),
  };
  return {
    default: {
      getInstance: vi.fn(() => mockLoggerInstance),
      info: mockLoggerInstance.info,
      error: mockLoggerInstance.error,
      warn: mockLoggerInstance.warn,
      debug: mockLoggerInstance.debug,
      log: mockLoggerInstance.log,
      configure: mockLoggerInstance.configure,
      getLogs: mockLoggerInstance.getLogs,
      clearLogs: mockLoggerInstance.clearLogs,
      initialize: mockLoggerInstance.initialize,
    },
    LoggerService: vi.fn(() => mockLoggerInstance),
  };
});

vi.mock('../../services/S3Service', () => ({
  default: {
    isConfigured: vi.fn().mockReturnValue(false),
    uploadProject: vi.fn(),
    downloadProject: vi.fn(),
    listProjects: vi.fn(),
    deleteProject: vi.fn(),
  },
}));

vi.mock('../../services/GitService', () => ({
  default: {
    isConfigured: vi.fn().mockReturnValue(false),
    commitProject: vi.fn(),
    pushProject: vi.fn(),
    pullProject: vi.fn(),
  },
}));

vi.mock('../../services/OfflineService', () => ({
  default: {
    isOnline: vi.fn().mockReturnValue(true),
    queueAction: vi.fn(),
    processQueue: vi.fn(),
  },
}));

vi.mock('../../data/projectTemplates', () => ({
  projectTemplates: {
    blank: { name: 'Blank Project', description: 'A blank project' },
    business: { name: 'Business Project', description: 'A business project' },
  },
  createProjectFromTemplate: vi.fn().mockImplementation((template, name, description) => ({
    id: 'mock-project-id',
    name,
    description,
    template,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    nodes: [],
    edges: [],
    version: '1.0.0',
  })),
}));

describe('ProjectService', () => {
  let projectService: ProjectService;

  // Mock crypto.randomUUID with a valid format
  const mockUUID = '1b9d6bcd-bbfd-4b2d-9b5d-ab8dfbbd4bed';
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);

  // Mock Date correctly
  const mockDate = new Date('2023-01-01T00:00:00Z');
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate); // Return Date object

  beforeEach(() => {
    vi.clearAllMocks();
    projectService = ProjectService.getInstance();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInstance', () => {
    it('should return a singleton instance', () => {
      const instance1 = ProjectService.getInstance();
      const instance2 = ProjectService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('createProject', () => {
    it('should create a new project from template', async () => {
      const name = 'Test Project';
      const description = 'A test project';
      const template = ProjectTemplate.CUSTOM; // Use valid enum

      const mockProject: Project = {
        id: mockUUID,
        name,
        description,
        template,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        nodes: [] as Node[], // Add type assertion
        edges: [] as Edge[], // Add type assertion
        version: '1.0.0',
        syncSettings: { // Add missing syncSettings
          enableS3Sync: false,
          syncFrequency: 'manual',
        },
      };

      // saveProject mock now resolves string ID, adjust test if needed or mock implementation
      // Assuming createProject returns the full project object after saving
      vi.mocked(indexedDBService.saveProject).mockResolvedValueOnce(mockUUID); // Mock resolves ID
      // If createProject needs the full object, mock getProject after save
      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject);


      const result = await projectService.createProject(name, description, template);

      expect(indexedDBService.saveProject).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project created'),
        expect.objectContaining({ projectId: mockUUID })
      );
    });

    it('should handle errors when creating a project', async () => {
      const error = new Error('Failed to save project');
      vi.mocked(indexedDBService.saveProject).mockRejectedValueOnce(error);

      await expect(
        projectService.createProject('Test', 'Description', ProjectTemplate.CUSTOM) // Use valid enum
      ).rejects.toThrow('Failed to save project');

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to create project'),
        error
      );
    });
  });

  describe('getProjects', () => {
    it('should return all projects', async () => {
      const mockProjects: Project[] = [
        {
          id: '1',
          name: 'Project 1',
          description: 'Description 1',
          template: ProjectTemplate.CUSTOM, // Use valid enum
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          nodes: [] as Node[],
          edges: [] as Edge[],
          version: '1.0.0',
          syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
        },
        {
          id: '2',
          name: 'Project 2',
          description: 'Description 2',
          template: ProjectTemplate.SOFTWARE_DEVELOPMENT, // Use valid enum
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          nodes: [] as Node[],
          edges: [] as Edge[],
          version: '1.0.0',
          syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
        },
      ];

      vi.mocked(indexedDBService.getAllProjects).mockResolvedValueOnce(mockProjects);

      const result = await projectService.getProjects();

      expect(indexedDBService.getAllProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });

    it('should handle errors when getting projects', async () => {
      const error = new Error('Failed to get projects');
      vi.mocked(indexedDBService.getAllProjects).mockRejectedValueOnce(error);

      // The method handles errors and returns an empty array
      const result = await projectService.getProjects();

      expect(result).toEqual([]);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting projects'),
        error
      );
    });
  });

  describe('getProject', () => {
    it('should return a specific project by ID', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.CUSTOM, // Use valid enum
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [] as Node[],
        edges: [] as Edge[],
        version: '1.0.0',
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
      };

      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject);

      const result = await projectService.getProject('1');

      expect(indexedDBService.getProject).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockProject);
    });

    it('should return null if project is not found', async () => {
      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(null);

      const result = await projectService.getProject('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle errors when getting a project', async () => {
      const error = new Error('Failed to get project');
      vi.mocked(indexedDBService.getProject).mockRejectedValueOnce(error);

      // The method handles errors and returns null
      const result = await projectService.getProject('1');

      expect(result).toBeNull();
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting project 1'),
        error
      );
    });
  });

  describe('updateProject', () => {
    it('should update an existing project', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.CUSTOM, // Use valid enum
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [] as Node[],
        edges: [] as Edge[],
        version: '1.0.0',
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
      };

      const updatedProject: Project = {
        ...mockProject,
        name: 'Updated Project',
        description: 'Updated Description',
        updatedAt: mockDate.toISOString(),
      };

      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject);
      // saveProject resolves ID, getProject returns updated object
      vi.mocked(indexedDBService.saveProject).mockResolvedValueOnce(updatedProject.id);
      vi.mocked(indexedDBService.getProject)
        .mockResolvedValueOnce(mockProject) // For the initial check in updateProject
        .mockResolvedValueOnce(updatedProject); // For returning after save

      const result = await projectService.updateProject(updatedProject);

      expect(indexedDBService.getProject).toHaveBeenCalledWith('1');
      expect(indexedDBService.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedProject,
          updatedAt: mockDate.toISOString(),
        })
      );
      expect(result).toEqual(
        expect.objectContaining({
          ...updatedProject,
          updatedAt: mockDate.toISOString(),
        })
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project updated'),
        expect.any(Object)
      );
    });

    it('should handle errors when updating a project', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.CUSTOM, // Use valid enum
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [] as Node[],
        edges: [] as Edge[],
        version: '1.0.0',
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
      };

      const error = new Error('Failed to save project');
      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject);
      vi.mocked(indexedDBService.saveProject).mockRejectedValueOnce(error);

      await expect(projectService.updateProject(mockProject)).rejects.toThrow(
        'Failed to update project'
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error updating project'),
        error
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.CUSTOM, // Use valid enum
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [] as Node[],
        edges: [] as Edge[],
        version: '1.0.0',
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
      };

      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProject);
      vi.mocked(indexedDBService.deleteProject).mockResolvedValueOnce(undefined);

      await projectService.deleteProject('1');

      expect(indexedDBService.getProject).toHaveBeenCalledWith('1');
      expect(indexedDBService.deleteProject).toHaveBeenCalledWith('1');
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project deleted'),
        expect.any(Object)
      );
    });

    it('should handle errors when deleting a project', async () => {
      const error = new Error('Failed to delete project');
      // Define the mock project object with the correct type first
      const mockProjectForGet: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.CUSTOM, // Use valid enum
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [] as Node[],
        edges: [] as Edge[],
        version: '1.0.0',
        syncSettings: { enableS3Sync: false, syncFrequency: 'manual' }, // Add syncSettings
      };
      vi.mocked(indexedDBService.getProject).mockResolvedValueOnce(mockProjectForGet); // Pass the typed object
      vi.mocked(indexedDBService.deleteProject).mockRejectedValueOnce(error);

      await expect(projectService.deleteProject('1')).rejects.toThrow('Failed to delete project');

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error deleting project'),
        error
      );
    });
  });

  describe('getProjectHistory', () => {
    it('should return project history', async () => {
      const mockHistory: ProjectHistoryEntry[] = [
        {
          id: '1',
          projectId: '1',
          timestamp: '2023-01-01T00:00:00Z',
          action: 'create',
          data: { name: 'Project 1' },
        },
        {
          id: '2',
          projectId: '1',
          timestamp: '2023-01-02T00:00:00Z',
          action: 'update',
          data: { name: 'Updated Project 1' },
        },
      ];

      vi.mocked(indexedDBService.getProjectHistory).mockResolvedValueOnce(mockHistory);

      const result = await projectService.getProjectHistory('1');

      expect(indexedDBService.getProjectHistory).toHaveBeenCalledWith('1', 100);
      expect(result).toEqual(mockHistory);
    });

    it('should handle errors when getting project history', async () => {
      const error = new Error('Failed to get project history');
      vi.mocked(indexedDBService.getProjectHistory).mockRejectedValueOnce(error);

      // The method handles errors and returns an empty array
      const result = await projectService.getProjectHistory('1');

      expect(result).toEqual([]);
      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Error getting project history'),
        error
      );
    });
  });

  // Note: syncProject method is not implemented in the current version of ProjectService
  // These tests will be added when the method is implemented
});
