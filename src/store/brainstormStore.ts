import debounce from 'lodash/debounce'
import type { CSSProperties } from 'react'
import type { XYPosition } from 'reactflow'
import { Edge, Node } from 'reactflow'
import { v4 as uuidv4 } from 'uuid'
import { create } from 'zustand'

import type { CustomNodeType, CustomEdge, NodeData } from '../components/BrainstormFlow/types'
import loggerService from '../services/LoggerService'
import projectService from '../services/ProjectService'
import type { Node as ProjectNode, Edge as ProjectEdge } from '../types'
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
    projectId: string | null
    nodes: CustomNodeType[]
    edges: CustomEdge[]
    isLoading: boolean
    activeStep: number
    activeTab: number
    error: string | null
    autoSave: boolean
    setAutoSave: (autoSave: boolean) => void
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
    updateNodePositions: (updatedNodes: { id: string; position: XYPosition }[]) => void
    saveAllNodes: () => Promise<void>
    loadNodesWithPositions: (projectId: string) => Promise<void>
    addTag: (nodeId: string, tag: string) => void
    removeTag: (nodeId: string, tag: string) => void
    addEdge: (source: string, target: string) => void
    removeEdge: (edgeId: string) => void
}

// Type conversion helpers
const convertToProjectNode = (node: CustomNodeType): ProjectNode => {
	const { style, ...rest } = node
	return {
		...rest,
		type: node.type as NodeType,
		style: style ? Object.fromEntries(Object.entries(style)) : undefined,
	}
}

const convertToProjectEdge = (edge: CustomEdge): ProjectEdge => {
	const { style, label, ...rest } = edge
	return {
		...rest,
		type: edge.type as EdgeType,
		label: label?.toString(),
		style: style ? Object.fromEntries(Object.entries(style)) : undefined,
	}
}

// Debounced save function
// Configure logger to show debug messages
loggerService.configure({ minLogLevel: 'debug' })

// Create a single debounced save instance
const debouncedSave = debounce(async (projectId: string, nodes: CustomNodeType[], edges: CustomEdge[], shouldAutoSave: boolean) => {
	// Get fresh state to ensure we're saving the latest data
	const currentState = useBrainstormStore.getState()
	const currentNodes = currentState.nodes
	const currentEdges = currentState.edges

	console.log('🔄 debouncedSave triggered', {
		projectId,
		nodesCount: currentNodes.length,
		edgesCount: currentEdges.length,
		shouldAutoSave,
		autoSaveFromState: currentState.autoSave,
	})
	loggerService.info('Saving project changes', { projectId, nodesCount: nodes.length, edgesCount: edges.length })

	if (!projectId || !shouldAutoSave) {
		console.log('❌ debouncedSave skipped:', !projectId ? 'no projectId' : 'autoSave disabled')
		loggerService.info('Save operation skipped', { reason: !projectId ? 'no projectId' : 'autoSave disabled' })
		return
	}

	try {
		console.log('💾 Attempting to save project:', projectId)
		loggerService.info('Saving project to database', {
			projectId,
			nodesToSave: nodes.length,
			edgesToSave: edges.length,
			sampleNode: nodes[0] ? JSON.stringify(nodes[0]).substring(0, 100) : 'no nodes',
			autoSave: shouldAutoSave,
			autoSaveFromState: useBrainstormStore.getState().autoSave,
		})

		const updates = {
			nodes: nodes.map(convertToProjectNode),
			edges: edges.map(convertToProjectEdge),
		}

		loggerService.info('Converted nodes ready to save', {
			convertedNodeCount: updates.nodes.length,
			sampleConvertedNode: updates.nodes[0] ? JSON.stringify(updates.nodes[0]).substring(0, 100) : 'no nodes',
		})

		await projectService.updateProject(projectId, updates)
		loggerService.info('Project data saved automatically')
	} catch (error) {
		loggerService.error('Error auto-saving project data', error instanceof Error ? error : new Error(String(error)))
	}
}, 1500)

export const useBrainstormStore = create<BrainstormState>((set, get) => ({
	projectId: null,
	nodes: [],
	edges: [],
	isLoading: false,
	activeStep: -1,
	activeTab: 1,
	error: null,
	autoSave: true,
	setAutoSave: (autoSave: boolean) => set({ autoSave }),
	setProjectId: (projectId) => set({ projectId }),
	setNodes: (nodes) =>
		set((state) => {
			const newNodes = typeof nodes === 'function' ? nodes(state.nodes) : nodes
			const { projectId } = state
			if (projectId) {
				debouncedSave(projectId, newNodes, state.edges, state.autoSave)
			}
			return { nodes: newNodes }
		}),
	setEdges: (edges) =>
		set((state) => {
			const newEdges = typeof edges === 'function' ? edges(state.edges) : edges
			const { projectId } = state
			if (projectId) {
				debouncedSave(projectId, state.nodes, newEdges, state.autoSave)
			}
			return { edges: newEdges }
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
			)
			if (state.projectId) {
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			}
			return { nodes: newNodes }
		}),
	addNode: ({ type, label, position }) => {
		loggerService.info('Adding new node', { type, label })
		const newNodeId = uuidv4()
		const nodeData = createDefaultNodeData(newNodeId, type, label)
		const newNode: CustomNodeType = {
			id: newNodeId,
			type,
			position,
			data: nodeData,
		}
		set((state) => {
			const newNodes = [...state.nodes, newNode]
			loggerService.info('State update for new node', {
				hasProjectId: !!state.projectId,
				autoSave: state.autoSave,
				nodeCount: newNodes.length,
			})
			if (state.projectId) {
				console.log('🔄 Triggering save after node addition', {
					projectId: state.projectId,
					autoSave: state.autoSave,
					nodeCount: newNodes.length,
				})
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			} else {
				console.log('❌ Cannot save: no projectId available')
			}
			return {
				...state,  // Preserve all existing state
				nodes: newNodes,
			}
		})
	},
	removeNode: (nodeId) =>
		set((state) => {
			const newNodes = state.nodes.filter((node) => node.id !== nodeId)
			const newEdges = state.edges.filter(
				(edge) => edge.source !== nodeId && edge.target !== nodeId,
			)
			if (state.projectId) {
				debouncedSave(state.projectId, newNodes, newEdges, state.autoSave)
			}
			return {
				...state,
				nodes: newNodes,
				edges: newEdges,
			}
		}),
	updateNodePositions: (updatedNodes) =>
		      set((state) => {
		          const newNodes = state.nodes.map((node) => {
		              const updatedNode = updatedNodes.find((n) => n.id === node.id)
		              if (updatedNode) {
		                  return {
		                      ...node,
		                      position: updatedNode.position,
		                  }
		              }
		              return node
		          })
		          if (state.projectId) {
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			}
			return {
				...state,
				nodes: newNodes,
			}
		}),

	saveAllNodes: async () => {
		const state = get()
		if (!state.projectId) return

		try {
			set({ isLoading: true })
			await projectService.updateProject(state.projectId, {
				nodes: state.nodes.map(convertToProjectNode),
				edges: state.edges.map(convertToProjectEdge),
			})
			loggerService.info('All nodes saved successfully')
		} catch (error) {
			loggerService.error('Error saving nodes', error instanceof Error ? error : new Error(String(error)))
			set({ error: 'Failed to save nodes' })
		} finally {
			set({ isLoading: false })
		}
	},

	loadNodesWithPositions: async (projectId) => {
		loggerService.info('Loading nodes for project', { projectId })
		try {
			set({ isLoading: true })
			const project = await projectService.getProject(projectId)

			// First log the loaded project
			loggerService.info('Project loaded from database', {
				hasProject: !!project,
				nodeCount: project?.nodes?.length || 0,
				autoSave: project?.syncSettings?.autoSave ?? true,
			})

			if (project) {
				// Convert nodes and edges with proper type information
				const convertedNodes = (project.nodes || []).map((node) => ({
					...node,
					type: node.type as NodeType,
					data: {
						...node.data,
						type: node.type as NodeType,
						updatedAt: node.data?.updatedAt || new Date().toISOString(),
					},
				})) as CustomNodeType[]

				const convertedEdges = (project.edges || []).map((edge) => ({
					...edge,
					type: edge.type || EdgeType.DEFAULT,
				})) as CustomEdge[]

				const storeState = {
					nodes: convertedNodes,
					edges: convertedEdges,
					projectId,
					autoSave: project.syncSettings?.autoSave ?? true,
				}

				// Set the state
				set(storeState)

				// Log after state update
				loggerService.info('Project state updated in store', {
					projectId,
					nodeCount: project.nodes?.length || 0,
					edgeCount: project.edges?.length || 0,
					autoSave: project.syncSettings?.autoSave ?? true,
					sampleNode: project.nodes?.[0] ? JSON.stringify(project.nodes[0]).substring(0, 100) : 'no nodes',
				})
			}
		} catch (error) {
			loggerService.error('Error loading nodes', error instanceof Error ? error : new Error(String(error)))
			set({ error: 'Failed to load nodes' })
		} finally {
			set({ isLoading: false })
		}
	},

	addTag: (nodeId, tag) =>
		set((state) => {
			const newNodes = state.nodes.map((node) =>
				node.id === nodeId && !node.data.tags?.includes(tag)
					? {
						...node,
						data: {
							...node.data,
							tags: [...(node.data.tags || []), tag],
							updatedAt: new Date().toISOString(),
						},
					}
					: node,
			)
			if (state.projectId) {
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			}
			return { nodes: newNodes }
		}),

	removeTag: (nodeId, tag) =>
		set((state) => {
			const newNodes = state.nodes.map((node) =>
				node.id === nodeId
					? {
						...node,
						data: {
							...node.data,
							tags: node.data.tags?.filter((t) => t !== tag) || [],
							updatedAt: new Date().toISOString(),
						},
					}
					: node,
			)
			if (state.projectId) {
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			}
			return { nodes: newNodes }
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
			)
			if (state.projectId) {
				debouncedSave(state.projectId, newNodes, state.edges, state.autoSave)
			}
			return { nodes: newNodes }
		}),
	addEdge: (source, target) => {
		const newEdgeId = uuidv4()
		set((state) => {
			const newEdges = [
				...state.edges,
				{
					id: newEdgeId,
					type: EdgeType.DEFAULT,
					source,
					target,
				},
			]
			if (state.projectId) {
				debouncedSave(state.projectId, state.nodes, newEdges, state.autoSave)
			}
			return { edges: newEdges }
		})
	},
	removeEdge: (edgeId) =>
		set((state) => {
			const newEdges = state.edges.filter((edge) => edge.id !== edgeId)
			if (state.projectId) {
				debouncedSave(state.projectId, state.nodes, newEdges, state.autoSave)
			}
			return { edges: newEdges }
		}),
}))
