import { Box, Paper, Typography, CircularProgress, Alert } from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import { useErrorNotification } from '../../contexts/ErrorNotificationContext';
import loggerService from '../../services/LoggerService';
import type { Node, Edge, Project } from '../../types';
import { EnhancedBrainstormFlow } from '../BrainstormFlow/EnhancedBrainstormFlow';

interface ProjectBrainstormingSectionProps {
  project: Project;
  onSave: (nodes: Node[], edges: Edge[]) => void;
  isSaving?: boolean;
  error?: string | null;
}

const ProjectBrainstormingSection = ({
  project,
  onSave,
  isSaving = false,
  error = null,
}: ProjectBrainstormingSectionProps) => {
  const { showError } = useErrorNotification();
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize nodes and edges from project
  useEffect(() => {
    try {
      if (project) {
        setNodes(project.nodes || []);
        setEdges(project.edges || []);
      }
    } catch (err) {
      const errorMessage = 'Failed to load brainstorming data';
      loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [project, showError]);

  // Handle nodes change
  const handleNodesChange = useCallback(
    (updatedNodes: Node[]) => {
      setNodes(updatedNodes);
    },
    [setNodes]
  );

  // Handle edges change
  const handleEdgesChange = useCallback(
    (updatedEdges: Edge[]) => {
      setEdges(updatedEdges);
    },
    [setEdges]
  );

  // Handle save
  const handleSave = useCallback(
    (updatedNodes: Node[], updatedEdges: Edge[]) => {
      try {
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        onSave(updatedNodes, updatedEdges);
        loggerService.info('Brainstorming data saved', {
          projectId: project.id,
          nodesCount: updatedNodes.length,
          edgesCount: updatedEdges.length,
        });
      } catch (err) {
        const errorMessage = 'Failed to save brainstorming data';
        loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
        showError(errorMessage);
      }
    },
    [project.id, onSave, showError]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 300px)', width: '100%' }}>
      {nodes.length === 0 && !loading ? (
        <Paper sx={{ p: 3, textAlign: 'center', mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Start Brainstorming
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Use the + button to add your first node and start brainstorming.
          </Typography>
        </Paper>
      ) : null}

      <EnhancedBrainstormFlow
        initialNodes={nodes}
        initialEdges={edges}
        onSave={handleSave}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        readOnly={isSaving}
      />
    </Box>
  );
};

export default ProjectBrainstormingSection;
