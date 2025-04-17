import { ProjectTemplate } from '../../types/project';
import projectService from '../../services/ProjectService';
import { NavigateFunction } from 'react-router-dom';

/**
 * Handles creating or navigating to a Quick Brainstorm project
 * @param navigate - React Router's navigate function
 * @returns Promise that resolves when navigation is complete
 */
export const handleQuickBrainstorm = async (navigate: NavigateFunction): Promise<void> => {
  try {
    // Check if a Quick Brainstorm project already exists
    const projects = await projectService.getProjects();
    const quickBrainstormProject = projects.find(p => p.name.startsWith('Quick Brainstorm'));

    if (quickBrainstormProject) {
      // If it exists, navigate to it
      navigate(`/projects/${quickBrainstormProject.id}`);
    } else {
      // If not, create a new one
      const projectName = `Quick Brainstorm - ${new Date().toLocaleString()}`;
      const project = await projectService.createProject(
        projectName,
        'A quick brainstorming session',
        ProjectTemplate.CUSTOM
      );
      navigate(`/projects/${project.id}`);
    }
  } catch (error) {
    console.error('Error handling quick brainstorm project:', error);
  }
};