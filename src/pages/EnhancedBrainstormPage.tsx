import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTheme } from '@mui/material';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { Node, Edge, Project, NodeType } from '../types';
import { AppShell } from '../components/Layout/AppShell';
import { BrainstormLayout } from '../components/Layout/BrainstormLayout';
import { EnhancedBrainstormFlow } from '../components/BrainstormFlow/EnhancedBrainstormFlow';
// EnhancedBrainstormFlow now includes its own ReactFlowProvider
import { ChatPanel } from '../components/Chat/ChatPanel';
import { GitHistoryPanel } from '../components/GitHistory/GitHistoryPanel';
import projectService from '../services/ProjectService';

// Sample data for demonstration
const sampleNodes: Node[] = [
  {
    id: 'node-1',
    type: NodeType.IDEA,
    position: { x: 250, y: 100 },
    data: {
      label: 'Main Idea',
      content: 'This is the central concept of our brainstorming session.',
      tags: ['important', 'core'],
    },
  },
  {
    id: 'node-2',
    type: NodeType.TASK,
    position: { x: 100, y: 250 },
    data: {
      label: 'Research',
      content: 'Gather information about the topic.',
      tags: ['todo'],
    },
  },
  {
    id: 'node-3',
    type: NodeType.NOTE,
    position: { x: 400, y: 250 },
    data: {
      label: 'Considerations',
      content: 'Remember to think about the user experience.',
      tags: ['ux'],
    },
  },
];

const sampleEdges: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
  },
  {
    id: 'edge-1-3',
    source: 'node-1',
    target: 'node-3',
    type: 'smoothstep',
  },
];

export const EnhancedBrainstormPage = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const { projectId } = useParams<{ projectId: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nodes, setNodes] = useState<Node[]>(sampleNodes);
  const [edges, setEdges] = useState<Edge[]>(sampleEdges);
  const [project, setProject] = useState<Project>({
    id: projectId || crypto.randomUUID(),
    name: 'Brainstorming Project',
    description: 'A brainstorming project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    nodes: sampleNodes,
    edges: sampleEdges,
  });
  const [isDarkMode, setIsDarkMode] = useState(theme.palette.mode === 'dark');

  // Load project data if projectId is provided
  useEffect(() => {
    if (projectId) {
      setLoading(true);
      try {
        const loadedProject = projectService.getProject(projectId);
        if (loadedProject) {
          setProject(loadedProject);
          setNodes(loadedProject.nodes);
          setEdges(loadedProject.edges);
        } else {
          setError(t('brainstorm.projectNotFound'));
        }
      } catch (error) {
        console.error('Error loading project:', error);
        setError(t('brainstorm.errorLoadingProject'));
      } finally {
        setLoading(false);
      }
    }
  }, [projectId, t]);

  // Auto-save project if enabled
  useEffect(() => {
    if (settings.autoSave && project.id) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveProject();
      }, 5000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [nodes, edges, settings.autoSave, project.id]);

  // Handle nodes change
  const handleNodesChange = useCallback((updatedNodes: Node[]) => {
    setNodes(updatedNodes);
    setProject(prev => ({
      ...prev,
      nodes: updatedNodes,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Handle edges change
  const handleEdgesChange = useCallback((updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
    setProject(prev => ({
      ...prev,
      edges: updatedEdges,
      updatedAt: new Date().toISOString(),
    }));
  }, []);

  // Save project
  const handleSaveProject = useCallback(() => {
    setLoading(true);
    try {
      const updatedProject = projectService.updateProject({
        ...project,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      });
      setProject(updatedProject);
      setError(null);
    } catch (error) {
      console.error('Error saving project:', error);
      setError(t('brainstorm.errorSavingProject'));
    } finally {
      setLoading(false);
    }
  }, [project, nodes, edges, t]);

  // Create a new node
  const handleCreateNode = useCallback((type: NodeType = NodeType.IDEA) => {
    if (window.brainstormFlowApi) {
      window.brainstormFlowApi.addNode(type);
    }
  }, []);

  // Handle project update from Git history
  const handleProjectUpdate = useCallback((updatedProject: Project) => {
    setProject(updatedProject);
    setNodes(updatedProject.nodes);
    setEdges(updatedProject.edges);
  }, []);

  // Handle theme toggle
  const handleThemeToggle = useCallback(() => {
    setIsDarkMode(prev => !prev);
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (window.brainstormFlowApi) {
      window.brainstormFlowApi.zoomIn();
    }
  }, []);

  const handleZoomOut = useCallback(() => {
    if (window.brainstormFlowApi) {
      window.brainstormFlowApi.zoomOut();
    }
  }, []);

  const handleFitView = useCallback(() => {
    if (window.brainstormFlowApi) {
      window.brainstormFlowApi.fitView();
    }
  }, []);

  return (
    <AppShell
      title={project.name}
      loading={loading}
      error={error}
      onThemeToggle={handleThemeToggle}
      isDarkMode={isDarkMode}
      onCreateNew={() => handleCreateNode()}
    >
      <BrainstormLayout
        mainContent={
          <EnhancedBrainstormFlow
            initialNodes={nodes}
            initialEdges={edges}
            onSave={handleSaveProject}
            onNodesChange={handleNodesChange}
            onEdgesChange={handleEdgesChange}
          />
        }
        chatPanel={<ChatPanel projectId={project.id} projectContext={project} />}
        historyPanel={<GitHistoryPanel project={project} onProjectUpdate={handleProjectUpdate} />}
        onSave={handleSaveProject}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFitView={handleFitView}
        onAddNode={handleCreateNode}
      />
    </AppShell>
  );
};
