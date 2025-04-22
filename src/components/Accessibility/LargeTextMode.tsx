import { GlobalStyles } from '@mui/material'
import React from 'react'

import { useSettings } from '../../contexts/SettingsContext'

/**
 * Large text mode styles
 * These styles increase the font size of text elements to improve readability
 * for users with visual impairments.
 */
const largeTextStyles = {
	// Increase base font size
	'html, body': {
		fontSize: '18px !important',
	},
	// Increase font size for headings
	'h1, .MuiTypography-h1': {
		fontSize: '2.5rem !important',
	},
	'h2, .MuiTypography-h2': {
		fontSize: '2.2rem !important',
	},
	'h3, .MuiTypography-h3': {
		fontSize: '2rem !important',
	},
	'h4, .MuiTypography-h4': {
		fontSize: '1.8rem !important',
	},
	'h5, .MuiTypography-h5': {
		fontSize: '1.6rem !important',
	},
	'h6, .MuiTypography-h6': {
		fontSize: '1.4rem !important',
	},
	// Increase font size for body text
	'p, span, div, .MuiTypography-body1': {
		fontSize: '1.2rem !important',
	},
	'.MuiTypography-body2': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for buttons
	'.MuiButton-root': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for form elements
	'.MuiInputBase-root, .MuiOutlinedInput-root, .MuiFilledInput-root, .MuiInput-root': {
		fontSize: '1.1rem !important',
	},
	'.MuiInputLabel-root, .MuiFormLabel-root': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for list items
	'.MuiListItem-root, .MuiMenuItem-root': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for table cells
	'.MuiTableCell-root': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for tooltips
	'.MuiTooltip-tooltip': {
		fontSize: '1rem !important',
	},
	// Increase font size for chips
	'.MuiChip-label': {
		fontSize: '1rem !important',
	},
	// Increase font size for tabs
	'.MuiTab-root': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for alerts
	'.MuiAlert-message': {
		fontSize: '1.1rem !important',
	},
	// Increase font size for badges
	'.MuiBadge-badge': {
		fontSize: '0.9rem !important',
	},
	// Increase font size for flow nodes
	'.react-flow__node': {
		fontSize: '1.1rem !important',
	},
	// Increase line height for better readability
	'p, span, div, .MuiTypography-body1, .MuiTypography-body2': {
		lineHeight: '1.6 !important',
	},
	// Increase letter spacing for better readability
	body: {
		letterSpacing: '0.01em !important',
	},
}

interface LargeTextModeProps {
	children?: React.ReactNode
}

/**
 * A component that applies large text styles to the application
 * when enabled in the accessibility preferences.
 */
export const LargeTextMode: React.FC<LargeTextModeProps> = ({ children }) => {
	const { accessibilityPreferences } = useSettings()
	const largeText = accessibilityPreferences?.largeText === true
	const textSpacing = accessibilityPreferences?.textSpacing ?? 1

	// Create dynamic styles based on text spacing
	const dynamicStyles = {
		'p, span, div, .MuiTypography-body1, .MuiTypography-body2': {
			lineHeight: `${1.6 * textSpacing} !important`,
			letterSpacing: `${0.01 * textSpacing}em !important`,
			wordSpacing: `${0.16 * textSpacing}em !important`,
		},
	}

	// Combine static and dynamic styles
	const combinedStyles = largeText === true ? { ...largeTextStyles, ...dynamicStyles } : dynamicStyles

	return (
		<>
			{(largeText === true || textSpacing !== 1) && <GlobalStyles styles={combinedStyles} />}
			{children}
		</>
	)
}

export default LargeTextMode
