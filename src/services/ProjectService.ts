import { Project, Node, Edge, ProjectHistoryEntry } from '../types';
import gitService from './GitService';
import s3Service from './S3Service';
import indexedDBService from './IndexedDBService';
import loggerService from './LoggerService';
import offlineService from './OfflineService';

/**
 * Service for managing projects
 */
export class ProjectService {
  private static instance: ProjectService;

  private constructor() {
    // Initialize IndexedDB
    indexedDBService.init().catch(error => {
      console.error('Failed to initialize IndexedDB:', error);
      loggerService.error(
        'Failed to initialize IndexedDB',
        error instanceof Error ? error : new Error(String(error))
      );
    });
  }

  public static getInstance(): ProjectService {
    if (!ProjectService.instance) {
      ProjectService.instance = new ProjectService();
    }
    return ProjectService.instance;
  }

  /**
   * Create a new project
   * @param name Project name
   * @param description Project description
   * @returns Promise that resolves with the newly created project
   */
  public async createProject(name: string, description: string): Promise<Project> {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      lastAccessedAt: now,
      version: '0.1.0',
      nodes: [],
      edges: [],
      isArchived: false,
    };

    try {
      // Save to IndexedDB
      await indexedDBService.saveProject(project);

      // Add history entry
      await indexedDBService.addProjectHistoryEntry({
        projectId: project.id,
        action: 'create',
        timestamp: now,
        details: { version: project.version },
      });

      // Create initial commit
      await gitService.commit(project, 'Initial commit');

      loggerService.info(`Project created: ${project.id} - ${project.name}`);
      return project;
    } catch (error) {
      loggerService.error(
        'Error creating project',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to create project');
    }
  }

  /**
   * Get all projects
   * @param includeArchived Whether to include archived projects
   * @returns Promise that resolves with an array of projects
   */
  public async getProjects(includeArchived: boolean = false): Promise<Project[]> {
    try {
      return await indexedDBService.getAllProjects(includeArchived);
    } catch (error) {
      loggerService.error(
        'Error getting projects',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Promise that resolves with the project or null if not found
   */
  public async getProject(id: string): Promise<Project | null> {
    try {
      const project = await indexedDBService.getProject(id);

      if (project) {
        // Add history entry for viewing the project
        await indexedDBService.addProjectHistoryEntry({
          projectId: id,
          action: 'view',
          timestamp: new Date().toISOString(),
        });
      }

      return project;
    } catch (error) {
      loggerService.error(
        `Error getting project ${id}`,
        error instanceof Error ? error : new Error(String(error))
      );
      return null;
    }
  }

  /**
   * Update a project
   * @param project Updated project
   * @returns Promise that resolves with the updated project
   */
  public async updateProject(project: Project): Promise<Project> {
    try {
      const existingProject = await indexedDBService.getProject(project.id);

      if (!existingProject) {
        throw new Error(`Project with ID ${project.id} not found`);
      }

      // Update the project
      const updatedProject = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      await indexedDBService.saveProject(updatedProject);

      // Add history entry
      await indexedDBService.addProjectHistoryEntry({
        projectId: project.id,
        action: 'update',
        timestamp: updatedProject.updatedAt,
        details: { version: updatedProject.version },
      });

      loggerService.info(`Project updated: ${project.id} - ${project.name}`);
      return updatedProject;
    } catch (error) {
      loggerService.error(
        'Error updating project',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to update project');
    }
  }

  /**
   * Delete a project
   * @param id Project ID
   * @returns Promise that resolves when the project is deleted
   */
  public async deleteProject(id: string): Promise<void> {
    try {
      // Get the project first for history logging
      const project = await indexedDBService.getProject(id);

      if (!project) {
        throw new Error(`Project with ID ${id} not found`);
      }

      // Delete the project
      await indexedDBService.deleteProject(id);

      // Add history entry
      await indexedDBService.addProjectHistoryEntry({
        projectId: id,
        action: 'delete',
        timestamp: new Date().toISOString(),
        details: {
          projectName: project.name,
          version: project.version,
        },
      });

      loggerService.info(`Project deleted: ${id} - ${project.name}`);
    } catch (error) {
      loggerService.error(
        'Error deleting project',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to delete project');
    }
  }

  /**
   * Archive or unarchive a project
   * @param id Project ID
   * @param archive Whether to archive (true) or unarchive (false)
   * @returns Promise that resolves with the updated project
   */
  public async archiveProject(id: string, archive: boolean): Promise<Project> {
    try {
      const updatedProject = await indexedDBService.archiveProject(id, archive);

      // Add history entry
      await indexedDBService.addProjectHistoryEntry({
        projectId: id,
        action: archive ? 'archive' : 'unarchive',
        timestamp: new Date().toISOString(),
      });

      loggerService.info(
        `Project ${archive ? 'archived' : 'unarchived'}: ${id} - ${updatedProject.name}`
      );
      return updatedProject;
    } catch (error) {
      loggerService.error(
        `Error ${archive ? 'archiving' : 'unarchiving'} project`,
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error(`Failed to ${archive ? 'archive' : 'unarchive'} project`);
    }
  }

  /**
   * Save a project with a commit
   * @param project Project to save
   * @param commitMessage Commit message
   * @returns Promise that resolves with the updated project
   */
  public async saveProjectWithCommit(project: Project, commitMessage: string): Promise<Project> {
    try {
      // First update the project
      const updatedProject = await this.updateProject(project);

      // Then create a commit
      const committedProject = await gitService.commit(updatedProject, commitMessage);

      // Update the project with the new version
      const finalProject = await this.updateProject(committedProject);

      // Add history entry for the commit
      await indexedDBService.addProjectHistoryEntry({
        projectId: project.id,
        action: 'update',
        timestamp: new Date().toISOString(),
        details: {
          version: finalProject.version,
          commitMessage,
        },
      });

      return finalProject;
    } catch (error) {
      loggerService.error(
        'Error saving project with commit',
        error instanceof Error ? error : new Error(String(error))
      );
      throw new Error('Failed to save project with commit');
    }
  }

  /**
   * Sync a project to AWS S3
   * @param projectId Project ID
   * @returns Promise that resolves with success status
   */
  public async syncToS3(projectId: string): Promise<boolean> {
    // Check if S3 is available
    if (!s3Service.isS3Available()) {
      loggerService.warn(
        'S3 service is not available. Enable it in .env file with VITE_AWS_S3_ENABLED=true'
      );
      return false;
    }

    try {
      const project = await this.getProject(projectId);

      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }

      const result = await s3Service.uploadProject(project);

      if (result !== null) {
        // Add history entry for the S3 sync
        await indexedDBService.addProjectHistoryEntry({
          projectId,
          action: 'export',
          timestamp: new Date().toISOString(),
          details: {
            destination: 'S3',
            version: project.version,
          },
        });

        loggerService.info(`Project synced to S3: ${projectId} - ${project.name}`);
        return true;
      }

      return false;
    } catch (error) {
      loggerService.error(
        'Error syncing to S3',
        error instanceof Error ? error : new Error(String(error))
      );
      return false;
    }
  }

  /**
   * Get project history
   * @param id Project ID
   * @param limit Maximum number of entries to return
   * @returns Promise that resolves with an array of history entries
   */
  public async getProjectHistory(id: string, limit = 100): Promise<ProjectHistoryEntry[]> {
    try {
      return await indexedDBService.getProjectHistory(id, limit);
    } catch (error) {
      loggerService.error(
        'Error getting project history',
        error instanceof Error ? error : new Error(String(error))
      );
      return [];
    }
  }

  /**
   * Create a project with offline support
   * @param name Project name
   * @param description Project description
   * @returns Promise that resolves with the newly created project
   */
  public async createProjectWithOfflineSupport(
    name: string,
    description: string
  ): Promise<Project> {
    try {
      // Create the project locally
      const project = await this.createProject(name, description);

      // If offline, queue for sync when back online
      if (!offlineService.getOnlineStatus()) {
        offlineService.addToSyncQueue(async () => {
          // When back online, we might need to sync with a backend
          // For now, just log the operation
          loggerService.info(`Project ${project.id} created while offline, now synced`);
        });
      }

      return project;
    } catch (error) {
      loggerService.error(
        'Error creating project with offline support',
        error instanceof Error ? error : new Error(String(error))
      );
      throw error;
    }
  }
}

export default ProjectService.getInstance();
