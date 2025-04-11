import { Edge, Node, XYPosition } from 'reactflow';
import { create } from 'zustand';

import type {
  CustomNode,
  CustomEdge,
  NodeUpdate,
  NewNodeParams,
} from '../components/BrainstormFlow/types';
import { NodeData } from '../components/BrainstormFlow/types';

interface BrainstormState {
  nodes: CustomNode[];
  edges: CustomEdge[];
  isLoading: boolean;
  activeStep: number;
  activeTab: number;
  error: string | null;
  setNodes: (nodes: CustomNode[] | ((prev: CustomNode[]) => CustomNode[])) => void;
  setEdges: (edges: CustomEdge[] | ((prev: CustomEdge[]) => CustomEdge[])) => void;
  setActiveStep: (step: number) => void;
  setActiveTab: (tab: number) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  updateNode: (update: NodeUpdate) => void;
  addNode: (params: NewNodeParams) => void;
  removeNode: (nodeId: string) => void;
  addEdge: (source: string, target: string) => void;
  removeEdge: (edgeId: string) => void;
}

export const useBrainstormStore = create<BrainstormState>(set => ({
  nodes: [],
  edges: [],
  isLoading: false,
  activeStep: -1,
  activeTab: 1,
  error: null,
  setNodes: nodes =>
    set(state => ({
      nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
    })),
  setEdges: edges =>
    set(state => ({
      edges: typeof edges === 'function' ? edges(state.edges) : edges,
    })),
  setActiveStep: activeStep => set({ activeStep }),
  setActiveTab: activeTab => set({ activeTab }),
  setLoading: isLoading => set({ isLoading }),
  setError: error => set({ error }),
  updateNode: update =>
    set(state => ({
      nodes: state.nodes.map(node =>
        node.id === update.id
          ? {
              ...node,
              data: {
                ...node.data,
                ...(update.label && { label: update.label }),
                ...(update.notes && { notes: update.notes }),
              },
            }
          : node
      ),
    })),
  addNode: ({ type, label, position }) =>
    set(state => ({
      nodes: [
        ...state.nodes,
        {
          id: `${type}-${Date.now()}`,
          type,
          position,
          data: { label, type },
        },
      ],
    })),
  removeNode: nodeId =>
    set(state => ({
      nodes: state.nodes.filter(node => node.id !== nodeId),
      edges: state.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId),
    })),
  addEdge: (source, target) =>
    set(state => ({
      edges: [
        ...state.edges,
        {
          id: `edge-${source}-${target}-${Date.now()}`,
          source,
          target,
        },
      ],
    })),
  removeEdge: edgeId =>
    set(state => ({
      edges: state.edges.filter(edge => edge.id !== edgeId),
    })),
}));
