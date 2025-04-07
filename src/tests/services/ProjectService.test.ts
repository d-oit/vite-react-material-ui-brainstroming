import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ProjectService } from '../../services/ProjectService';
import indexedDBService from '../../services/IndexedDBService';
import loggerService from '../../services/LoggerService';
import s3Service from '../../services/S3Service';
import gitService from '../../services/GitService';
import offlineService from '../../services/OfflineService';
import { ProjectTemplate } from '../../types/project';
import type { Project, ProjectHistoryEntry } from '../../types';

// Mock dependencies
vi.mock('../../services/IndexedDBService', () => ({
  default: {
    init: vi.fn().mockResolvedValue(true),
    getProjects: vi.fn(),
    saveProject: vi.fn(),
    deleteProject: vi.fn(),
    getProjectHistory: vi.fn(),
    saveProjectHistory: vi.fn(),
  },
}));

vi.mock('../../services/LoggerService', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}));

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
  
  // Mock crypto.randomUUID
  const mockUUID = 'test-uuid-1234';
  vi.spyOn(crypto, 'randomUUID').mockReturnValue(mockUUID);
  
  // Mock Date
  const mockDate = new Date('2023-01-01T00:00:00Z');
  vi.spyOn(global, 'Date').mockImplementation(() => mockDate as unknown as string);

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
      const template = ProjectTemplate.BLANK;

      const mockProject: Project = {
        id: mockUUID,
        name,
        description,
        template,
        createdAt: mockDate.toISOString(),
        updatedAt: mockDate.toISOString(),
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      vi.mocked(indexedDBService.saveProject).mockResolvedValueOnce(mockProject);

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
        projectService.createProject('Test', 'Description', ProjectTemplate.BLANK)
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
          template: ProjectTemplate.BLANK,
          createdAt: '2023-01-01T00:00:00Z',
          updatedAt: '2023-01-01T00:00:00Z',
          nodes: [],
          edges: [],
          version: '1.0.0',
        },
        {
          id: '2',
          name: 'Project 2',
          description: 'Description 2',
          template: ProjectTemplate.BUSINESS,
          createdAt: '2023-01-02T00:00:00Z',
          updatedAt: '2023-01-02T00:00:00Z',
          nodes: [],
          edges: [],
          version: '1.0.0',
        },
      ];

      vi.mocked(indexedDBService.getProjects).mockResolvedValueOnce(mockProjects);

      const result = await projectService.getProjects();

      expect(indexedDBService.getProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProjects);
    });

    it('should handle errors when getting projects', async () => {
      const error = new Error('Failed to get projects');
      vi.mocked(indexedDBService.getProjects).mockRejectedValueOnce(error);

      await expect(projectService.getProjects()).rejects.toThrow('Failed to get projects');

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get projects'),
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
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      vi.mocked(indexedDBService.getProjects).mockResolvedValueOnce([mockProject]);

      const result = await projectService.getProject('1');

      expect(indexedDBService.getProjects).toHaveBeenCalled();
      expect(result).toEqual(mockProject);
    });

    it('should return null if project is not found', async () => {
      vi.mocked(indexedDBService.getProjects).mockResolvedValueOnce([]);

      const result = await projectService.getProject('non-existent-id');

      expect(result).toBeNull();
    });

    it('should handle errors when getting a project', async () => {
      const error = new Error('Failed to get projects');
      vi.mocked(indexedDBService.getProjects).mockRejectedValueOnce(error);

      await expect(projectService.getProject('1')).rejects.toThrow('Failed to get projects');

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get project'),
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
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      const updatedProject: Project = {
        ...mockProject,
        name: 'Updated Project',
        description: 'Updated Description',
        updatedAt: mockDate.toISOString(),
      };

      vi.mocked(indexedDBService.saveProject).mockResolvedValueOnce(updatedProject);

      const result = await projectService.updateProject(updatedProject);

      expect(indexedDBService.saveProject).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updatedProject,
          updatedAt: mockDate.toISOString(),
        })
      );
      expect(result).toEqual(updatedProject);
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project updated'),
        expect.objectContaining({ projectId: '1' })
      );
    });

    it('should handle errors when updating a project', async () => {
      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      const error = new Error('Failed to save project');
      vi.mocked(indexedDBService.saveProject).mockRejectedValueOnce(error);

      await expect(projectService.updateProject(mockProject)).rejects.toThrow(
        'Failed to save project'
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to update project'),
        error
      );
    });
  });

  describe('deleteProject', () => {
    it('should delete a project', async () => {
      vi.mocked(indexedDBService.deleteProject).mockResolvedValueOnce(undefined);

      await projectService.deleteProject('1');

      expect(indexedDBService.deleteProject).toHaveBeenCalledWith('1');
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project deleted'),
        expect.objectContaining({ projectId: '1' })
      );
    });

    it('should handle errors when deleting a project', async () => {
      const error = new Error('Failed to delete project');
      vi.mocked(indexedDBService.deleteProject).mockRejectedValueOnce(error);

      await expect(projectService.deleteProject('1')).rejects.toThrow('Failed to delete project');

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to delete project'),
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

      expect(indexedDBService.getProjectHistory).toHaveBeenCalledWith('1');
      expect(result).toEqual(mockHistory);
    });

    it('should handle errors when getting project history', async () => {
      const error = new Error('Failed to get project history');
      vi.mocked(indexedDBService.getProjectHistory).mockRejectedValueOnce(error);

      await expect(projectService.getProjectHistory('1')).rejects.toThrow(
        'Failed to get project history'
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get project history'),
        error
      );
    });
  });

  describe('syncProject', () => {
    it('should sync a project with S3 when configured and online', async () => {
      vi.mocked(s3Service.isConfigured).mockReturnValueOnce(true);
      vi.mocked(offlineService.isOnline).mockReturnValueOnce(true);

      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      vi.mocked(s3Service.uploadProject).mockResolvedValueOnce(undefined);

      await projectService.syncProject(mockProject);

      expect(s3Service.uploadProject).toHaveBeenCalledWith(mockProject);
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project synced to S3'),
        expect.objectContaining({ projectId: '1' })
      );
    });

    it('should queue sync action when offline', async () => {
      vi.mocked(s3Service.isConfigured).mockReturnValueOnce(true);
      vi.mocked(offlineService.isOnline).mockReturnValueOnce(false);

      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      await projectService.syncProject(mockProject);

      expect(s3Service.uploadProject).not.toHaveBeenCalled();
      expect(offlineService.queueAction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'syncProject',
          data: { projectId: '1' },
        })
      );
      expect(loggerService.info).toHaveBeenCalledWith(
        expect.stringContaining('Project sync queued for offline'),
        expect.objectContaining({ projectId: '1' })
      );
    });

    it('should not sync if S3 is not configured', async () => {
      vi.mocked(s3Service.isConfigured).mockReturnValueOnce(false);

      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      await projectService.syncProject(mockProject);

      expect(s3Service.uploadProject).not.toHaveBeenCalled();
      expect(offlineService.queueAction).not.toHaveBeenCalled();
    });

    it('should handle errors when syncing a project', async () => {
      vi.mocked(s3Service.isConfigured).mockReturnValueOnce(true);
      vi.mocked(offlineService.isOnline).mockReturnValueOnce(true);

      const mockProject: Project = {
        id: '1',
        name: 'Project 1',
        description: 'Description 1',
        template: ProjectTemplate.BLANK,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2023-01-01T00:00:00Z',
        nodes: [],
        edges: [],
        version: '1.0.0',
      };

      const error = new Error('Failed to upload project');
      vi.mocked(s3Service.uploadProject).mockRejectedValueOnce(error);

      await expect(projectService.syncProject(mockProject)).rejects.toThrow(
        'Failed to upload project'
      );

      expect(loggerService.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to sync project to S3'),
        error
      );
    });
  });
});
