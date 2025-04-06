import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';

import { uploadProject, downloadProject } from '@/lib/s3Service';
import type { Project, Node, Edge } from '@/types';

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

  // Load project
  const loadProject = useCallback(async () => {
    if (!projectId) return;

    setLoading(true);
    setError(null);

    try {
      // Try to load from S3, but don't fail if S3 is not configured
      try {
        const loadedProject = await downloadProject(projectId, version);
        if (loadedProject) {
          setProject(loadedProject);
          return;
        }
      } catch (s3Error) {
        // If the error is about S3 not being configured, just log it and continue
        if (s3Error instanceof Error && s3Error.message.includes('S3 not configured')) {
          console.log('S3 not configured, skipping cloud sync');
        } else {
          // For other errors, log them but don't fail the operation
          console.warn('Error downloading from S3:', s3Error);
        }
      }

      // If we get here, either S3 failed or returned no project
      // Try to load from local storage as a fallback
      const localProject = await loadProjectFromLocalStorage(projectId);
      if (localProject) {
        setProject(localProject);
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
      nodes: [],
      edges: [],
    };

    setProject(newProject);
    return newProject;
  }, []);

  // Save project
  const saveProject = useCallback(async (): Promise<boolean> => {
    if (!project) return false;

    setIsSaving(true);
    try {
      // Update the version and timestamps
      const updatedProject: Project = {
        ...project,
        updatedAt: new Date().toISOString(),
      };

      await uploadProject(updatedProject);
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

  // Create new version
  const createNewVersion = useCallback(async (): Promise<boolean> => {
    if (!project) return false;

    setIsSaving(true);
    try {
      // Increment version number (assuming semver format)
      const versionParts = project.version.split('.');
      const newMinorVersion = parseInt(versionParts[1] || '0') + 1;
      const newVersion = `${versionParts[0]}.${newMinorVersion}.0`;

      const updatedProject: Project = {
        ...project,
        version: newVersion,
        updatedAt: new Date().toISOString(),
      };

      await uploadProject(updatedProject);
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
      if (!project) return '';

      const nodeId = uuidv4();
      const newNode: Node = {
        ...node,
        id: nodeId,
      };

      setProject(prev => {
        if (!prev) return null;
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
      if (!project) return false;

      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nodes: prev.nodes.map(node => (node.id === nodeId ? { ...node, ...updates } : node)),
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
      if (!project) return false;

      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          nodes: prev.nodes.filter(node => node.id !== nodeId),
          // Also remove any edges connected to this node
          edges: prev.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
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
      if (!project) return '';

      const edgeId = uuidv4();
      const newEdge: Edge = {
        ...edge,
        id: edgeId,
      };

      setProject(prev => {
        if (!prev) return null;
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
      if (!project) return false;

      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          edges: prev.edges.map(edge => (edge.id === edgeId ? { ...edge, ...updates } : edge)),
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
      if (!project) return false;

      setProject(prev => {
        if (!prev) return null;
        return {
          ...prev,
          edges: prev.edges.filter(edge => edge.id !== edgeId),
          updatedAt: new Date().toISOString(),
        };
      });

      return true;
    },
    [project]
  );

  // Auto-save effect
  useEffect(() => {
    if (!autoSave || !project || loading || isSaving) return;

    const timer = setTimeout(() => {
      saveProject();
    }, 5000); // Auto-save after 5 seconds of inactivity

    return () => clearTimeout(timer);
  }, [project, autoSave, loading, isSaving, saveProject]);

  // Load project on mount
  useEffect(() => {
    if (projectId) {
      loadProject();
    }
  }, [projectId, loadProject]);

  return {
    project,
    loading,
    error,
    isSaving,
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
