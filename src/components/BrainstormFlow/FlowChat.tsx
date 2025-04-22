import {
	Close as CloseIcon,
	Chat as ChatIcon,
	ChevronLeft as ChevronLeftIcon,
	ChevronRight as ChevronRightIcon,
	Fullscreen as FullscreenIcon,
	FullscreenExit as FullscreenExitIcon,
} from '@mui/icons-material'
import { Box, IconButton, Paper, Tooltip, Fab, Zoom, useTheme, alpha } from '@mui/material'
import { memo, useCallback, useState, useEffect } from 'react'

import type { NodeData } from '../../types'
import { MemoizedChatPanel } from '../Chat/ChatPanel'

interface FlowChatProps {
	onClose: () => void
	onAddNodes: (nodes: NodeData[]) => void
	initialContext?: {
		nodeCount: number
		edgeCount: number
	}
}

const FlowChat = memo(({ onClose, onAddNodes, initialContext }: FlowChatProps) => {
	const handleSuggestionSelect = useCallback(
		(nodeDatas: NodeData[]) => {
			onAddNodes(nodeDatas)
		},
		[onAddNodes],
	)

	const theme = useTheme()
	const [isCollapsed, setIsCollapsed] = useState(false)
	const [isFullscreen, setIsFullscreen] = useState(false)
	const [isVisible, setIsVisible] = useState(true)

	// Handle escape key to exit fullscreen
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'Escape' && isFullscreen) {
				setIsFullscreen(false)
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [isFullscreen])

	// Handle toggle collapse
	const handleToggleCollapse = () => {
		setIsCollapsed(!isCollapsed)
	}

	// Handle toggle fullscreen
	const handleToggleFullscreen = () => {
		setIsFullscreen(!isFullscreen)
	}

	// Handle close (with animation)
	const handleClose = () => {
		setIsVisible(false)
		// Wait for animation to complete before actually closing
		setTimeout(() => {
			onClose()
		}, 300)
	}

	if (!isVisible) {
		return null
	}

	return (
		<>
			{/* Chat toggle button (only shown when chat is collapsed) */}
			<Zoom in={isCollapsed}>
				<Fab
					color="primary"
					size="small"
					onClick={handleToggleCollapse}
					sx={{
						position: 'absolute',
						top: 16,
						right: 16,
						zIndex: 20,
						boxShadow: theme.shadows[4],
					}}
					aria-label="Open chat">
					<ChatIcon />
				</Fab>
			</Zoom>

			{/* Main chat panel */}
			<Paper
				elevation={3}
				sx={{
					position: 'absolute',
					top: isFullscreen ? 0 : 16,
					right: isFullscreen ? 0 : isCollapsed ? -400 : 16,
					width: isFullscreen ? '100%' : { xs: isCollapsed ? 0 : '90vw', sm: isCollapsed ? 0 : 350 },
					height: isFullscreen ? '100%' : { xs: '70vh', sm: 500 },
					maxWidth: isFullscreen ? '100%' : { xs: 'calc(100vw - 32px)', sm: 350 },
					maxHeight: isFullscreen ? '100%' : { xs: 'calc(100vh - 120px)', sm: 500 },
					display: 'flex',
					flexDirection: 'column',
					overflow: 'hidden',
					zIndex: isFullscreen ? 1300 : 20, // Higher z-index when fullscreen
					borderRadius: isFullscreen ? 0 : 2,
					boxShadow: (theme) => (isFullscreen ? 'none' : theme.shadows[8]),
					transition: 'all 0.3s ease',
					opacity: isCollapsed ? 0 : 1,
					visibility: isCollapsed ? 'hidden' : 'visible',
				}}>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
						p: 1,
						borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
						backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.95),
						backdropFilter: 'blur(8px)',
					}}>
					<Box sx={{ pl: 1, fontWeight: 'medium', fontSize: '0.9rem' }}>Brainstorming Assistant</Box>
					<Box sx={{ display: 'flex', gap: 0.5 }}>
						<Tooltip title={isCollapsed ? 'Expand' : 'Collapse'}>
							<IconButton
								onClick={handleToggleCollapse}
								size="small"
								aria-label={isCollapsed ? 'Expand chat' : 'Collapse chat'}>
								{isCollapsed ? (
									<ChevronRightIcon fontSize="small" />
								) : (
									<ChevronLeftIcon fontSize="small" />
								)}
							</IconButton>
						</Tooltip>
						<Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
							<IconButton
								onClick={handleToggleFullscreen}
								size="small"
								aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}>
								{isFullscreen ? (
									<FullscreenExitIcon fontSize="small" />
								) : (
									<FullscreenIcon fontSize="small" />
								)}
							</IconButton>
						</Tooltip>
						<Tooltip title="Close">
							<IconButton onClick={handleClose} size="small" aria-label="Close chat">
								<CloseIcon fontSize="small" />
							</IconButton>
						</Tooltip>
					</Box>
				</Box>
				<MemoizedChatPanel onAddNodes={handleSuggestionSelect} projectContext={initialContext} />
			</Paper>
		</>
	)
})

FlowChat.displayName = 'FlowChat'

export default FlowChat
