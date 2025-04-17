import { useState, useEffect, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { uploadProject, downloadProject } from '../lib/s3Service';
import type { Project, Node, Edge } from '../types';
import { ProjectTemplate } from '../types/project';
import { hasProjectChanged } from '../utils/projectUtils';

interface UseProjectProps {
  projectId?: string;
  version?: string;
  autoSave?: boolean;
}

export const useProject = ({ projectId, version, autoSave = true }: UseProjectProps = {}) => {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [hasChanges, setHasChanges] = useState<boolean>(false);
  const previousProjectRef = useRef<Project | null>(null);

  // Load project
  const loadProject = useCallback(async () => {
    if (projectId === undefined || projectId === null || projectId === '') return;

    setLoading(true);
    setError(null);

    try {
      // Try to load from S3, but don't fail if S3 is not configured
      try {
        const loadedProject = await downloadProject(projectId, version);
        if (
          loadedProject !== null &&
          typeof loadedProject === 'object' &&
          'id' in loadedProject &&
          'name' in loadedProject &&
          'nodes' in loadedProject
        ) {
          setProject(loadedProject as Project);
          return;
        }
      } catch (s3Error) {
        // If the error is about S3 not being configured, just log it and continue
        if (s3Error instanceof Error && s3Error.message.includes('S3 integration is disabled')) {
          // This is expected when S3 is not configured, so just log at info level
          console.info('S3 integration is disabled, skipping cloud sync');
        } else if (s3Error instanceof Error && s3Error.message.includes('S3 not configured')) {
          console.info('S3 not configured, skipping cloud sync');
        } else {
          // For other errors, log them but don't fail the operation
          console.warn('Error downloading from S3:', s3Error);
        }
      }

      // If we get here, either S3 failed or returned no project
      // Try to load from local storage as a fallback
      const localProject = await loadProjectFromLocalStorage(projectId);
      if (
        localProject !== null &&
        typeof localProject === 'object' &&
        'id' in localProject &&
        'name' in localProject &&
        'nodes' in localProject
      ) {
        setProject(localProject as Project);
      } else {
        setError('Project not found');
      }
    } catch (err) {
      setError('Failed to load project');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [projectId, version]);

  // Helper function to load project from local storage
  const loadProjectFromLocalStorage = async (id: string): Promise<Project | null> => {
    try {
      // Import the project service dynamically to avoid circular dependencies
      const { default: projectService } = await import('../services/ProjectService');
      // Use the project service to get the project from IndexedDB
      return await projectService.getProject(id);
    } catch (error) {
      console.error('Error loading project from local storage:', error);
      return null;
    }
  };

  // Create new project
  const createProject = useCallback((name: string, description: string): Project => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '0.1.0',
      template: ProjectTemplate.CUSTOM,
      nodes: [] as Node[],
      edges: [] as Edge[],
      syncSettings: {
        enableS3Sync: false,
        syncFrequency: 'manual',
        intervalMinutes: 30,
      },
    };

    setProject(newProject);
    return newProject;
  }, []);

  // Save project
  const saveProject = useCallback(async (updatedProjectData?: Project): Promise<boolean> => {
    if (updatedProjectData) {
      // If an updated project is provided, use it
      setProject(updatedProjectData);
    }

    // Use either the provided project or the current state
    const projectToSave = updatedProjectData || project;

    if (projectToSave === null || !('id' in projectToSave) || !('nodes' in projectToSave)) return false;

    setIsSaving(true);
    try {
      // Update the timestamps
      const updatedProject: Project = {
        ...projectToSave,
        updatedAt: new Date().toISOString(),
      };

      // Try to save to S3, but don't fail if S3 is not configured
      try {
        await uploadProject(updatedProject);
      } catch (s3Error) {
        // Handle S3 errors as before
      }

      // Always save to local storage
      await saveProjectToLocalStorage(updatedProject);

      setProject(updatedProject);
      return true;
    } catch (err) {
      console.error('Failed to save project:', err);
      setError('Failed to save project');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [project]);

  // Helper function to save project to local storage
  const saveProjectToLocalStorage = async (projectToSave: Project): Promise<void> => {
    try {
      // Import the project service dynamically to avoid circular dependencies
      const { default: projectService } = await import('../services/ProjectService');
      // Use the project service to update the project in IndexedDB
      await projectService.updateProject(projectToSave);
    } catch (error) {
      console.error('Error saving project to local storage:', error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Create new version
  const createNewVersion = useCallback(async (): Promise<boolean> => {
    if (project === null || project === undefined) return false;

    setIsSaving(true);
    try {
      // Ensure version is a string before splitting
      const versionStr =
        typeof project.version === 'string' ? project.version : String(project.version);
      // Increment version number (assuming semver format)
      const versionParts = versionStr.split('.');
      const minorVersionStr = versionParts[1] ?? '0';
      const newMinorVersion = parseInt(minorVersionStr, 10) + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}.0`;

      const updatedProject: Project = {
        ...project,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

      // Try to save to S3, but don't fail if S3 is not configured
      try {
        await uploadProject(updatedProject);
      } catch (s3Error) {
        // If the error is about S3 not being configured, just log it
        if (s3Error instanceof Error && s3Error.message.includes('S3 not configured')) {
          console.log('S3 not configured, saving only to local storage');
        } else {
          // For other errors, log them but don't fail the operation
          console.warn('Error uploading to S3:', s3Error);
        }
      }

      // Always save to local storage
      await saveProjectToLocalStorage(updatedProject);

      setProject(updatedProject);
      return true;
    } catch (err) {
      console.error('Failed to create new version:', err);
      setError('Failed to create new version');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [project]);

  // Add node
  const addNode = useCallback(
    (node: Omit<Node, 'id'>): string => {
      if (project === null || project === undefined) return '';

      const nodeId = uuidv4();
      const newNode: Node = {
        ...node,
        id: nodeId,
      };

      setProject((prev: Project | null) => {
        if (prev === null || !('id' in prev) || !('nodes' in prev)) return null;
        return {
          ...prev,
          nodes: [...prev.nodes, newNode],
          updatedAt: new Date().toISOString(),
        };
      });

      return nodeId;
    },
    [project]
  );

  // Update node
  const updateNode = useCallback(
    (nodeId: string, updates: Partial<Node>): boolean => {
      if (project === null || project === undefined) return false;

      setProject((prev: Project | null) => {
        if (prev === null || prev === undefined) return null;
        return {
          ...prev,
          nodes: prev.nodes.map((node: Node) =>
            node.id === nodeId ? { ...node, ...updates } : node
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      return true;
    },
    [project]
  );

  // Remove node
  const removeNode = useCallback(
    (nodeId: string): boolean => {
      if (project === null || project === undefined) return false;

      setProject((prev: Project | null) => {
        if (prev === null || prev === undefined) return null;
        return {
          ...prev,
          nodes: prev.nodes.filter((node: Node) => node.id !== nodeId),
          // Also remove any edges connected to this node
          edges: prev.edges.filter(
            (edge: Edge) => edge.source !== nodeId && edge.target !== nodeId
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      return true;
    },
    [project]
  );

  // Add edge
  const addEdge = useCallback(
    (edge: Omit<Edge, 'id'>): string => {
      if (project === null || project === undefined) return '';

      const edgeId = uuidv4();
      const newEdge: Edge = {
        ...edge,
        id: edgeId,
      };

      setProject((prev: Project | null) => {
        if (prev === null || prev === undefined) return null;
        return {
          ...prev,
          edges: [...prev.edges, newEdge],
          updatedAt: new Date().toISOString(),
        };
      });

      return edgeId;
    },
    [project]
  );

  // Update edge
  const updateEdge = useCallback(
    (edgeId: string, updates: Partial<Edge>): boolean => {
      if (project === null || project === undefined) return false;

      setProject((prev: Project | null) => {
        if (prev === null || prev === undefined) return null;
        return {
          ...prev,
          edges: prev.edges.map((edge: Edge) =>
            edge.id === edgeId ? { ...edge, ...updates } : edge
          ),
          updatedAt: new Date().toISOString(),
        };
      });

      return true;
    },
    [project]
  );

  // Remove edge
  const removeEdge = useCallback(
    (edgeId: string): boolean => {
      if (project === null || project === undefined) return false;

      setProject((prev: Project | null) => {
        if (prev === null || prev === undefined) return null;
        return {
          ...prev,
          edges: prev.edges.filter((edge: Edge) => edge.id !== edgeId),
          updatedAt: new Date().toISOString(),
        };
      });

      return true;
    },
    [project]
  );

  // Effect to detect changes in the project
  useEffect(() => {
    if (
      project === null ||
      !('id' in project) ||
      !('nodes' in project) ||
      loading === true ||
      isSaving === true
    ) {
      return;
    }

    // Check if the project has changed compared to the previous state
    const projectChanged = hasProjectChanged(project, previousProjectRef.current);
    setHasChanges(projectChanged);

    // Update the previous project reference
    previousProjectRef.current = { ...project };
  }, [project, loading, isSaving]);

  // Auto-save effect - only triggers when there are changes
  useEffect(() => {
    if (
      autoSave !== true ||
      project === null ||
      !('id' in project) ||
      !('nodes' in project) ||
      loading === true ||
      isSaving === true ||
      !hasChanges // Only proceed if there are changes
    ) {
      return;
    }

    const timer = setTimeout(() => {
      void saveProject(); // void operator to explicitly ignore the promise
      setHasChanges(false); // Reset the changes flag after saving
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [project, autoSave, loading, isSaving, saveProject, hasChanges]);

  // Load project on mount
  useEffect(() => {
    if (projectId !== undefined && projectId !== null && projectId !== '') {
      void loadProject(); // void operator to explicitly ignore the promise
    }
  }, [projectId, loadProject]);

  return {
    project,
    loading,
    error,
    isSaving,
    hasChanges,
    loadProject,
    createProject,
    saveProject,
    createNewVersion,
    addNode,
    updateNode,
    removeNode,
    addEdge,
    updateEdge,
    removeEdge,
  };
};

