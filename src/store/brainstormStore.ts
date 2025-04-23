import type { XYPosition } from 'reactflow'
import { Edge, Node } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

import type { CustomNodeType, CustomEdge, NodeData } from '../components/BrainstormFlow/types'
import type { NodeType } from '../types/enums'
import { EdgeType } from '../types/enums'

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
	nodes: CustomNodeType[]
	edges: CustomEdge[]
	isLoading: boolean
	activeStep: number
	activeTab: number
	error: string | null
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

export const useBrainstormStore = create<BrainstormState>((set) => ({
	nodes: [],
	edges: [],
	isLoading: false,
	activeStep: -1,
	activeTab: 1,
	error: null,
	setNodes: (nodes) =>
		set((state) => ({
			nodes: typeof nodes === 'function' ? nodes(state.nodes) : nodes,
		})),
	setEdges: (edges) =>
		set((state) => ({
			edges: typeof edges === 'function' ? edges(state.edges) : edges,
		})),
	setActiveStep: (activeStep) => set({ activeStep }),
	setActiveTab: (activeTab) => set({ activeTab }),
	setLoading: (isLoading) => set({ isLoading }),
	setError: (error) => set({ error }),
	updateNodeData: (nodeId, dataUpdate) =>
		set((state) => ({
			nodes: state.nodes.map((node) =>
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
			),
		})),
	addNode: ({ type, label, position }) => {
		const newNodeId = uuidv4()
		const nodeData = createDefaultNodeData(newNodeId, type, label)
		const newNode: CustomNodeType = {
			id: newNodeId,
			type,
			position,
			data: nodeData,
		}
		set((state) => ({
			nodes: [...state.nodes, newNode],
		}))
	},
	removeNode: (nodeId) =>
		set((state) => ({
			nodes: state.nodes.filter((node) => node.id !== nodeId),
			edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
		})),
	toggleArchiveNode: (nodeId) =>
		set((state) => ({
			nodes: state.nodes.map((node) =>
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
			),
		})),
	addEdge: (source, target) => {
		const newEdgeId = uuidv4()
		set((state) => ({
			edges: [
				...state.edges,
				{
					id: newEdgeId,
					type: EdgeType.DEFAULT,
					source,
					target,
				},
			],
		}))
	},
	removeEdge: (edgeId) =>
		set((state) => ({
			edges: state.edges.filter((edge) => edge.id !== edgeId),
		})),
}))
