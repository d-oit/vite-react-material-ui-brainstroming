import type { Node, Edge } from './models';
import type { MouseEvent } from 'react';
import { NodeType, EdgeType, ConnectionMode, PanelPosition } from './enums';

export type NodeChange = 
  | { type: 'position'; id: string; position: { x: number; y: number } }
  | { type: 'dimensions'; id: string; dimensions: { width: number; height: number } }
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; item: Node };

export type EdgeChange =
  | { type: 'select'; id: string; selected: boolean }
  | { type: 'remove'; id: string }
  | { type: 'add'; item: Edge };

export interface Connection {
  source: string | null;
  target: string | null;
  sourceHandle?: string | null;
  targetHandle?: string | null;
}

export interface OnConnectStartParams {
  nodeId: string | null;
  handleId: string | null;
  handleType: 'source' | 'target';
}

export interface ReactFlowInstance {
  fitView: (params?: { padding?: number; includeHiddenNodes?: boolean }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  getNode: (id: string) => Node | undefined;
  getEdge: (id: string) => Edge | undefined;
  getNodes: () => Node[];
  getEdges: () => Edge[];
  setNodes: (nodes: Node[]) => void;
  setEdges: (edges: Edge[]) => void;
}

export interface FlowCallbacks {
  onNodesChange?: (changes: NodeChange[]) => void;
  onEdgesChange?: (changes: EdgeChange[]) => void;
  onConnect?: (connection: Connection) => void;
  onConnectStart?: (event: MouseEvent, params: OnConnectStartParams) => void;
  onConnectEnd?: (event: MouseEvent) => void;
  onNodeClick?: (event: MouseEvent, node: Node) => void;
  onNodeDoubleClick?: (event: MouseEvent, node: Node) => void;
  onNodeDragStart?: (event: MouseEvent, node: Node) => void;
  onNodeDrag?: (event: MouseEvent, node: Node) => void;
  onNodeDragStop?: (event: MouseEvent, node: Node) => void;
}

export interface FlowProps extends FlowCallbacks {
  nodes: Node[];
  edges: Edge[];
  defaultNodeType?: NodeType;
  defaultEdgeType?: EdgeType;
  connectionMode?: ConnectionMode;
  snapToGrid?: boolean;
  snapGrid?: [number, number];
  nodesDraggable?: boolean;
  nodesConnectable?: boolean;
  elementsSelectable?: boolean;
  selectNodesOnDrag?: boolean;
  panOnDrag?: boolean;
  minZoom?: number;
  maxZoom?: number;
  defaultZoom?: number;
  defaultPosition?: [number, number];
  preventScrolling?: boolean;
  zoomOnScroll?: boolean;
  zoomOnPinch?: boolean;
  panOnScroll?: boolean;
  panOnScrollMode?: 'free' | 'vertical' | 'horizontal';
  children?: React.ReactNode;
}

export interface FlowPanelProps {
  position: PanelPosition;
  children: React.ReactNode;
}