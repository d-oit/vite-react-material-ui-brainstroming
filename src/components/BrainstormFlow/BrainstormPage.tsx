import SaveIcon from '@mui/icons-material/Save'
import { Box, Paper, Typography, Fab } from '@mui/material'
import React, { Suspense } from 'react'
import type { Node, Edge } from 'reactflow'
import { ReactFlowProvider } from 'reactflow'

import { useI18n } from '../../contexts/I18nContext'
import { useBrainstormStore } from '../../store/brainstormStore'
import { BrainstormErrorBoundary } from '../ErrorBoundary/BrainstormErrorBoundary'
import ContentLayout from '../UI/ContentLayout'
import NavigationTabs from '../UI/NavigationTabs'

import { EnhancedBrainstormFlow } from './EnhancedBrainstormFlow'
import { LoadingMindMap } from './LoadingMindMap'

interface BrainstormPageProps {
	initialNodes?: Node[]
	initialEdges?: Edge[]
	onSave?: (nodes: Node[], edges: Edge[]) => void
	projectTitle?: string
}

const BrainstormPage: React.FC<BrainstormPageProps> = ({
	initialNodes = [],
	initialEdges = [],
	onSave,
	projectTitle = 'Brainstorming Session',
}) => {
	const { t } = useI18n()
	const { activeStep, activeTab, setActiveTab, setNodes, setEdges } = useBrainstormStore()

	React.useEffect(() => {
		setNodes(initialNodes)
		setEdges(initialEdges)
	}, [initialNodes, initialEdges, setNodes, setEdges])

	const handleTabChange = React.useCallback(
		(tabId: number) => {
			setActiveTab(tabId)
		},
		[setActiveTab],
	)

	const header = (
		<Box>
			<Typography
				variant="h5"
				sx={{
					p: 2,
					pb: 1,
				}}
				component="h1">
				{projectTitle}
			</Typography>

			<NavigationTabs
				tabs={[
					{ label: t('brainstorm.overview') || 'Overview', id: 'overview' },
					{ label: t('brainstorm.brainstorm') || 'Brainstorm', id: 'brainstorm' },
					{ label: t('brainstorm.settings') || 'Settings', id: 'settings' },
				]}
				activeTab={activeTab}
				onChange={handleTabChange}
			/>
		</Box>
	)

	const handleSave = React.useCallback(
		(nodes: Node[], edges: Edge[]) => {
			setNodes(nodes)
			setEdges(edges)
			onSave?.(nodes, edges)
		},
		[setNodes, setEdges, onSave],
	)

	return (
		<ContentLayout header={header} fullHeight>
			<Box
				sx={{
					height: 'calc(100vh - 120px)', // Adjust for header height
					display: 'flex',
					flexDirection: 'column',
					position: 'relative',
				}}>
				<BrainstormErrorBoundary>
					<Suspense fallback={<LoadingMindMap />}>
						<Paper
							elevation={0}
							sx={{
								flexGrow: 1,
								borderRadius: 2,
								overflow: 'hidden',
								border: '1px solid',
								borderColor: 'divider',
								position: 'relative',
								height: '100%',
							}}>
							<ReactFlowProvider>
								<EnhancedBrainstormFlow
									initialNodes={initialNodes}
									initialEdges={initialEdges}
									onSave={handleSave}
								/>
							</ReactFlowProvider>
						</Paper>
					</Suspense>
				</BrainstormErrorBoundary>
			</Box>
		</ContentLayout>
	)
}

export default BrainstormPage
