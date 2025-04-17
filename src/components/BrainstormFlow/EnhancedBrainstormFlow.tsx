import React, { useCallback, useRef, useMemo } from 'react';
import type { ReactFlowInstance, Connection, NodeChange, EdgeChange } from 'reactflow';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
} from 'reactflow';
import 'reactflow/dist/style.css';

import { useBrainstormStore } from '../../store/brainstormStore';
import DeleteConfirmationDialog from '../DeleteConfirmationDialog';
import LLMChatPanel from '../../features/brainstorming/LLMChatPanel';
import NodeEditDialog from './NodeEditDialog';

import { FloatingControls } from './FloatingControls';
import CustomNode from './nodes/CustomNode';
import type { CustomNode as CustomNodeType, CustomEdge } from './types';

const nodeTypes = {
  idea: CustomNode,
  task: CustomNode,
  resource: CustomNode,
  note: CustomNode,
};

interface EnhancedBrainstormFlowProps {
  initialNodes: CustomNodeType[];
  initialEdges: CustomEdge[];
  onSave?: (nodes: CustomNodeType[], edges: CustomEdge[]) => void;
}

export const EnhancedBrainstormFlow: React.FC<EnhancedBrainstormFlowProps> = ({
  initialNodes,
  initialEdges,
  onSave,
}) => {
  const flowRef = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = React.useState<ReactFlowInstance | null>(null);
  const { nodes, edges, setNodes, setEdges } = useBrainstormStore();

  const [mousePosition, setMousePosition] = React.useState({ x: 100, y: 100 });
  const [showEditDialog, setShowEditDialog] = React.useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = React.useState(false);
  const [showChatPanel, setShowChatPanel] = React.useState(false);
  const [selectedNode, setSelectedNode] = React.useState<CustomNodeType | null>(null);

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => {
      setNodes(currentNodes => applyNodeChanges(changes, currentNodes) as CustomNodeType[]);
    },
    [setNodes]
  );

  const onEdgesChange = useCallback(
    (changes: EdgeChange[]) => {
      setEdges(currentEdges => applyEdgeChanges(changes, currentEdges) as CustomEdge[]);
    },
    [setEdges]
  );

  const onConnect = useCallback(
    (connection: Connection) => {
      setEdges(currentEdges => addEdge(connection, currentEdges) as CustomEdge[]);
    },
    [setEdges]
  );

  // Track mouse position for new node placement
  const onMouseMove = useCallback(
    (event: React.MouseEvent) => {
      if (reactFlowInstance) {
        const bounds = flowRef.current?.getBoundingClientRect();
        if (bounds) {
          const position = reactFlowInstance.screenToFlowPosition({
            x: event.clientX - bounds.left,
            y: event.clientY - bounds.top,
          });
          setMousePosition(position);
        }
      }
    },
    [reactFlowInstance]
  );

  // Save changes when needed
  const handleSave = useCallback(() => {
    if (onSave && reactFlowInstance) {
      const currentNodes = reactFlowInstance.getNodes() as CustomNodeType[];
      const currentEdges = reactFlowInstance.getEdges() as CustomEdge[];
      onSave(currentNodes, currentEdges);
    }
  }, [onSave, reactFlowInstance]);

  // Initialize flow with props
  React.useEffect(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Track previous state to detect changes
  const prevNodesRef = React.useRef<string>(JSON.stringify(initialNodes));
  const prevEdgesRef = React.useRef<string>(JSON.stringify(initialEdges));

  // Auto-save only when there are actual changes
  React.useEffect(() => {
    const currentNodesJSON = JSON.stringify(nodes);
    const currentEdgesJSON = JSON.stringify(edges);

    // Check if nodes or edges have changed
    const nodesChanged = currentNodesJSON !== prevNodesRef.current;
    const edgesChanged = currentEdgesJSON !== prevEdgesRef.current;

    // Only save if there are actual changes
    if (nodesChanged || edgesChanged) {
      handleSave();

      // Update previous state references
      prevNodesRef.current = currentNodesJSON;
      prevEdgesRef.current = currentEdgesJSON;
    }
  }, [nodes, edges, handleSave]);

  // Handle node click for editing
  const handleNodeClick = useCallback((event: React.MouseEvent, node: CustomNodeType) => {
    setSelectedNode(node);
    setShowEditDialog(true);
  }, []);

  // Handle node delete
  const handleNodeDelete = useCallback((node: CustomNodeType) => {
    setSelectedNode(node);
    setShowDeleteDialog(true);
  }, []);

  // Handle chat panel open
  const handleChatOpen = useCallback((node: CustomNodeType) => {
    setSelectedNode(node);
    setShowChatPanel(true);
  }, []);

  // Handle dialog close
  const handleCloseEditDialog = useCallback(() => {
    setShowEditDialog(false);
    setSelectedNode(null);
  }, []);

  // Handle delete confirmation
  const handleConfirmDelete = useCallback(() => {
    if (selectedNode) {
      setNodes(nodes => nodes.filter(n => n.id !== selectedNode.id));
      setShowDeleteDialog(false);
      setSelectedNode(null);
    }
  }, [selectedNode, setNodes]);

  // Handle delete dialog close
  const handleCloseDeleteDialog = useCallback(() => {
    setShowDeleteDialog(false);
    setSelectedNode(null);
  }, []);

  // Handle chat panel close
  const handleCloseChatPanel = useCallback(() => {
    setShowChatPanel(false);
    setSelectedNode(null);
  }, []);

  // Handle node update
  const handleNodeUpdate = useCallback((nodeId: string, data: any) => {
    setNodes(nodes =>
      nodes.map(node =>
        node.id === nodeId
          ? {
            ...node,
            data: {
              ...node.data,
              ...data,
            },
          }
          : node
      )
    );
    setShowEditDialog(false);
    setSelectedNode(null);
  }, [setNodes]);

  return (
    <div ref={flowRef} style={{ width: '100%', height: '100%' }} onMouseMove={onMouseMove}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={setReactFlowInstance}
        nodeTypes={nodeTypes}
        onNodeClick={handleNodeClick}
        fitView
        minZoom={0.1}
        maxZoom={1.5}
        attributionPosition="bottom-left"
      >
        <Controls />
        <MiniMap />
        <Background />
      </ReactFlow>
      <FloatingControls position={mousePosition} />

      {/* Node Edit Dialog */}
      {showEditDialog && selectedNode && (
        <NodeEditDialog
          open={showEditDialog}
          onClose={handleCloseEditDialog}
          initialData={selectedNode.data}
          initialType={selectedNode.type as any}
          onSave={(data, type) => handleNodeUpdate(selectedNode.id, { ...data, type })}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && selectedNode && (
        <DeleteConfirmationDialog
          open={showDeleteDialog}
          onClose={handleCloseDeleteDialog}
          onConfirm={handleConfirmDelete}
        />
      )}

      {/* Chat Panel */}
      {showChatPanel && selectedNode && (
        <LLMChatPanel
          open={showChatPanel}
          onClose={handleCloseChatPanel}
          projectId={selectedNode.id}
          session={{ id: 'flow-chat', projectId: selectedNode.id, nodes: [] }}
          onInsightGenerated={() => { }}
        />
      )}
    </div>
  );
};
