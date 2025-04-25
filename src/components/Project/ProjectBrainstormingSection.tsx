import { Box, Paper, Typography, Chip, CircularProgress, Snackbar, Alert } from '@mui/material'
import { useState, useCallback, useMemo, useRef } from 'react'
import type { Node as ReactFlowNode, Edge as ReactFlowEdge } from 'reactflow' // Use aliases for clarity
import { ReactFlowProvider } from 'reactflow'

import { useFocusManagement } from '../../hooks/useFocusManagement'
import { useKeyboardNavigation } from '../../hooks/useKeyboardNavigation'
import { useS3Sync } from '../../hooks/useS3Sync'
import type { Node, Edge, NodeData } from '../../types' // App-wide types
import { NodeType } from '../../types/enums' // App-wide enum
import type { ProjectTemplate, SyncSettings } from '../../types/project'
import { templateConfigs } from '../../types/project'
import { EnhancedBrainstormFlow } from '../BrainstormFlow/EnhancedBrainstormFlow'
import type { CustomNode, CustomEdge, NodeData as CustomNodeData } from '../BrainstormFlow/types' // Flow-specific types
import { ErrorBoundary } from '../ErrorBoundary/ErrorBoundary'

// --- Mapping Functions ---

const mapNodeToCustomNode = (node: Node): CustomNode => {
	return {
		id: node.id,
		position: node.position,
		type: node.type,
		data: {
			label: node.data.title ?? node.data.label ?? 'Untitled',
			type: node.type as CustomNodeData['type'],
			notes: node.data.content,
		},
		style: node.style as React.CSSProperties,
		selected: node.selected,
	}
}

const mapCustomNodeToNode = (customNode: CustomNode, existingNodes: Node[]): Node => {
	const existingNode = existingNodes.find((n) => n.id === customNode.id)
	const existingData = existingNode?.data ?? {
		id: customNode.id,
		title: '',
		content: '',
		createdAt: new Date().toISOString(),
		updatedAt: '',
		type: NodeType.IDEA,
	}
	const nodeTypeKey = customNode.data.type?.toUpperCase()
	const mappedType = NodeType[nodeTypeKey as keyof typeof NodeType] ?? existingData.type ?? NodeType.IDEA

	return {
		id: customNode.id,
		position: customNode.position,
		type: mappedType,
		data: {
			...existingData,
			title: customNode.data.label,
			label: customNode.data.label,
			content: customNode.data.notes ?? existingData.content,
			updatedAt: new Date().toISOString(),
			id: existingData.id,
			type: mappedType,
		},
		style: customNode.style as Record<string, unknown> | undefined,
		selected: customNode.selected,
	}
}

// --- Component ---

interface ProjectBrainstormingSectionProps {
	projectId: string
	template: ProjectTemplate
	initialNodes?: Node[]
	initialEdges?: Edge[]
	syncSettings?: SyncSettings
	readOnly?: boolean // Keep prop definition for potential future use
	onSave?: (nodes: Node[], edges: Edge[]) => void
}

export const ProjectBrainstormingSection = ({
	projectId,
	template,
	initialNodes = [],
	initialEdges = [],
	syncSettings,
	readOnly = false, // Keep prop destructuring
	onSave,
}: ProjectBrainstormingSectionProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	const [errorMessage, setErrorMessage] = useState<string | null>(null)
	const templateConfig = useMemo(() => templateConfigs[template], [template])
	const [nodes, setNodes] = useState<Node[]>(initialNodes)
	const [edges, setEdges] = useState<Edge[]>(initialEdges)

	const flowNodes = useMemo(() => nodes.map(mapNodeToCustomNode), [nodes])
	const flowEdges = useMemo(() => initialEdges as CustomEdge[], [initialEdges])

	const { updateNodeSelection: _updateNodeSelection } = useKeyboardNavigation(
		containerRef,
		nodes,
		(nodeId: string) => {
			/* ... */
		},
	)
	const { announceFocusChange } = useFocusManagement({
		containerRef,
		nodes,
		onFocusChange: (nodeId: string | null) => {
			/* ... */
		},
	})
	const { sync, syncStatus, lastSyncTime } = useS3Sync({
		projectId,
		syncSettings,
		data: { nodes, edges },
	})

	const handleSaveFromFlow = useCallback(
		(updatedFlowNodes: CustomNode[], updatedFlowEdges: CustomEdge[]) => {
			const updatedNodes = updatedFlowNodes.map((customNode) => mapCustomNodeToNode(customNode, nodes))
			const updatedEdges = updatedFlowEdges as Edge[]
			setNodes(updatedNodes)
			setEdges(updatedEdges)
			onSave?.(updatedNodes, updatedEdges)
			const syncEnabled = Boolean(syncSettings?.enableS3Sync)
			const isSaveSync = syncSettings?.syncFrequency === 'onSave'
			if (syncEnabled && isSaveSync) {
				void sync()
			}
		},
		[sync, syncSettings, onSave, nodes],
	)

	return (
		<>
			<Paper
				sx={
					{
						/* styles */
					}
				}
				elevation={0}
				role="region"
				aria-label="Project Brainstorming">
				{/* Header */}
				<Box
					sx={
						{
							/* styles */
						}
					}>
					{/* Removed suggested workflow text */}
					<Box
						sx={
							{
								/* styles */
							}
						}>
						{syncStatus === 'syncing' && (
							<Box
								sx={
									{
										/* styles */
									}
								}>
								{' '}
								<CircularProgress size={14} />{' '}
								<Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
									{' '}
									Syncing...{' '}
								</Typography>{' '}
							</Box>
						)}
						{syncStatus === 'error' && (
							<Chip
								label="Sync Error"
								color="error"
								size="small"
								onClick={() => void sync()}
								aria-label="Sync failed. Click to retry."
								sx={
									{
										/* styles */
									}
								}
							/>
						)}
						{syncStatus === 'success' && typeof lastSyncTime === 'string' && (
							<Chip
								label={`Last synced: ${new Date(lastSyncTime).toLocaleTimeString()}`}
								color="success"
								size="small"
								aria-label={`Last successful sync at ${new Date(lastSyncTime).toLocaleTimeString()}`}
								sx={
									{
										/* styles */
									}
								}
							/>
						)}
					</Box>
				</Box>

				{/* Main content area */}
				<Box
					sx={{
						height: 'calc(100vh - 200px)', // Provide sufficient height for the flow
						width: '100%', // Full width
						minHeight: '500px', // Minimum height to ensure visibility
						position: 'relative', // Required for ReactFlow to calculate dimensions correctly
					}}
					ref={containerRef}>
					<ErrorBoundary
						fallback={
							<Box sx={{ p: 2 }}>
								{' '}
								<Alert severity="error"> An error occurred... </Alert>{' '}
							</Box>
						}
						onReset={() => {
							setNodes(initialNodes)
							setEdges(initialEdges)
							setErrorMessage(null)
						}}>
						<ReactFlowProvider>
							<EnhancedBrainstormFlow
							initialNodes={flowNodes}
							initialEdges={flowEdges}
							onSave={handleSaveFromFlow}
							aria-label="Brainstorming Flow"
							key={`flow-${projectId}`} // Only recreate when projectId changes
							/>
						</ReactFlowProvider>
					</ErrorBoundary>
				</Box>
			</Paper>

			{/* Snackbar */}
			<Snackbar
				open={typeof errorMessage === 'string' && errorMessage.length > 0}
				autoHideDuration={6000}
				onClose={() => setErrorMessage(null)}
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
				<Alert severity="error" onClose={() => setErrorMessage(null)}>
					{' '}
					{errorMessage}{' '}
				</Alert>
			</Snackbar>
		</>
	)
}
