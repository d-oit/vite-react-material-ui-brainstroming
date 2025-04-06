import { Add as AddIcon, Save as SaveIcon } from '@mui/icons-material';
import { Box, Button, Fab, useTheme, Paper, Typography } from '@mui/material';
import { useState, useCallback, useRef } from 'react';
import type {
  // Node as FlowNode,
  // Edge as FlowEdge,
  NodeTypes,
  // EdgeTypes,
  Connection,
  ReactFlowInstance,
} from 'reactflow';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Panel,
} from 'reactflow';
import 'reactflow/dist/style.css';

import loggerService from '../../services/LoggerService';
import type { NodeData, Node, Edge } from '../../types';
import { NodeType } from '../../types';

import CustomNode from './CustomNode';
import { NodeEditDialog } from './NodeEditDialog';

// import { useI18n } from '../../contexts/I18nContext';

// Define custom node types
const nodeTypes: NodeTypes = {
  [NodeType.IDEA]: CustomNode,
  [NodeType.TASK]: CustomNode,
  [NodeType.NOTE]: CustomNode,
  [NodeType.RESOURCE]: CustomNode,
};

interface BrainstormFlowProps {
  initialNodes?: Node[];
  initialEdges?: Edge[];
  onSave?: (nodes: Node[], edges: Edge[]) => void;
  readOnly?: boolean;
}

export const BrainstormFlow = ({
  initialNodes = [],
  initialEdges = [],
  onSave,
  readOnly = false,
}: BrainstormFlowProps) => {
  const theme = useTheme();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [_reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingNode, setEditingNode] = useState<Node | null>(null);

  // Handle connection between nodes
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

      setEdges(eds => addEdge(newEdge, eds));
    },
    [edges, setEdges]
  );

  // Handle node edit
  const handleEditNode = useCallback(
    (nodeId: string) => {
      const node = nodes.find(n => n.id === nodeId);
      if (node) {
        setEditingNode(node);
        setIsDialogOpen(true);
      }
    },
    [nodes]
  );

  // Handle node delete
  const handleDeleteNode = useCallback(
    (nodeId: string, event?: React.MouseEvent) => {
      event?.stopPropagation(); // Prevent node selection

      try {
        // Find connected edges
        const connectedEdges = edges.filter(
          edge => edge.source === nodeId || edge.target === nodeId
        );

        // Log the deletion
        loggerService.info(`Deleting node ${nodeId} with ${connectedEdges.length} connected edges`);

        // Update nodes and edges
        setNodes(nds => nds.filter(n => n.id !== nodeId));
        setEdges(eds => eds.filter(e => e.source !== nodeId && e.target !== nodeId));
      } catch (error) {
        console.error('Error deleting node:', error);
        loggerService.error(
          'Error deleting node',
          error instanceof Error ? error : new Error(String(error))
        );
      }
    },
    [setNodes, setEdges, edges]
  );

  // Add new node
  const handleAddNode = useCallback(() => {
    setEditingNode(null);
    setIsDialogOpen(true);
  }, []);

  // Save node data from dialog
  const handleSaveNode = useCallback(
    (data: NodeData, type: NodeType) => {
      if (editingNode) {
        // Update existing node
        setNodes(nds =>
          nds.map(n => {
            if (n.id === editingNode.id) {
              return {
                ...n,
                data: {
                  ...data,
                  onEdit: handleEditNode,
                  onDelete: handleDeleteNode,
                },
                type,
              };
            }
            return n;
          })
        );
      } else {
        // Add new node
        const newNode: Node = {
          id: `node-${Date.now()}`,
          type,
          position: {
            x: Math.random() * 300,
            y: Math.random() * 300,
          },
          data: {
            ...data,
            onEdit: handleEditNode,
            onDelete: handleDeleteNode,
          },
        };
        setNodes(nds => [...nds, newNode]);
      }
      setIsDialogOpen(false);
    },
    [editingNode, setNodes, handleEditNode, handleDeleteNode]
  );

  // Save the current flow
  const handleSave = useCallback(() => {
    if (onSave) {
      onSave(nodes, edges);
    }
  }, [nodes, edges, onSave]);

  // Handle flow initialization
  const onInit = useCallback((instance: ReactFlowInstance) => {
    setReactFlowInstance(instance);
  }, []);

  return (
    <Box
      ref={reactFlowWrapper}
      sx={{
        height: '600px', // Fixed height to ensure React Flow renders properly
        width: '100%',
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 1,
        overflow: 'hidden',
        position: 'relative', // Ensure proper positioning
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        attributionPosition="bottom-right"
        connectionMode="loose"
        connectionLineStyle={{ stroke: '#2196f3', strokeWidth: 3 }}
        connectionLineType="smoothstep"
        zoomOnScroll={true}
        panOnScroll={true}
      >
        <Background />
        <Controls />
        <MiniMap />

        {!readOnly && (
          <Panel position="top-right">
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSave}
              >
                Save
              </Button>
            </Box>
          </Panel>
        )}

        {nodes.length === 0 && (
          <Panel position="center">
            <Paper sx={{ p: 3, textAlign: 'center', maxWidth: 400 }}>
              <Typography variant="h6" gutterBottom>
                Start Brainstorming
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                Click the + button to add your first idea, task, note, or resource.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddNode}
              >
                Add First Node
              </Button>
            </Paper>
          </Panel>
        )}
      </ReactFlow>

      {!readOnly && (
        <Fab
          color="primary"
          aria-label="add"
          onClick={handleAddNode}
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
          }}
        >
          <AddIcon />
        </Fab>
      )}

      <NodeEditDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSave={handleSaveNode}
        initialData={editingNode?.data}
        initialType={editingNode?.type as NodeType}
      />
    </Box>
  );
};
