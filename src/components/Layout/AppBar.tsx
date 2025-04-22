import {
	Menu as MenuIcon,
	Brightness4 as DarkModeIcon,
	Brightness7 as LightModeIcon,
	Settings as SettingsIcon,
	Help as HelpIcon,
	Notifications as NotificationsIcon,
	Search as SearchIcon,
} from '@mui/icons-material'
import {
	AppBar as MuiAppBar,
	Toolbar,
	Typography,
	IconButton,
	Menu,
	MenuItem,
	Box,
	useMediaQuery,
	useTheme,
	Button,
	Tooltip,
	Badge,
	Avatar,
	InputBase,
	alpha,
	Divider,
} from '@mui/material'
import { useState } from 'react'

import { useThemeMode } from '../../hooks/useThemeMode'
import { ThemeMode } from '../../types'

interface AppBarProps {
	title: string
	onMenuClick: () => void
}

export const AppBar = ({ title, onMenuClick }: AppBarProps) => {
	const theme = useTheme()
	const isMobile = useMediaQuery(theme.breakpoints.down('sm'))
	const { themeMode, toggleThemeMode } = useThemeMode()
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)

	const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget)
	}

	const handleClose = () => {
		setAnchorEl(null)
	}

	const [searchOpen, setSearchOpen] = useState(false)
	const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null)
	const [notificationCount, setNotificationCount] = useState(3) // Example notification count

	const handleNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
		setNotificationsAnchorEl(event.currentTarget)
		// Reset notification count when opening menu
		setNotificationCount(0)
	}

	const handleNotificationsClose = () => {
		setNotificationsAnchorEl(null)
	}

	const toggleSearch = () => {
		setSearchOpen(!searchOpen)
	}

	return (
		<MuiAppBar
			position="fixed"
			elevation={4}
			sx={{
				borderBottom: `1px solid ${theme.palette.divider}`,
				backgroundColor: theme.palette.background.paper,
				color: theme.palette.text.primary,
				transition: theme.transitions.create(['width', 'margin'], {
					easing: theme.transitions.easing.sharp,
					duration: theme.transitions.duration.leavingScreen,
				}),
				zIndex: theme.zIndex.appBar, // Ensure AppBar is always on top
				height: '64px', // Fixed height for consistency
			}}>
			<Toolbar>
				<IconButton
					edge="start"
					color="inherit"
					aria-label="menu"
					onClick={onMenuClick}
					sx={{
						mr: 2,
						transition: theme.transitions.create('transform', {
							duration: '200ms',
							easing: 'ease-in-out',
						}),
						'&:hover': {
							transform: 'scale(1.05)',
						},
					}}>
					<MenuIcon />
				</IconButton>

				<Typography
					variant="h6"
					component="div"
					sx={{
						flexGrow: 1,
						fontWeight: 500,
						letterSpacing: '0.5px',
					}}>
					{title}
				</Typography>

				{/* Search bar - shown when search is open */}
				{searchOpen && (
					<Box
						sx={{
							position: 'relative',
							borderRadius: theme.shape.borderRadius,
							backgroundColor: alpha(theme.palette.primary.main, 0.08),
							'&:hover': {
								backgroundColor: alpha(theme.palette.primary.main, 0.12),
							},
							marginRight: theme.spacing(2),
							marginLeft: 0,
							width: '100%',
							[theme.breakpoints.up('sm')]: {
								marginLeft: theme.spacing(3),
								width: 'auto',
							},
							display: { xs: 'none', sm: 'block' },
						}}>
						<Box
							sx={{
								padding: theme.spacing(0, 2),
								height: '100%',
								position: 'absolute',
								pointerEvents: 'none',
								display: 'flex',
								alignItems: 'center',
								justifyContent: 'center',
							}}>
							<SearchIcon />
						</Box>
						<InputBase
							placeholder="Search…"
							sx={{
								color: 'inherit',
								padding: theme.spacing(1, 1, 1, 0),
								paddingLeft: `calc(1em + ${theme.spacing(4)})`,
								transition: theme.transitions.create('width'),
								width: '100%',
								[theme.breakpoints.up('md')]: {
									width: '20ch',
								},
							}}
							inputProps={{ 'aria-label': 'search' }}
							// We want the search to be focused when it appears
							// eslint-disable-next-line jsx-a11y/no-autofocus
							autoFocus
						/>
					</Box>
				)}

				<Box sx={{ display: 'flex', alignItems: 'center' }}>
					{/* Search button - shown when search is closed */}
					{!searchOpen && (
						<Tooltip title="Search">
							<IconButton color="inherit" onClick={toggleSearch} sx={{ ml: 1 }}>
								<SearchIcon />
							</IconButton>
						</Tooltip>
					)}

					<Tooltip title={themeMode === ThemeMode.DARK ? 'Light Mode' : 'Dark Mode'}>
						<IconButton
							color="inherit"
							onClick={toggleThemeMode}
							sx={{
								ml: 1,
								transition: theme.transitions.create(['transform', 'color'], {
									duration: '200ms',
									easing: 'ease-in-out',
								}),
								'&:hover': {
									transform: 'scale(1.05)',
									color: theme.palette.primary.main,
								},
							}}>
							{themeMode === ThemeMode.DARK ? <LightModeIcon /> : <DarkModeIcon />}
						</IconButton>
					</Tooltip>

					{/* Notifications */}
					<Tooltip title="Notifications">
						<IconButton color="inherit" onClick={handleNotificationsMenu} sx={{ ml: 1 }}>
							<Badge badgeContent={notificationCount} color="error">
								<NotificationsIcon />
							</Badge>
						</IconButton>
					</Tooltip>

					{/* Help button */}
					{!isMobile && (
						<Button
							color="inherit"
							startIcon={<HelpIcon />}
							sx={{
								ml: 1,
								borderRadius: '20px',
								px: 2,
								'&:hover': {
									backgroundColor: alpha(theme.palette.primary.main, 0.08),
								},
							}}>
							Help
						</Button>
					)}

					{/* User menu */}
					<Tooltip title="Account settings">
						<IconButton
							color="inherit"
							aria-label="account of current user"
							aria-controls="menu-appbar"
							aria-haspopup="true"
							onClick={handleMenu}
							sx={{
								ml: 1,
								'&:hover': {
									transform: 'scale(1.05)',
								},
							}}>
							<Avatar
								sx={{
									width: 32,
									height: 32,
									bgcolor: theme.palette.primary.main,
									fontSize: '0.875rem',
								}}>
								DO
							</Avatar>
						</IconButton>
					</Tooltip>

					{/* User menu dropdown */}
					<Menu
						id="menu-appbar"
						anchorEl={anchorEl}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						keepMounted
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={Boolean(anchorEl)}
						onClose={handleClose}
						slotProps={{
							paper: {
								elevation: 2,
								sx: {
									minWidth: 180,
									borderRadius: 2,
									mt: 1,
									'& .MuiMenuItem-root': {
										px: 2,
										py: 1,
										borderRadius: 1,
										mx: 0.5,
										my: 0.25,
										'&:hover': {
											backgroundColor: alpha(theme.palette.primary.main, 0.08),
										},
									},
								},
							},
						}}>
						<Box sx={{ px: 2, py: 1.5 }}>
							<Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
								Dominik Oswald
							</Typography>
							<Typography variant="body2" color="text.secondary">
								admin@example.com
							</Typography>
						</Box>

						<Divider sx={{ my: 1 }} />

						<MenuItem onClick={handleClose}>
							<SettingsIcon fontSize="small" sx={{ mr: 2 }} />
							Settings
						</MenuItem>

						{isMobile && (
							<MenuItem onClick={handleClose}>
								<HelpIcon fontSize="small" sx={{ mr: 2 }} />
								Help
							</MenuItem>
						)}

						<Divider sx={{ my: 1 }} />

						<MenuItem onClick={handleClose}>Sign out</MenuItem>
					</Menu>

					{/* Notifications menu */}
					<Menu
						id="notifications-menu"
						anchorEl={notificationsAnchorEl}
						anchorOrigin={{
							vertical: 'bottom',
							horizontal: 'right',
						}}
						keepMounted
						transformOrigin={{
							vertical: 'top',
							horizontal: 'right',
						}}
						open={Boolean(notificationsAnchorEl)}
						onClose={handleNotificationsClose}
						slotProps={{
							paper: {
								elevation: 2,
								sx: {
									width: 320,
									maxHeight: 400,
									borderRadius: 2,
									mt: 1,
								},
							},
						}}>
						<Box sx={{ p: 2 }}>
							<Typography variant="subtitle1" fontWeight="bold">
								Notifications
							</Typography>
						</Box>
						<Divider />
						<MenuItem onClick={handleNotificationsClose}>
							<Box sx={{ py: 1 }}>
								<Typography variant="body2" fontWeight="medium">
									Project &quot;Marketing Campaign&quot; was updated
								</Typography>
								<Typography variant="caption" color="text.secondary">
									5 minutes ago
								</Typography>
							</Box>
						</MenuItem>
						<MenuItem onClick={handleNotificationsClose}>
							<Box sx={{ py: 1 }}>
								<Typography variant="body2" fontWeight="medium">
									New comment on &quot;Product Launch&quot;
								</Typography>
								<Typography variant="caption" color="text.secondary">
									1 hour ago
								</Typography>
							</Box>
						</MenuItem>
						<Divider />
						<Box sx={{ p: 1.5, textAlign: 'center' }}>
							<Button size="small" color="primary">
								View all notifications
							</Button>
						</Box>
					</Menu>
				</Box>
			</Toolbar>
		</MuiAppBar>
	)
}
