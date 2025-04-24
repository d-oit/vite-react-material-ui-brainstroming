import type { XYPosition } from 'reactflow'
import type { CSSProperties } from 'react'
import { Edge, Node } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'
import debounce from 'lodash/debounce'

import type { CustomNodeType, CustomEdge, NodeData } from '../components/BrainstormFlow/types'
import type { NodeType } from '../types/enums'
import { EdgeType } from '../types/enums'
import projectService from '../services/ProjectService'
import loggerService from '../services/LoggerService'
import type { Node as ProjectNode, Edge as ProjectEdge } from '../types'

interface NewNodeParams {
    type: NodeType
    label?: string
    position: XYPosition
}

// Helper to create default node data
const createDefaultNodeData = (id: string, type: NodeType, label?: string): NodeData => ({
    id,
    type,
    title: label ?? `New ${type}`,
    content: '',
    label: label ?? `New ${type}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    color: undefined,
    isArchived: false,
})

interface BrainstormState {
    projectId: string | null
    nodes: CustomNodeType[]
    edges: CustomEdge[]
    isLoading: boolean
    activeStep: number
    activeTab: number
    error: string | null
    setProjectId: (id: string | null) => void
    setNodes: (nodes: CustomNodeType[] | ((prev: CustomNodeType[]) => CustomNodeType[])) => void
    setEdges: (edges: CustomEdge[] | ((prev: CustomEdge[]) => CustomEdge[])) => void
    setActiveStep: (step: number) => void
    setActiveTab: (tab: number) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
    updateNodeData: (nodeId: string, dataUpdate: Partial<NodeData>) => void
    addNode: (params: NewNodeParams) => void
    removeNode: (nodeId: string) => void
    toggleArchiveNode: (nodeId: string) => void
    addEdge: (source: string, target: string) => void
    removeEdge: (edgeId: string) => void
}

// Type conversion helpers
const convertToProjectNode = (node: CustomNodeType): ProjectNode => {
    const { style, ...rest } = node;
    return {
        ...rest,
        type: node.type as NodeType,
        style: style ? Object.fromEntries(Object.entries(style)) : undefined
    };
};

const convertToProjectEdge = (edge: CustomEdge): ProjectEdge => {
    const { style, label, ...rest } = edge;
    return {
        ...rest,
        type: edge.type as EdgeType,
        label: label?.toString(),
        style: style ? Object.fromEntries(Object.entries(style)) : undefined
    };
};

// Debounced save function
const debouncedSave = debounce(async (projectId: string, nodes: CustomNodeType[], edges: CustomEdge[]) => {
    if (!projectId) return;
    
    try {
        await projectService.updateProject(projectId, { 
            nodes: nodes.map(convertToProjectNode),
            edges: edges.map(convertToProjectEdge)
        });
        loggerService.info('Project data saved automatically');
    } catch (error) {
        loggerService.error('Error auto-saving project data', error instanceof Error ? error : new Error(String(error)));
    }
}, 1500);

export const useBrainstormStore = create<BrainstormState>((set, get) => ({
    projectId: null,
    nodes: [],
    edges: [],
    isLoading: false,
    activeStep: -1,
    activeTab: 1,
    error: null,
    setProjectId: (projectId) => set({ projectId }),
    setNodes: (nodes) =>
        set((state) => {
            const newNodes = typeof nodes === 'function' ? nodes(state.nodes) : nodes;
            const { projectId } = state;
            if (projectId) {
                debouncedSave(projectId, newNodes, state.edges);
            }
            return { nodes: newNodes };
        }),
    setEdges: (edges) =>
        set((state) => {
            const newEdges = typeof edges === 'function' ? edges(state.edges) : edges;
            const { projectId } = state;
            if (projectId) {
                debouncedSave(projectId, state.nodes, newEdges);
            }
            return { edges: newEdges };
        }),
    setActiveStep: (activeStep) => set({ activeStep }),
    setActiveTab: (activeTab) => set({ activeTab }),
    setLoading: (isLoading) => set({ isLoading }),
    setError: (error) => set({ error }),
    updateNodeData: (nodeId, dataUpdate) =>
        set((state) => {
            const newNodes = state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            ...dataUpdate,
                            updatedAt: new Date().toISOString(),
                        },
                    }
                    : node,
            );
            if (state.projectId) {
                debouncedSave(state.projectId, newNodes, state.edges);
            }
            return { nodes: newNodes };
        }),
    addNode: ({ type, label, position }) => {
        const newNodeId = uuidv4();
        const nodeData = createDefaultNodeData(newNodeId, type, label);
        const newNode: CustomNodeType = {
            id: newNodeId,
            type,
            position,
            data: nodeData,
        };
        set((state) => {
            const newNodes = [...state.nodes, newNode];
            if (state.projectId) {
                debouncedSave(state.projectId, newNodes, state.edges);
            }
            return { nodes: newNodes };
        });
    },
    removeNode: (nodeId) =>
        set((state) => {
            const newNodes = state.nodes.filter((node) => node.id !== nodeId);
            const newEdges = state.edges.filter(
                (edge) => edge.source !== nodeId && edge.target !== nodeId
            );
            if (state.projectId) {
                debouncedSave(state.projectId, newNodes, newEdges);
            }
            return { nodes: newNodes, edges: newEdges };
        }),
    toggleArchiveNode: (nodeId) =>
        set((state) => {
            const newNodes = state.nodes.map((node) =>
                node.id === nodeId
                    ? {
                        ...node,
                        data: {
                            ...node.data,
                            isArchived: !node.data.isArchived,
                            updatedAt: new Date().toISOString(),
                        },
                    }
                    : node,
            );
            if (state.projectId) {
                debouncedSave(state.projectId, newNodes, state.edges);
            }
            return { nodes: newNodes };
        }),
    addEdge: (source, target) => {
        const newEdgeId = uuidv4();
        set((state) => {
            const newEdges = [
                ...state.edges,
                {
                    id: newEdgeId,
                    type: EdgeType.DEFAULT,
                    source,
                    target,
                },
            ];
            if (state.projectId) {
                debouncedSave(state.projectId, state.nodes, newEdges);
            }
            return { edges: newEdges };
        });
    },
    removeEdge: (edgeId) =>
        set((state) => {
            const newEdges = state.edges.filter((edge) => edge.id !== edgeId);
            if (state.projectId) {
                debouncedSave(state.projectId, state.nodes, newEdges);
            }
            return { edges: newEdges };
        }),
}));
