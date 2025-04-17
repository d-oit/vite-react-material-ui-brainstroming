import type { Project } from '../types';

/**
 * Compares two projects to determine if there are any meaningful changes
 * @param currentProject The current project state
 * @param previousProject The previous project state to compare against
 * @returns True if the projects have meaningful differences, false otherwise
 */
export function hasProjectChanged(currentProject: Project | null, previousProject: Project | null): boolean {
  // If either project is null, consider it a change if they're not both null
  if (currentProject === null || previousProject === null) {
    return currentProject !== previousProject;
  }

  // Check if nodes or edges have changed
  const nodesChanged = JSON.stringify(currentProject.nodes) !== JSON.stringify(previousProject.nodes);
  const edgesChanged = JSON.stringify(currentProject.edges) !== JSON.stringify(previousProject.edges);
  
  // Check if name or description has changed
  const nameChanged = currentProject.name !== previousProject.name;
  const descriptionChanged = currentProject.description !== previousProject.description;
  
  // Check if sync settings have changed
  const syncSettingsChanged = JSON.stringify(currentProject.syncSettings) !== JSON.stringify(previousProject.syncSettings);
  
  // Return true if any important property has changed
  return nodesChanged || edgesChanged || nameChanged || descriptionChanged || syncSettingsChanged;
}
