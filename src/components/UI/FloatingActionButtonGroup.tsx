import { Box, Fab, Tooltip, useTheme } from '@mui/material'
import React from 'react'

export interface FloatingActionButton {
	icon: React.ReactNode
	label: string
	onClick: () => void
	color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'default'
	disabled?: boolean
	size?: 'small' | 'medium' | 'large'
}

interface FloatingActionButtonGroupProps {
	buttons: FloatingActionButton[]
	position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
	direction?: 'horizontal' | 'vertical'
	spacing?: number
}

/**
 * A component that displays a group of floating action buttons in a consistent way
 * This helps prevent overlapping UI elements and provides a unified look
 */
const FloatingActionButtonGroup: React.FC<FloatingActionButtonGroupProps> = ({
	buttons,
	position = 'bottom-right',
	direction = 'vertical',
	spacing = 2,
}) => {
	const theme = useTheme()

	// Calculate position styles
	const getPositionStyles = () => {
		switch (position) {
		case 'top-left':
			return { top: 80, left: 16 }
		case 'top-right':
			return { top: 80, right: 16 }
		case 'bottom-left':
			return { bottom: 100, left: 16 }
		case 'bottom-right':
		default:
			return { bottom: 100, right: 16 }
		}
	}

	return (
		<Box
			sx={{
				position: 'fixed',
				...getPositionStyles(),
				display: 'flex',
				flexDirection: direction === 'vertical' ? 'column' : 'row',
				gap: spacing,
				zIndex: 900, // High z-index to ensure visibility
			}}>
			{buttons.map((button, index) => (
				<Tooltip key={index} title={button.label} placement={position.includes('right') ? 'left' : 'right'}>
					<Fab
						color={button.color || 'primary'}
						size={button.size || 'medium'}
						onClick={button.onClick}
						disabled={button.disabled}
						aria-label={button.label}
						sx={{
							boxShadow: theme.shadows[3],
							'&:hover': {
								boxShadow: theme.shadows[5],
							},
							transition: 'all 0.3s ease',
						}}>
						{button.icon}
					</Fab>
				</Tooltip>
			))}
		</Box>
	)
}

export default FloatingActionButtonGroup
