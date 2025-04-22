import { Accessibility as AccessibilityIcon } from '@mui/icons-material'
import { ListItem, ListItemButton, ListItemIcon, ListItemText } from '@mui/material'
import React, { useState } from 'react'

import AccessibilityMenu from '../Accessibility/AccessibilityMenu'
import AccessibilityOverlay from '../Accessibility/AccessibilityOverlay'

const SidebarAccessibilityItem: React.FC = () => {
	const [open, setOpen] = useState(false)

	const handleOpen = () => {
		setOpen(true)
	}

	const handleClose = () => {
		setOpen(false)
	}

	return (
		<>
			<ListItem disablePadding>
				<ListItemButton onClick={handleOpen}>
					<ListItemIcon>
						<AccessibilityIcon />
					</ListItemIcon>
					<ListItemText primary="Accessibility Options" />
				</ListItemButton>
			</ListItem>

			{/* Accessibility Menu Dialog */}
			{open && (
				<>
					<AccessibilityMenu position="center" onClose={handleClose} open={open} />
					<AccessibilityOverlay />
				</>
			)}
		</>
	)
}

export default SidebarAccessibilityItem
