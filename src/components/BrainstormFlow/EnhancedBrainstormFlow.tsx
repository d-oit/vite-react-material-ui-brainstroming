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

  // Auto-save on significant changes
  React.useEffect(() => {
    handleSave();
  }, [nodes, edges, handleSave]);

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
    </div>
  );
};
