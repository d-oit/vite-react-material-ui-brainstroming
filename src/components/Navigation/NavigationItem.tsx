import { ExpandLess as ExpandLessIcon, ExpandMore as ExpandMoreIcon } from '@mui/icons-material'
import {
	alpha,
	Box,
	Chip,
	Collapse,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	useTheme,
} from '@mui/material'
import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

import { useNavigation } from '../../contexts/NavigationContext'
import type { NavigationItem as NavigationItemType } from '../../types/navigation'

import SidebarAccessibilityItem from './SidebarAccessibilityItem'
import SidebarPerformanceItem from './SidebarPerformanceItem'

interface NavigationItemProps {
	item: NavigationItemType
	level: number
}

const NavigationItem = ({ item, level }: NavigationItemProps) => {
	const theme = useTheme()
	const navigate = useNavigate()
	const { activeItemId, expandedSections, toggleSection } = useNavigation()
	const isActive = activeItemId === item.id
	const isExpanded = expandedSections.includes(item.id)
	const hasChildren = item.children && item.children.length > 0
	const isSection = item.type === 'section'
	const isLink = item.type === 'link'
	const isAction = item.type === 'action'
	const isCustom = item.type === 'custom'

	// Handle item click
	const handleClick = useCallback(() => {
		if (isSection && hasChildren) {
			toggleSection(item.id)
		} else if (isLink && item.path) {
			navigate(item.path)
		} else if (isAction) {
			// Handle action items (custom logic would go here)
			console.log(`Action clicked: ${item.id}`)
		}
		// Custom components handle their own click events
	}, [isSection, hasChildren, isLink, isAction, item.id, item.path, toggleSection, navigate])

	// Calculate indentation based on level
	const indentation = level * 16

	return (
		<>
			<ListItem
				disablePadding
				sx={{
					display: 'block',
					mb: 0.5,
				}}>
				<ListItemButton
					onClick={handleClick}
					selected={isActive}
					sx={{
						minHeight: 48,
						px: 2.5,
						py: 1,
						ml: `${indentation}px`,
						borderRadius: '8px',
						transition: theme.transitions.create(['background-color', 'color', 'transform'], {
							duration: '200ms',
							easing: 'ease-in-out',
						}),
						'&:hover': {
							backgroundColor: alpha(theme.palette.primary.main, 0.08),
							transform: 'scale(1.01)',
							'& .MuiListItemIcon-root': {
								transform: 'scale(1.05)',
							},
							'& .MuiListItemText-primary': {
								color:
									theme.palette.mode === 'dark'
										? alpha(theme.palette.primary.light, 0.9)
										: alpha(theme.palette.primary.dark, 0.9),
							},
						},
						'&.Mui-selected': {
							backgroundColor: alpha(theme.palette.primary.main, 0.12),
							borderLeft: `3px solid ${theme.palette.primary.main}`,
							'&:hover': {
								backgroundColor: alpha(theme.palette.primary.main, 0.16),
							},
							'& .MuiListItemText-primary': {
								fontWeight: 600,
								color: theme.palette.primary.main,
							},
						},
						'&:focus-visible': {
							outline: `2px solid ${theme.palette.primary.main}`,
							outlineOffset: '2px',
						},
					}}
					aria-expanded={hasChildren ? isExpanded : undefined}>
					<ListItemIcon
						sx={{
							minWidth: 40,
							color: isActive ? theme.palette.primary.main : 'inherit',
							transition: theme.transitions.create('transform', {
								duration: '200ms',
							}),
						}}>
						{item.icon}
					</ListItemIcon>
					<ListItemText
						primary={item.label}
						primaryTypographyProps={{
							fontSize: theme.typography.body2.fontSize,
							fontWeight: isActive ? 600 : 400,
							overflow: 'hidden',
							textOverflow: 'ellipsis',
							whiteSpace: 'nowrap',
						}}
					/>

					{/* Badge */}
					{item.badge !== undefined && item.badge > 0 && (
						<Chip
							label={item.badge}
							size="small"
							color="primary"
							sx={{
								height: 20,
								fontSize: '0.75rem',
								ml: 1,
							}}
						/>
					)}

					{/* Expand/collapse icon for sections with children */}
					{isSection && hasChildren && (
						<Box component="span" sx={{ ml: 1 }}>
							{isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
						</Box>
					)}
				</ListItemButton>
			</ListItem>

			{/* Render children if expanded */}
			{hasChildren && (
				<Collapse in={isExpanded} timeout="auto" unmountOnExit>
					<List component="div" disablePadding>
						{item.children?.map((child) => (
							<NavigationItem key={child.id} item={child} level={level + 1} />
						))}
					</List>
				</Collapse>
			)}
			{/* Render custom components */}
			{isCustom && item.component === 'accessibility' && <SidebarAccessibilityItem />}
			{isCustom && item.component === 'performance' && <SidebarPerformanceItem />}
		</>
	)
}

export default NavigationItem
