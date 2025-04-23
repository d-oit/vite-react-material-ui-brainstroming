import type { BoxProps } from '@mui/material'
import { Box } from '@mui/material'
import { motion, AnimatePresence } from 'framer-motion'
import React from 'react'

// Animation variants
const fadeVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
	exit: { opacity: 0 },
}

const slideUpVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: -20 },
}

const slideDownVariants = {
	hidden: { opacity: 0, y: -20 },
	visible: { opacity: 1, y: 0 },
	exit: { opacity: 0, y: 20 },
}

const slideLeftVariants = {
	hidden: { opacity: 0, x: 20 },
	visible: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: -20 },
}

const slideRightVariants = {
	hidden: { opacity: 0, x: -20 },
	visible: { opacity: 1, x: 0 },
	exit: { opacity: 0, x: 20 },
}

const scaleVariants = {
	hidden: { opacity: 0, scale: 0.8 },
	visible: { opacity: 1, scale: 1 },
	exit: { opacity: 0, scale: 0.8 },
}

// Animation types
export type AnimationType = 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'scale' | 'none'

// Get animation variant based on type
const getVariant = (type: AnimationType) => {
	switch (type) {
	case 'fade':
		return fadeVariants
	case 'slideUp':
		return slideUpVariants
	case 'slideDown':
		return slideDownVariants
	case 'slideLeft':
		return slideLeftVariants
	case 'slideRight':
		return slideRightVariants
	case 'scale':
		return scaleVariants
	case 'none':
	default:
		return {}
	}
}

interface AnimatedTransitionProps extends BoxProps {
	children: React.ReactNode
	type?: AnimationType
	duration?: number
	delay?: number
	isVisible?: boolean
	layoutId?: string
	onAnimationComplete?: () => void
}

/**
 * AnimatedTransition component for smooth animations and transitions
 */
const AnimatedTransition: React.FC<AnimatedTransitionProps> = ({
	children,
	type = 'fade',
	duration = 0.3,
	delay = 0,
	isVisible = true,
	layoutId,
	onAnimationComplete,
	...boxProps
}) => {
	const variants = getVariant(type)

	if (type === 'none') {
		return <Box {...boxProps}>{children}</Box>
	}

	return (
		<AnimatePresence mode="wait">
			{isVisible && (
				<Box
					component={motion.div}
					initial="hidden"
					animate="visible"
					exit="exit"
					variants={variants}
					transition={{ duration, delay }}
					layoutId={layoutId}
					onAnimationComplete={onAnimationComplete}
					{...boxProps}>
					{children}
				</Box>
			)}
		</AnimatePresence>
	)
}

export default AnimatedTransition
