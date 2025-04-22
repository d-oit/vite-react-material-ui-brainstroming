import { Box, Fade, useTheme } from '@mui/material'
import React, { useEffect, useState } from 'react'

import type { Node, Edge } from '../../types'

interface LinkedNodesHighlightProps {
	nodes: Node[]
	edges: Edge[]
	linkedNodeIds: string[]
	nodePositions: Record<string, { x: number; y: number; width: number; height: number }>
	onHighlightComplete?: () => void
	duration?: number
}

export const LinkedNodesHighlight: React.FC<LinkedNodesHighlightProps> = ({
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	nodes,
	edges,
	linkedNodeIds,
	nodePositions,
	onHighlightComplete,
	duration = 3000,
}) => {
	const theme = useTheme()
	const [show, setShow] = useState(true)

	// Calculate connected edges between linked nodes
	const linkedEdges = edges.filter(
		(edge) => linkedNodeIds.includes(edge.source) && linkedNodeIds.includes(edge.target),
	)

	// Auto-hide the highlight after duration
	useEffect(() => {
		if (linkedNodeIds.length > 0) {
			setShow(true)
			const timer = setTimeout(() => {
				setShow(false)
				if (onHighlightComplete) {
					onHighlightComplete()
				}
			}, duration)
			return () => clearTimeout(timer)
		}
		return undefined
	}, [linkedNodeIds, duration, onHighlightComplete])

	if (linkedNodeIds.length === 0) return null

	return (
		<Fade in={show} timeout={500}>
			<Box
				sx={{
					position: 'absolute',
					top: 0,
					left: 0,
					width: '100%',
					height: '100%',
					pointerEvents: 'none',
					zIndex: 5,
				}}>
				{/* Highlight for nodes */}
				{linkedNodeIds.map((nodeId) => {
					const position = nodePositions[nodeId]
					if (position === undefined || position === null) return null

					return (
						<Box
							key={`highlight-node-${nodeId}`}
							sx={{
								position: 'absolute',
								top: position.y - 10,
								left: position.x - 10,
								width: position.width + 20,
								height: position.height + 20,
								border: `3px solid ${theme.palette.primary.main}`,
								borderRadius: 2,
								boxShadow: `0 0 15px ${theme.palette.primary.main}`,
								animation: 'pulse 2s infinite',
								'@keyframes pulse': {
									'0%': {
										boxShadow: `0 0 0 0 ${theme.palette.primary.main}80`,
									},
									'70%': {
										boxShadow: `0 0 0 10px ${theme.palette.primary.main}00`,
									},
									'100%': {
										boxShadow: `0 0 0 0 ${theme.palette.primary.main}00`,
									},
								},
							}}
						/>
					)
				})}

				{/* Highlight for edges */}
				{linkedEdges.map((edge) => {
					const sourcePos = nodePositions[edge.source]
					const targetPos = nodePositions[edge.target]
					if (
						sourcePos === undefined ||
						sourcePos === null ||
						targetPos === undefined ||
						targetPos === null
					) {
						return null
					}

					// Calculate edge path (simplified straight line)
					const sourceX = sourcePos.x + sourcePos.width / 2
					const sourceY = sourcePos.y + sourcePos.height
					const targetX = targetPos.x + targetPos.width / 2
					const targetY = targetPos.y

					return (
						<svg
							key={`highlight-edge-${edge.id}`}
							style={{
								position: 'absolute',
								top: 0,
								left: 0,
								width: '100%',
								height: '100%',
								pointerEvents: 'none',
							}}>
							<defs>
								<filter id={`glow-${edge.id}`} x="-50%" y="-50%" width="200%" height="200%">
									<feGaussianBlur stdDeviation="5" result="blur" />
									<feComposite in="SourceGraphic" in2="blur" operator="over" />
								</filter>
							</defs>
							<path
								d={`M ${sourceX} ${sourceY} C ${sourceX} ${sourceY + 50}, ${targetX} ${
									targetY - 50
								}, ${targetX} ${targetY}`}
								stroke={theme.palette.primary.main}
								strokeWidth={4}
								fill="none"
								strokeDasharray="5,5"
								filter={`url(#glow-${edge.id})`}
							/>
						</svg>
					)
				})}
			</Box>
		</Fade>
	)
}

export default LinkedNodesHighlight
