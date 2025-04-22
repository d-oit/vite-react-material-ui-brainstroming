import React, { useEffect } from 'react'

import { useSettings } from '../../contexts/SettingsContext'

import ColorBlindFilter from './ColorBlindFilter'
import HighContrastMode from './HighContrastMode'
import LargeTextMode from './LargeTextMode'
import ReducedMotionMode from './ReducedMotionMode'

interface AccessibilityProviderProps {
	children: React.ReactNode
}

/**
 * A provider component that combines all accessibility features.
 * This component should wrap the application to provide accessibility features.
 */
export const AccessibilityProvider: React.FC<AccessibilityProviderProps> = ({ children }) => {
	const { accessibilityPreferences } = useSettings()

	// Add focus visible styles if enabled
	// Use destructured import instead of React.useEffect
	useEffect(() => {
		const keyboardFocusVisible = accessibilityPreferences?.keyboardFocusVisible !== false // Default to true

		if (keyboardFocusVisible === true) {
			document.body.classList.add('keyboard-focus-visible')
		} else {
			document.body.classList.remove('keyboard-focus-visible')
		}

		return () => {
			document.body.classList.remove('keyboard-focus-visible')
		}
	}, [accessibilityPreferences?.keyboardFocusVisible])

	// Add touch optimized styles if enabled
	// Use destructured import instead of React.useEffect
	useEffect(() => {
		const touchOptimized = accessibilityPreferences?.touchOptimized === true

		if (touchOptimized === true) {
			document.body.classList.add('touch-optimized')
		} else {
			document.body.classList.remove('touch-optimized')
		}

		return () => {
			document.body.classList.remove('touch-optimized')
		}
	}, [accessibilityPreferences?.touchOptimized])

	return (
		<HighContrastMode>
			<ColorBlindFilter>
				<ReducedMotionMode>
					<LargeTextMode>{children}</LargeTextMode>
				</ReducedMotionMode>
			</ColorBlindFilter>
		</HighContrastMode>
	)
}

export default AccessibilityProvider
