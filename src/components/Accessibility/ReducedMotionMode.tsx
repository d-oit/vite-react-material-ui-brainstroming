import { GlobalStyles } from '@mui/material'
import React, { useState, useEffect } from 'react'

import { useSettings } from '../../contexts/SettingsContext'

/**
 * Reduced motion mode styles
 * These styles override animations and transitions to reduce motion
 * for users with vestibular disorders or motion sensitivity.
 */
const reducedMotionStyles = {
	// Disable all animations and transitions
	'*, *::before, *::after': {
		animationDuration: '0.001ms !important',
		animationDelay: '0.001ms !important',
		animationIterationCount: '1 !important',
		transitionDuration: '0.001ms !important',
		transitionDelay: '0.001ms !important',
		scrollBehavior: 'auto !important',
	},
	// Disable specific animations
	'.MuiFade-root, .MuiGrow-root, .MuiSlide-root, .MuiZoom-root': {
		transition: 'none !important',
	},
	// Disable hover effects that use transform
	'*:hover': {
		transform: 'none !important',
	},
	// Disable React Flow animations
	'.react-flow__node': {
		transition: 'none !important',
	},
	'.react-flow__edge': {
		transition: 'none !important',
	},
	'.react-flow__controls button': {
		transition: 'none !important',
	},
	// Disable progress animations
	'.MuiCircularProgress-root, .MuiLinearProgress-root': {
		animation: 'none !important',
	},
	// Disable ripple effect
	'.MuiTouchRipple-root': {
		display: 'none !important',
	},
	// Disable skeleton animations
	'.MuiSkeleton-root': {
		animation: 'none !important',
		backgroundImage: 'none !important',
		backgroundColor: '#e0e0e0 !important',
	},
	// Disable backdrop transitions
	'.MuiBackdrop-root': {
		transition: 'none !important',
	},
	// Disable drawer transitions
	'.MuiDrawer-root': {
		transition: 'none !important',
	},
	'.MuiDrawer-paper': {
		transition: 'none !important',
	},
	// Disable modal transitions
	'.MuiModal-root': {
		transition: 'none !important',
	},
	// Disable tooltip animations
	'.MuiTooltip-popper': {
		transition: 'none !important',
	},
	// Disable menu transitions
	'.MuiMenu-paper': {
		transition: 'none !important',
	},
	// Disable collapse transitions
	'.MuiCollapse-root': {
		transition: 'none !important',
	},
	// Disable tab transitions
	'.MuiTabs-indicator': {
		transition: 'none !important',
	},
}

interface ReducedMotionModeProps {
	children?: React.ReactNode
}

/**
 * A component that applies reduced motion styles to the application
 * when enabled in the accessibility preferences.
 */
export const ReducedMotionMode: React.FC<ReducedMotionModeProps> = ({ children }) => {
	const { accessibilityPreferences } = useSettings()
	const reducedMotion = accessibilityPreferences?.reducedMotion === true

	// Also check for the prefers-reduced-motion media query
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

	useEffect(() => {
		const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
		setPrefersReducedMotion(mediaQuery.matches)

		const handleChange = (e: MediaQueryListEvent) => {
			setPrefersReducedMotion(e.matches)
		}

		mediaQuery.addEventListener('change', handleChange)
		return () => {
			mediaQuery.removeEventListener('change', handleChange)
		}
	}, [])

	// Apply reduced motion if either the user has enabled it in preferences
	// or if the user has enabled it in their system settings
	const applyReducedMotion = reducedMotion === true || prefersReducedMotion === true

	return (
		<>
			{applyReducedMotion === true && <GlobalStyles styles={reducedMotionStyles} />}
			{children}
		</>
	)
}

export default ReducedMotionMode
