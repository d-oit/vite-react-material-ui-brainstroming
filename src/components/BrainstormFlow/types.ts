import { Edge, Node } from 'reactflow';

export type NodeType = 'idea' | 'task' | 'resource' | 'note';

export interface NodeData {
  label: string;
  type: NodeType;
  notes?: string;
}

export type CustomNode = Node<NodeData>;
export type CustomEdge = Edge;

export interface NodeUpdate {
  id: string;
  label?: string;
  notes?: string;
}

export interface NewNodeParams {
  type: NodeType;
  label: string;
  position: { x: number; y: number };
}