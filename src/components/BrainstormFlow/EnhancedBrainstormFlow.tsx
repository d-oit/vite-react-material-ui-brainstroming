import { useState, useCallback, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Node as FlowNode,
  Edge as FlowEdge,
  NodeTypes,
  EdgeTypes,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
  ReactFlowInstance,
  useReactFlow,
  XYPosition,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  Box,
  useTheme,
  useMediaQuery,
  Snackbar,
  Alert,
} from '@mui/material';
import CustomNode from './CustomNode';
import { NodeEditDialog } from './NodeEditDialog';
import { NodeType, NodeData, Node, Edge } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';

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

export const EnhancedBrainstormFlow = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readOnly = false,
  onNodesChange: externalNodesChange,
  onEdgesChange: externalEdgesChange,
}: EnhancedBrainstormFlowProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [nodeEditOpen, setNodeEditOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');

  // We'll use these functions from the useReactFlow hook

  // Handle nodes change with external callback
  const handleNodesChange = useCallback((changes: any) => {
    onNodesChange(changes);
    if (externalNodesChange) {
      const updatedNodes = nodes.map(node => {
        const change = changes.find((c: any) => c.id === node.id && c.type === 'position');
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
  }, [nodes, onNodesChange, externalNodesChange]);

  // Handle edges change with external callback
  const handleEdgesChange = useCallback((changes: any) => {
    onEdgesChange(changes);
    if (externalEdgesChange) {
      // Filter out removed edges
      const removedEdgeIds = changes
        .filter((c: any) => c.type === 'remove')
        .map((c: any) => c.id);

      const updatedEdges = edges.filter(edge => !removedEdgeIds.includes(edge.id));
      externalEdgesChange(updatedEdges);
    }
  }, [edges, onEdgesChange, externalEdgesChange]);

  // Connect nodes
  const onConnect = useCallback(
    (connection: Connection) => {
      const newEdge = {
        ...connection,
        id: `edge-${connection.source}-${connection.target}`,
        type: 'smoothstep',
      };
      const updatedEdges = addEdge(newEdge, edges);
      setEdges(updatedEdges);

      if (externalEdgesChange) {
        externalEdgesChange(updatedEdges);
      }

      showSnackbar(t('brainstorm.edgeCreated'), 'success');
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
      const updatedNodes = nodes.filter(node => node.id !== nodeId);
      const updatedEdges = edges.filter(
        edge => edge.source !== nodeId && edge.target !== nodeId
      );

      setNodes(updatedNodes);
      setEdges(updatedEdges);
      setNodeEditOpen(false);
      setSelectedNode(null);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes);
      }

      if (externalEdgesChange) {
        externalEdgesChange(updatedEdges);
      }

      showSnackbar(t('brainstorm.nodeDeleted'), 'info');
    },
    [nodes, edges, setNodes, setEdges, externalNodesChange, externalEdgesChange, t]
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

      const updatedNodes = [...nodes, newNode];
      setNodes(updatedNodes);

      if (externalNodesChange) {
        externalNodesChange(updatedNodes);
      }

      // Select the new node for editing
      setSelectedNode(newNode);
      setNodeEditOpen(true);

      showSnackbar(t('brainstorm.nodeCreated'), 'success');
    },
    [reactFlowInstance, nodes, setNodes, externalNodesChange, readOnly, t]
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

  // Auto-fit view and handle window resize will be handled in the FlowContent component
  // since that's where we have access to the ReactFlow context

  // Expose zoom functions to parent - we'll set this up after the component mounts
  useEffect(() => {
    // Wait for the next tick to ensure the functions are assigned
    const timer = setTimeout(() => {
      if (fitView && zoomIn && zoomOut) {
        window.brainstormFlowApi = {
          zoomIn,
          zoomOut,
          fitView: () => fitView({ padding: 0.2 }),
          addNode,
          saveFlow,
        };
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      window.brainstormFlowApi = undefined;
    };
  }, [addNode, saveFlow]);

  // Get ReactFlow utility functions
  const { fitView, zoomIn, zoomOut, setViewport } = useReactFlow();

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
              backgroundColor: theme.palette.mode === 'dark'
                ? theme.palette.grey[900]
                : theme.palette.grey[100],
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        )}

        {!isMobile && !readOnly && (
          <Controls
            position="bottom-right"
            showInteractive={false}
            style={{
              backgroundColor: theme.palette.mode === 'dark'
                ? theme.palette.grey[900]
                : theme.palette.grey[100],
              border: `1px solid ${theme.palette.divider}`,
            }}
          />
        )}
      </ReactFlow>

      {/* Node edit dialog */}
      {selectedNode && (
        <NodeEditDialog
          open={nodeEditOpen}
          onClose={() => {
            setNodeEditOpen(false);
            setSelectedNode(null);
          }}
          node={selectedNode}
          onSave={handleNodeEdit}
          onDelete={() => handleNodeDelete(selectedNode.id)}
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
