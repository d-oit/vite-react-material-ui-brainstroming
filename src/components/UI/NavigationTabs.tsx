import { Tab, Tabs, Box, Paper, useTheme } from '@mui/material'
import React from 'react'

interface NavigationTab {
	label: string
	icon?: React.ReactNode
	id: string
}

interface NavigationTabsProps {
	tabs: NavigationTab[]
	activeTab: number
	onChange: (newValue: number) => void
	ariaLabel?: string
	centered?: boolean
	variant?: 'standard' | 'fullWidth' | 'scrollable'
}

/**
 * A component for navigation tabs with improved styling and clarity
 */
const NavigationTabs: React.FC<NavigationTabsProps> = ({
	tabs,
	activeTab,
	onChange,
	ariaLabel = 'navigation tabs',
	centered = true,
	variant = 'standard',
}) => {
	const theme = useTheme()

	const handleChange = (_event: React.SyntheticEvent, newValue: number) => {
		onChange(newValue)
	}

	return (
		<Paper
			elevation={2}
			sx={{
				borderRadius: 0,
				borderBottom: `1px solid ${theme.palette.divider}`,
				position: 'sticky',
				top: 0,
				zIndex: 10,
				backgroundColor: theme.palette.background.paper,
			}}>
			<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
				<Tabs
					value={activeTab}
					onChange={handleChange}
					aria-label={ariaLabel}
					centered={centered}
					variant={variant}
					sx={{
						'& .MuiTab-root': {
							minHeight: 48,
							fontWeight: 500,
							transition: 'all 0.2s ease',
							'&:hover': {
								backgroundColor: theme.palette.action.hover,
							},
						},
						'& .Mui-selected': {
							fontWeight: 600,
							color: theme.palette.primary.main,
						},
						'& .MuiTabs-indicator': {
							height: 3,
							borderTopLeftRadius: 3,
							borderTopRightRadius: 3,
						},
					}}>
					{tabs.map((tab, index) => (
						<Tab
							key={tab.id}
							label={tab.label}
							icon={tab.icon}
							iconPosition="start"
							id={`nav-tab-${tab.id}`}
							aria-controls={`nav-tabpanel-${tab.id}`}
						/>
					))}
				</Tabs>
			</Box>
		</Paper>
	)
}

export default NavigationTabs
