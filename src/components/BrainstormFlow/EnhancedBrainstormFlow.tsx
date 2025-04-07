import { SmartToy as SmartToyIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Fab,
  // IconButton, // Unused
  // Menu, // Unused
  // MenuItem, // Unused
  // ListItemIcon, // Unused
  // ListItemText, // Unused
  Tooltip,
  Paper,
  // Typography, // Unused
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  Node as FlowNode,
  // Edge as FlowEdge,
  NodeTypes,
  // EdgeTypes,
  Connection,
  // Panel,
  ReactFlowInstance,
  XYPosition,
} from 'reactflow';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';
import performanceMonitoring, { PerformanceCategory, useRenderPerformance } from '../../utils/performanceMonitoring';
import loggerService from '../../services/LoggerService';
import type { NodeData, Node, Edge } from '../../types';
import { NodeType } from '../../types';
import { MemoizedChatPanel } from '../Chat/ChatPanel';

import CustomNode from './CustomNode';
import { MemoizedNodeEditDialog } from './NodeEditDialog';

// Define custom node types
const nodeTypes: NodeTypes = {
  [NodeType.IDEA]: CustomNode,
  [NodeType.TASK]: CustomNode,
  [NodeType.NOTE]: CustomNode,
  [NodeType.RESOURCE]: CustomNode,
};

interface EnhancedBrainstormFlowProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
  onNodesChange?: (nodes: Node[]) => void;
  onEdgesChange?: (edges: Edge[]) => void;
}

// This is the main component that will be exported
const EnhancedBrainstormFlow = (props: EnhancedBrainstormFlowProps) => {
  return (
    <ReactFlowProvider>
      <FlowContent {...props} />
    </ReactFlowProvider>
  );
};

export { EnhancedBrainstormFlow };

// This is the inner component that uses the ReactFlow hooks
const FlowContent = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readOnly = false,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
}: EnhancedBrainstormFlowProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings, updateSettings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeEditOpen, setNodeEditOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [nodeToDelete, setNodeToDelete] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Get ReactFlow utility functions - now this is safe because we're inside ReactFlowProvider
  const { fitView, zoomIn, zoomOut, _setViewport } = useReactFlow(); // _setViewport is not used currently

  // Handle nodes change with external callback
  const handleNodesChange = useCallback(
    (changes: { id: string; type: string; position?: XYPosition }[]) => {
      onNodesChange(changes);
      if (externalNodesChange) {
        const updatedNodes = nodes.map(node => {
          const change = changes.find(
            (c: { id: string; type: string }) => c.id === node.id && c.type === 'position'
          );
          if (change) {
            return {
              ...node,
              position: change.position || node.position,
            };
          }
          return node;
        });
        externalNodesChange(updatedNodes);
      }
    },
    [nodes, onNodesChange, externalNodesChange]
  );

  // Handle edges change with external callback
  const handleEdgesChange = useCallback(
    (changes: { id: string; type: string }[]) => {
      onEdgesChange(changes);
      if (externalEdgesChange) {
        // Filter out removed edges
        const removedEdgeIds = changes
          .filter((c: { type: string }) => c.type === 'remove')
          .map((c: { id: string }) => c.id);

        const updatedEdges = edges.filter(edge => !removedEdgeIds.includes(edge.id));
        externalEdgesChange(updatedEdges);
      }
    },
    [edges, onEdgesChange, externalEdgesChange]
  );

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      // Validate connection
      if (!connection.source || !connection.target) {
        console.warn('Invalid connection attempt:', connection);
        return;
      }

      // Check if connection already exists
      const connectionExists = edges.some(
        edge => edge.source === connection.source && edge.target === connection.target
      );

      if (connectionExists) {
        showSnackbar(t('brainstorm.edgeAlreadyExists') || 'Connection already exists', 'info');
        return;
      }

      // Create new edge with unique ID and animation
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        animated: true, // Add animation to make it more visible
        style: { stroke: '#2196f3', strokeWidth: 2 }, // Add styling
      };

      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);

      if (externalEdgesChange) {
        externalEdgesChange(updatedEdges);
      }

      showSnackbar(t('brainstorm.edgeCreated') || 'Connection created', 'success');
    },
    [edges, setEdges, externalEdgesChange, t]
  );

  // Handle node click
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      if (readOnly) return;

      const selectedNode = nodes.find(n => n.id === node.id);
      if (selectedNode) {
        setSelectedNode(selectedNode);
        setNodeEditOpen(true);
      }
    },
    [nodes, readOnly]
  );

  // Handle node edit
  const handleNodeEdit = useCallback(
    (nodeData: NodeData) => {
      if (!selectedNode) return;

      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...nodeData,
              onEdit: node.data.onEdit,
              onDelete: node.data.onDelete,
            },
          };
        }
        return node;
      });

      setNodes(updatedNodes);
      setNodeEditOpen(false);
      setSelectedNode(null);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes);
      }

      showSnackbar(t('brainstorm.nodeUpdated'), 'success');
    },
    [nodes, selectedNode, setNodes, externalNodesChange, t]
  );

  // Handle node delete
  const handleNodeDelete = useCallback(
    (nodeId: string) => {
      try {
        // Find the node to be deleted (for logging)
        const nodeToDelete = nodes.find(node => node.id === nodeId);

        // Find all connected edges
        const connectedEdges = edges.filter(
          edge => edge.source === nodeId || edge.target === nodeId
        );
        const connectedEdgeIds = connectedEdges.map(edge => edge.id);

        // Filter out the node and its connected edges
        const updatedNodes = nodes.filter(node => node.id !== nodeId);
        const updatedEdges = edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId);

        // Log the deletion
        loggerService.info(
          `Deleting node ${nodeId} with ${connectedEdgeIds.length} connected edges`,
          {
            nodeType: nodeToDelete?.type,
            connectedEdgeIds,
          }
        );

        // Update state
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        setNodeEditOpen(false);
        setSelectedNode(null);

        // Notify external handlers
        if (externalNodesChange) {
          externalNodesChange(updatedNodes);
        }

        if (externalEdgesChange) {
          externalEdgesChange(updatedEdges);
        }

        // Show success message
        showSnackbar(
          connectedEdgeIds.length > 0
            ? t('brainstorm.nodeAndEdgesDeleted', { count: connectedEdgeIds.length })
            : t('brainstorm.nodeDeleted'),
          'info'
        );
      } catch (error) {
        // Log and show error
        loggerService.error(
          'Error deleting node',
          error instanceof Error ? error : new Error(String(error))
        );
        showSnackbar(t('brainstorm.errorDeletingNode'), 'error');
      }
    },
    [nodes, edges, setNodes, setEdges, externalNodesChange, externalEdgesChange, t]
  );

  // Handle node delete request
  const handleNodeDeleteRequest = useCallback(
    (nodeId: string, event?: React.MouseEvent) => {
      event?.stopPropagation(); // Prevent node selection

      // Log the delete request
      loggerService.info(`Node deletion requested for node ${nodeId}`);

      // Check if skipDeleteConfirmation is enabled in settings
      const skipConfirmation =
        process.env.VITE_SKIP_DELETE_CONFIRMATION === 'true' || settings.skipDeleteConfirmation;

      if (skipConfirmation) {
        handleNodeDelete(nodeId);
      } else {
        setNodeToDelete(nodeId);
        setDeleteConfirmOpen(true);
      }
    },
    [settings, handleNodeDelete]
  );

  // Process nodes to add event handlers
  const processNodes = useCallback(
    (nodesToProcess: Node[]): Node[] => {
      return nodesToProcess.map(node => ({
        ...node,
        data: {
          ...node.data,
          onEdit: (id: string) => {
            const selectedNode = nodes.find(n => n.id === id);
            if (selectedNode) {
              setSelectedNode(selectedNode);
              setNodeEditOpen(true);
            }
          },
          onDelete: handleNodeDeleteRequest,
        },
      }));
    },
    [nodes, handleNodeDeleteRequest]
  );

  // Add a new node
  const addNode = useCallback(
    (type: NodeType = NodeType.IDEA) => {
      if (readOnly || !reactFlowInstance) return;

      // Get the center position of the viewport
      const { x, y, zoom } = reactFlowInstance.getViewport();
      const centerX = reactFlowWrapper.current
        ? reactFlowWrapper.current.offsetWidth / 2 / zoom - x / zoom
        : 0;
      const centerY = reactFlowWrapper.current
        ? reactFlowWrapper.current.offsetHeight / 2 / zoom - y / zoom
        : 0;

      // Add some random offset to avoid stacking
      const position: XYPosition = {
        x: centerX + Math.random() * 100 - 50,
        y: centerY + Math.random() * 100 - 50,
      };

      const newNode: Node = {
        id: `node-${Date.now()}`,
        type,
        position,
        data: {
          label: t(`brainstorm.defaultLabels.${type}`),
          content: '',
          tags: [],
        },
      };

      // Process the node to add event handlers
      const processedNode = processNodes([newNode])[0];
      const updatedNodes = [...nodes, processedNode];
      setNodes(updatedNodes);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes);
      }

      // Select the new node for editing
      setSelectedNode(processedNode);
      setNodeEditOpen(true);

      showSnackbar(t('brainstorm.nodeCreated'), 'success');
    },
    [reactFlowInstance, nodes, setNodes, externalNodesChange, readOnly, t, processNodes]
  );

  // Save the flow
  const saveFlow = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
      showSnackbar(t('brainstorm.flowSaved'), 'success');
    }
  }, [nodes, edges, onSave, t]);

  // Show snackbar message
  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'info') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  /**
   * Handle adding nodes from chat
   */
  const handleAddNodesFromChat = useCallback(
    (nodeDatas: NodeData[]) => {
      if (!reactFlowInstance || !nodeDatas.length) return;

      // Get the current viewport
      const { x, y, zoom } = reactFlowInstance.getViewport();

      // Calculate a good position for the new nodes
      // Start from the center of the viewport
      const viewportCenter = {
        x: -x / zoom + reactFlowInstance.getWidth() / 2 / zoom,
        y: -y / zoom + reactFlowInstance.getHeight() / 2 / zoom,
      };

      // Create new nodes from the node data
      const newNodes: Node[] = nodeDatas.map((nodeData, index) => {
        // Position nodes in a grid-like pattern
        const position = {
          x: viewportCenter.x + (index % 3) * 250,
          y: viewportCenter.y + Math.floor(index / 3) * 150,
        };

        return {
          id: nodeData.id,
          type: (nodeData.type as NodeType) || NodeType.IDEA,
          position,
          data: {
            ...nodeData,
            onEdit: handleNodeClick,
            onDelete: (id: string) => {
              setNodeToDelete(id);
              setDeleteConfirmOpen(true);
            },
          },
        };
      });

      // Add the new nodes to the flow
      setNodes(nodes => [...nodes, ...newNodes]);

      // Notify about the change
      if (externalNodesChange) {
        externalNodesChange([...nodes, ...newNodes]);
      }

      // Show success message
      showSnackbar(t('brainstorm.nodesAdded', { count: newNodes.length }), 'success');

      // Fit the view to include the new nodes
      setTimeout(() => {
        fitView({ padding: 0.2, includeHiddenNodes: false });
      }, 100);
    },
    [reactFlowInstance, nodes, setNodes, externalNodesChange, t, fitView]
  );

  // Expose zoom functions to parent
  useEffect(() => {
    window.brainstormFlowApi = {
      zoomIn,
      zoomOut,
      fitView: () => fitView({ padding: 0.2 }),
      addNode,
      saveFlow,
    };

    return () => {
      window.brainstormFlowApi = undefined;
    };
  }, [zoomIn, zoomOut, fitView, addNode, saveFlow]);

  // Process initial nodes to add event handlers
  useEffect(() => {
    if (initialNodes.length > 0) {
      const processedNodes = processNodes(initialNodes);
      setNodes(processedNodes);
    }
  }, [initialNodes, processNodes, setNodes]);

  // Auto-fit view on initial load
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        fitView({ padding: 0.2 });
      }, 200);
    }
  }, [reactFlowInstance, fitView, nodes.length]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (reactFlowInstance && nodes.length > 0) {
        setTimeout(() => {
          fitView({ padding: 0.2 });
        }, 200);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [reactFlowInstance, fitView, nodes.length]);

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        height: '100%',
        width: '100%',
        position: 'relative',
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={handleNodesChange}
        onEdgesChange={handleEdgesChange}
        onConnect={onConnect}
        onNodeClick={onNodeClick}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        fitView
        attributionPosition="bottom-right"
        minZoom={0.1}
        maxZoom={4}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        proOptions={{ hideAttribution: true }}
        snapToGrid={!isMobile}
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Control', 'Meta']}
        selectionKeyCode={['Shift']}
        connectionMode="loose"
        connectionLineStyle={{ stroke: '#2196f3', strokeWidth: 3 }}
        connectionLineType="smoothstep"
        zoomOnScroll={true}
        panOnScroll={true}
        panOnDrag={!isMobile}
      >
        <Background
          color={theme.palette.mode === 'dark' ? '#555' : '#aaa'}
          gap={isMobile ? 15 : 20}
          size={isMobile ? 0.5 : 1}
          variant={theme.palette.mode === 'dark' ? 'dots' : 'dots'}
        />

        {!isMobile && (
          <MiniMap
            nodeStrokeWidth={3}
            zoomable
            pannable
            position="bottom-left"
            style={{
              backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        )}

        {!isMobile && !readOnly && (
          <Controls
            position="bottom-right"
            showInteractive={false}
            style={{
              backgroundColor:
                theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100],
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        )}
      </ReactFlow>

      {/* Chat Panel */}
      <Box
        sx={{
          position: 'absolute',
          right: 16,
          bottom: 16,
          width: showChat ? { xs: '90vw', sm: 350 } : 'auto',
          height: showChat ? { xs: '70vh', sm: 500 } : 'auto',
          maxWidth: showChat ? { xs: 'calc(100vw - 32px)', sm: 350 } : 'auto',
          maxHeight: showChat ? { xs: 'calc(100vh - 120px)', sm: 500 } : 'auto',
          transition: 'all 0.3s ease',
          zIndex: 5,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {showChat ? (
          <Paper
            elevation={4}
            sx={{
              height: '100%',
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              borderRadius: 2,
              position: 'relative',
              boxShadow: theme =>
                `0 8px 24px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
            }}
          >
            <Button
              size="small"
              color="primary"
              variant="contained"
              sx={{
                position: 'absolute',
                top: 8,
                right: 8,
                minWidth: 0,
                width: 32,
                height: 32,
                borderRadius: '50%',
                zIndex: 10,
                boxShadow: 2,
              }}
              onClick={() => setShowChat(false)}
            >
              <CloseIcon fontSize="small" />
            </Button>
            <MemoizedChatPanel
              onAddNodes={handleAddNodesFromChat}
              projectContext={{
                nodeCount: nodes.length,
                edgeCount: edges.length,
                nodeTypes: Object.keys(NodeType),
              }}
            />
          </Paper>
        ) : (
          <Tooltip title={t('chat.openChat') || 'Open AI Chat Assistant'}>
            <Fab
              color="primary"
              onClick={() => setShowChat(true)}
              sx={{
                boxShadow: theme =>
                  `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.15)'}`,
                '&:hover': {
                  boxShadow: theme =>
                    `0 6px 16px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.2)'}`,
                },
                transition: 'all 0.3s ease',
              }}
              aria-label={t('chat.openChat') || 'Open AI Chat Assistant'}
            >
              <SmartToyIcon />
            </Fab>
          </Tooltip>
        )}
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">{t('brainstorm.confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-dialog-description">
            {t('brainstorm.confirmDeleteMessage')}
          </DialogContentText>

          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox
                  onChange={e => {
                    // Update the skipDeleteConfirmation setting
                    if (e.target.checked) {
                      updateSettings({
                        ...settings,
                        skipDeleteConfirmation: true,
                      });

                      // Log the setting change
                      loggerService.info('User enabled skipDeleteConfirmation setting');
                    }
                  }}
                  color="primary"
                />
              }
              label={t('brainstorm.dontAskAgain')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} aria-label={t('common.cancel')}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={() => {
              if (nodeToDelete) {
                handleNodeDelete(nodeToDelete);
                setNodeToDelete(null);
              }
              setDeleteConfirmOpen(false);
            }}
            color="error"
            variant="contained"
            aria-label={t('common.delete')}
          >
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Node edit dialog */}
      {selectedNode && (
        <MemoizedNodeEditDialog
          open={nodeEditOpen}
          onClose={() => {
            setNodeEditOpen(false);
            setSelectedNode(null);
          }}
          initialData={selectedNode.data}
          initialType={selectedNode.type as NodeType}
          onSave={handleNodeEdit}
        />
      )}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={snackbarSeverity}
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

// Add type definition for the global API
declare global {
  interface Window {
    brainstormFlowApi?: {
      zoomIn: () => void;
      zoomOut: () => void;
      fitView: () => void;
      addNode: (type?: NodeType) => void;
      saveFlow: () => void;
    };
  }
}

// Export the component with performance monitoring
export default EnhancedBrainstormFlow;
