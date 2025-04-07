import { Box, Paper, Typography, Chip, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useState, useCallback, useMemo, useRef } from 'react';

import type { Node, Edge } from '../../types';
import { ProjectTemplate, type SyncSettings, templateConfigs } from '../../types/project';
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation';
import { useFocusManagement } from '../../hooks/useFocusManagement';
import { useS3Sync } from '../../hooks/useS3Sync';
import { EnhancedBrainstormFlow } from '../BrainstormFlow/EnhancedBrainstormFlow';
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary';
interface ProjectBrainstormingSectionProps {
  projectId: string;
  template: ProjectTemplate;
  initialNodes?: Node[];
  initialEdges?: Edge[];
  syncSettings?: SyncSettings;
  readOnly?: boolean;
}

export const ProjectBrainstormingSection = ({
  projectId,
  template,
  initialNodes = [],
  initialEdges = [],
  syncSettings,
  readOnly = false,
}: ProjectBrainstormingSectionProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get template configuration
  const templateConfig = useMemo(() => templateConfigs[template], [template]);

  const [nodes, setNodes] = useState<Node[]>(initialNodes);
  const [edges, setEdges] = useState<Edge[]>(initialEdges);

  // Set up keyboard navigation and focus management
  const { updateNodeSelection } = useKeyboardNavigation(containerRef, nodes, (nodeId: string) => {
    const node = nodes.find((n: Node) => n.id === nodeId);
    if (typeof node !== 'undefined') {
      const title = typeof node.data.title === 'string' ? node.data.title : 'Untitled';
      announceFocusChange(`Selected ${node.type} node: ${title}`);
    }
  });

  const { announceFocusChange } = useFocusManagement({
    containerRef,
    nodes,
    onFocusChange: (nodeId: string | null) => {
      if (typeof nodeId === 'string' && nodeId.length > 0) {
        const node = nodes.find((n: Node) => n.id === nodeId);
        if (typeof node !== 'undefined') {
          const title = typeof node.data.title === 'string' ? node.data.title : 'Untitled';
          announceFocusChange(`Focused on ${node.type} node: ${title}`);
        }
      }
    },
  });

  // Initialize S3 sync hook
  const { sync, syncStatus, lastSyncTime } = useS3Sync({
    projectId,
    syncSettings,
    data: { nodes, edges },
  });

  // Handle saving flow data with sync
  const handleSave = useCallback(
    (updatedNodes: Node[], updatedEdges: Edge[]) => {
      // Update local state
      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Trigger sync if enabled
      const syncEnabled = Boolean(syncSettings?.enableS3Sync);
      const isSaveSync = syncSettings?.syncFrequency === 'onSave';

      if (syncEnabled && isSaveSync) {
        void sync();
      }
    },
    [sync, syncSettings]
  );

  // Handle node changes
  const handleNodesChange = useCallback((updatedNodes: Node[]) => {
    setNodes(updatedNodes);
  }, []);

  // Handle edge changes
  const handleEdgesChange = useCallback((updatedEdges: Edge[]) => {
    setEdges(updatedEdges);
  }, []);

  return (
    <Paper
      sx={{
        height: 'calc(100vh - 200px)',
        width: '100%',
        position: 'relative',
        overflow: 'hidden',
        containIntrinsic: 'size layout',
        willChange: 'transform',
      }}
      elevation={2}
      role="region"
      aria-label="Project Brainstorming"
    >
      <Box
        sx={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Box
          sx={{
            p: 2,
            borderBottom: 1,
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Typography variant="subtitle2" color="text.secondary">
            Suggested workflow: {templateConfig.suggestedWorkflow.join(' → ')}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {syncStatus === 'syncing' && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="caption">Syncing...</Typography>
              </Box>
            )}
            {syncStatus === 'error' && (
              <Chip
                label="Sync Error"
                color="error"
                size="small"
                onClick={() => sync()}
                aria-label="Sync failed. Click to retry."
              />
            )}
            {syncStatus === 'success' && typeof lastSyncTime === 'string' && (
              <Chip
                label={`Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`}
                color="success"
                size="small"
                aria-label={`Last successful sync at ${new Date(lastSyncTime).toLocaleTimeString()}`}
              />
            )}
          </Box>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
            position: 'relative',
            '& .react-flow__node': {
              willChange: 'transform',
              contain: 'layout style paint',
            },
          }}
          ref={containerRef}
        >
          <ErrorBoundary
            fallback={
              <Box sx={{ p: 2 }}>
                <Alert severity="error">
                  An error occurred in the brainstorming view. Please try again.
                </Alert>
              </Box>
            }
            onReset={() => {
              setNodes(initialNodes);
              setEdges(initialEdges);
              setErrorMessage(null);
            }}
          >
            <EnhancedBrainstormFlow
              initialNodes={nodes}
              initialEdges={edges}
              onSave={handleSave}
              readOnly={readOnly}
              onNodesChange={handleNodesChange}
              onEdgesChange={handleEdgesChange}
              aria-label="Brainstorming Flow"
            />
          </ErrorBoundary>
        </Box>
      </Box>
      <Snackbar
        open={typeof errorMessage === 'string' && errorMessage.length > 0}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};
