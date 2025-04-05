import { Project, Node, Edge } from '../types';
import gitService from './GitService';
import s3Service from './S3Service';

/**
 * Service for managing projects
 */
export class ProjectService {
  private static instance: ProjectService;
  private localStorageKey = 'brainstorming_projects';

  private constructor() {
    // Initialize if needed
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
   * @returns Newly created project
   */
  public createProject(name: string, description: string): Project {
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: now,
      updatedAt: now,
      version: '0.1.0',
      nodes: [],
      edges: []
    };

    // Save to local storage
    const projects = this.getProjects();
    projects.push(project);
    this.saveProjects(projects);

    // Create initial commit
    gitService.commit(project, 'Initial commit');

    return project;
  }

  /**
   * Get all projects
   * @returns Array of projects
   */
  public getProjects(): Project[] {
    const projectsJson = localStorage.getItem(this.localStorageKey);
    return projectsJson ? JSON.parse(projectsJson) : [];
  }

  /**
   * Get a project by ID
   * @param id Project ID
   * @returns Project or null if not found
   */
  public getProject(id: string): Project | null {
    const projects = this.getProjects();
    return projects.find(p => p.id === id) || null;
  }

  /**
   * Update a project
   * @param project Updated project
   * @returns Updated project
   */
  public updateProject(project: Project): Project {
    const projects = this.getProjects();
    const index = projects.findIndex(p => p.id === project.id);

    if (index === -1) {
      throw new Error(`Project with ID ${project.id} not found`);
    }

    // Update the project
    const updatedProject = {
      ...project,
      updatedAt: new Date().toISOString()
    };
    projects[index] = updatedProject;
    this.saveProjects(projects);

    return updatedProject;
  }

  /**
   * Delete a project
   * @param id Project ID
   */
  public deleteProject(id: string): void {
    const projects = this.getProjects();
    const filteredProjects = projects.filter(p => p.id !== id);
    this.saveProjects(filteredProjects);
  }

  /**
   * Save a project with a commit
   * @param project Project to save
   * @param commitMessage Commit message
   * @returns Updated project
   */
  public async saveProjectWithCommit(project: Project, commitMessage: string): Promise<Project> {
    // First update the project
    const updatedProject = this.updateProject(project);
    
    // Then create a commit
    const committedProject = await gitService.commit(updatedProject, commitMessage);
    
    // Update the project with the new version
    const finalProject = this.updateProject(committedProject);
    
    return finalProject;
  }

  /**
   * Sync a project to AWS S3
   * @param projectId Project ID
   * @returns Success status
   */
  public async syncToS3(projectId: string): Promise<boolean> {
    const project = this.getProject(projectId);
    
    if (!project) {
      throw new Error(`Project with ID ${projectId} not found`);
    }
    
    try {
      await s3Service.uploadProject(project);
      return true;
    } catch (error) {
      console.error('Error syncing to S3:', error);
      return false;
    }
  }

  /**
   * Save projects to local storage
   */
  private saveProjects(projects: Project[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(projects));
  }
}

export default ProjectService.getInstance();
