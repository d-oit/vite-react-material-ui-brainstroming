import { Project } from '../types';

/**
 * Service for handling Git-like versioning of projects
 */
export class GitService {
  private static instance: GitService;
  private localStorageKey = 'git_projects';

  private constructor() {
    // Initialize if needed
  }

  public static getInstance(): GitService {
    if (!GitService.instance) {
      GitService.instance = new GitService();
    }
    return GitService.instance;
  }

  /**
   * Save a project as a new commit
   * @param project Project to save
   * @param commitMessage Commit message
   * @returns Updated project with new version
   */
  public async commit(project: Project, commitMessage: string): Promise<Project> {
    const projects = this.getProjects();
    const existingProject = projects.find(p => p.id === project.id);

    // Create a new version based on the current date
    const now = new Date();
    const version = `${now.getFullYear()}.${now.getMonth() + 1}.${now.getDate()}-${now.getHours()}${now.getMinutes()}`;

    // Create a commit object
    const commit = {
      id: crypto.randomUUID(),
      message: commitMessage,
      timestamp: now.toISOString(),
      version,
      projectSnapshot: { ...project },
    };

    if (existingProject) {
      // Update existing project
      existingProject.commits = existingProject.commits || [];
      existingProject.commits.push(commit);
      existingProject.currentCommitId = commit.id;
      existingProject.version = version;
      existingProject.updatedAt = now.toISOString();

      // Save updated projects
      this.saveProjects(projects);

      return {
        ...project,
        version,
        updatedAt: now.toISOString(),
      };
    } else {
      // Create new project entry
      const newProjectEntry = {
        id: project.id,
        name: project.name,
        description: project.description,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        version,
        currentCommitId: commit.id,
        commits: [commit],
      };

      // Save updated projects
      projects.push(newProjectEntry);
      this.saveProjects(projects);

      return {
        ...project,
        version,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    }
  }

  /**
   * Get all commits for a project
   * @param projectId Project ID
   * @returns Array of commits
   */
  public getCommits(projectId: string): any[] {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return [];
    }

    return project.commits || [];
  }

  /**
   * Checkout a specific commit
   * @param projectId Project ID
   * @param commitId Commit ID
   * @returns Project snapshot from the commit
   */
  public checkout(projectId: string, commitId: string): Project | null {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project) {
      return null;
    }

    const commit = project.commits?.find(c => c.id === commitId);

    if (!commit) {
      return null;
    }

    // Update current commit ID
    project.currentCommitId = commitId;
    this.saveProjects(projects);

    return commit.projectSnapshot;
  }

  /**
   * Get the current commit for a project
   * @param projectId Project ID
   * @returns Current commit
   */
  public getCurrentCommit(projectId: string): any | null {
    const projects = this.getProjects();
    const project = projects.find(p => p.id === projectId);

    if (!project || !project.currentCommitId) {
      return null;
    }

    return project.commits?.find(c => c.id === project.currentCommitId) || null;
  }

  /**
   * Get all projects from local storage
   */
  private getProjects(): any[] {
    const projectsJson = localStorage.getItem(this.localStorageKey);
    return projectsJson ? JSON.parse(projectsJson) : [];
  }

  /**
   * Save projects to local storage
   */
  private saveProjects(projects: any[]): void {
    localStorage.setItem(this.localStorageKey, JSON.stringify(projects));
  }
}

export default GitService.getInstance();
