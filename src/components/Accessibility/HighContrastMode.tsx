import { GlobalStyles } from '@mui/material'
import React from 'react'

import { useSettings } from '../../contexts/SettingsContext'

/**
 * High contrast mode styles
 * These styles override the default theme to provide higher contrast
 * for users with visual impairments.
 */
const highContrastStyles = {
	// Increase contrast for text
	'body, h1, h2, h3, h4, h5, h6, p, span, div, button, a': {
		color: '#ffffff !important',
	},
	// Increase contrast for backgrounds
	'body, .MuiPaper-root, .MuiAppBar-root, .MuiDrawer-paper, .MuiCard-root': {
		backgroundColor: '#000000 !important',
	},
	// Add borders to improve element distinction
	'.MuiPaper-root, .MuiCard-root, .MuiButton-root, .MuiTextField-root, .MuiSelect-root, .MuiMenuItem-root': {
		border: '1px solid #ffffff !important',
	},
	// Increase contrast for buttons
	'.MuiButton-contained': {
		backgroundColor: '#ffffff !important',
		color: '#000000 !important',
	},
	'.MuiButton-outlined, .MuiButton-text': {
		borderColor: '#ffffff !important',
		color: '#ffffff !important',
	},
	// Increase contrast for form elements
	'.MuiInputBase-root, .MuiOutlinedInput-root, .MuiFilledInput-root, .MuiInput-root': {
		borderColor: '#ffffff !important',
		color: '#ffffff !important',
	},
	'.MuiInputLabel-root, .MuiFormLabel-root': {
		color: '#ffffff !important',
	},
	// Increase contrast for icons
	'.MuiSvgIcon-root': {
		color: '#ffffff !important',
	},
	// Increase contrast for focus states
	'*:focus': {
		outline: '3px solid #ffff00 !important',
		outlineOffset: '2px !important',
	},
	// Increase contrast for links
	'a, .MuiLink-root': {
		color: '#00ffff !important',
		textDecoration: 'underline !important',
	},
	// Increase contrast for disabled elements
	'.Mui-disabled': {
		color: '#888888 !important',
		borderColor: '#888888 !important',
	},
	// Increase contrast for dividers
	'.MuiDivider-root': {
		backgroundColor: '#ffffff !important',
	},
	// Increase contrast for checkboxes and radio buttons
	'.MuiCheckbox-root.Mui-checked, .MuiRadio-root.Mui-checked': {
		color: '#00ffff !important',
	},
	// Increase contrast for switches
	'.MuiSwitch-switchBase.Mui-checked': {
		color: '#00ffff !important',
	},
	'.MuiSwitch-track': {
		backgroundColor: '#ffffff !important',
	},
	// Increase contrast for tooltips
	'.MuiTooltip-tooltip': {
		backgroundColor: '#ffffff !important',
		color: '#000000 !important',
		border: '1px solid #000000 !important',
	},
	// Increase contrast for tables
	'.MuiTableCell-root': {
		borderColor: '#ffffff !important',
	},
	'.MuiTableRow-root:nth-of-type(odd)': {
		backgroundColor: '#222222 !important',
	},
	// Increase contrast for alerts
	'.MuiAlert-root': {
		border: '2px solid #ffffff !important',
	},
	// Increase contrast for flow nodes
	'.react-flow__node': {
		border: '2px solid #ffffff !important',
		backgroundColor: '#000000 !important',
		color: '#ffffff !important',
	},
	// Increase contrast for flow edges
	'.react-flow__edge-path': {
		stroke: '#ffffff !important',
		strokeWidth: '3px !important',
	},
	// Increase contrast for flow handles
	'.react-flow__handle': {
		backgroundColor: '#ffffff !important',
		border: '2px solid #000000 !important',
	},
}

interface HighContrastModeProps {
	children?: React.ReactNode
}

/**
 * A component that applies high contrast styles to the application
 * when enabled in the accessibility preferences.
 */
export const HighContrastMode: React.FC<HighContrastModeProps> = ({ children }) => {
	const { accessibilityPreferences } = useSettings()
	const highContrast = accessibilityPreferences?.highContrast === true

	return (
		<>
			{highContrast === true && <GlobalStyles styles={highContrastStyles} />}
			{children}
		</>
	)
}

export default HighContrastMode
