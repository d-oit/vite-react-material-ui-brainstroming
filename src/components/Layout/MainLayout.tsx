import { Box, Toolbar, useMediaQuery, useTheme, CssBaseline } from '@mui/material'
import type { ReactNode } from 'react'
import { useState } from 'react'

import { AppBar } from './AppBar'
import { Drawer } from './Drawer'
import { MobileBottomNav } from './MobileBottomNav'

interface MainLayoutProps {
	children: ReactNode
	title?: string
}

export const MainLayout = ({ children, title = 'd.o.it.brainstorming' }: MainLayoutProps) => {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const [drawerOpen, setDrawerOpen] = useState(!isMobile)

	const handleDrawerToggle = () => {
		setDrawerOpen((prev) => !prev)
	}

	const drawerWidth = 240

	return (
		<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
			<CssBaseline />

			<AppBar title={title} onMenuClick={handleDrawerToggle} />

			<Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} width={drawerWidth} />

			<Box
				component="main"
				sx={{
					flexGrow: 1,
					p: 3,
					width: '100%', // Always take full width since drawer overlays content
					transition: theme.transitions.create(['margin', 'width'], {
						easing: theme.transitions.easing.sharp,
						duration: theme.transitions.duration.leavingScreen,
					}),
					pb: isMobile ? 7 : 3, // Add padding at the bottom for mobile navigation
					mt: '64px', // Match AppBar height
					height: 'calc(100vh - 64px)', // Full height minus AppBar
					overflow: 'auto', // Enable scrolling for content
					position: 'relative', // For proper z-index stacking
					zIndex: 1, // Lower than AppBar and Drawer
				}}>
				{children}
			</Box>

			{isMobile && <MobileBottomNav onMenuClick={handleDrawerToggle} />}
		</Box>
	)
}
