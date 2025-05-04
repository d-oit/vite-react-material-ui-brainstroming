import type { PaletteMode, ThemeOptions } from '@mui/material'
import { Alert, Button, CssBaseline, createTheme, Snackbar, ThemeProvider } from '@mui/material'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Navigate, Route, Routes, BrowserRouter } from 'react-router-dom'
import { registerSW } from 'virtual:pwa-register'

// Import all styles
import './styles'

import _AccessibilityMenu from './components/Accessibility/AccessibilityMenu'
import _AccessibilityOverlay from './components/Accessibility/AccessibilityOverlay'
import AccessibilityProvider from './components/Accessibility/AccessibilityProvider'
import ScreenReaderAnnouncer from './components/Accessibility/ScreenReaderAnnouncer'
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary'
import RTLProvider from './components/I18n/RTLProvider'
import _OfflineFallback from './components/OfflineIndicator/OfflineFallback'
import _OfflineIndicator from './components/OfflineIndicator/OfflineIndicator'
import withOfflineFallback from './components/OfflineIndicator/withOfflineFallback'
import _PerformanceProfiler from './components/PerformanceProfiler'
import CSPMeta from './components/Security/CSPMeta'
import LoadingFallback from './components/UI/LoadingFallback'
import { ActionFeedbackProvider } from './contexts/ActionFeedbackContext'
import { I18nProvider, useI18n } from './contexts/I18nContext'
import { SettingsProvider } from './contexts/SettingsContext'
import { ToastProvider } from './contexts/ToastContext'
import BrainstormDemoPage from './pages/BrainstormDemoPage'
import indexedDBService from './services/IndexedDBService'
import loggerService from './services/LoggerService'
import offlineService from './services/OfflineService'
import performanceMonitoring, { PerformanceCategory } from './utils/performanceMonitoring'

// Lazy load pages and heavy components for better performance
const HomePage = lazy(() => import('./pages/HomePage'))
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'))
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const PerformancePage = lazy(() => import('./pages/PerformancePage'))

// Lazy load Material UI components that are heavy
// These components are used dynamically based on user interactions
// These components are lazy loaded but not directly used in this file
// They are kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _Dialog = lazy(() => import('@mui/material/Dialog'))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _Drawer = lazy(() => import('@mui/material/Drawer'))
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _AppBar = lazy(() => import('@mui/material/AppBar'))

// Define theme settings
const getDesignTokens = (mode: PaletteMode): ThemeOptions => {
	return {
		palette: {
			mode,
			...(mode === 'light'
				? {
					// Light mode
					primary: {
						main: '#2196f3',
					},
					secondary: {
						main: '#f50057',
					},
					background: {
						default: '#f5f5f5',
						paper: '#ffffff',
					},
				}
				: {
					// Dark mode
					primary: {
						main: '#90caf9',
					},
					secondary: {
						main: '#f48fb1',
					},
					background: {
						default: '#121212',
						paper: '#1e1e1e',
					},
				}),
		},
		typography: {
			fontFamily: [
				'-apple-system',
				'BlinkMacSystemFont',
				'"Segoe UI"',
				'Roboto',
				'"Helvetica Neue"',
				'Arial',
				'sans-serif',
				'"Apple Color Emoji"',
				'"Segoe UI Emoji"',
				'"Segoe UI Symbol"',
			].join(','),
		},
		shape: {
			borderRadius: 8,
		},
		components: {
			MuiButton: {
				styleOverrides: {
					root: {
						textTransform: 'none',
					},
				},
			},
			MuiAppBar: {
				styleOverrides: {
					root: {
						boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
					},
				},
			},
			MuiDrawer: {
				styleOverrides: {
					paper: {
						backgroundColor: mode === 'light' ? '#ffffff' : '#1e1e1e',
					},
				},
			},
		},
	}
}

const AppWithTheme = () => {
	const [mode, setMode] = useState<PaletteMode>('light')
	const [drawerOpen, setDrawerOpen] = useState(false)
	const [updateAvailable, setUpdateAvailable] = useState(false)
	type UpdateFunction = ((reload?: boolean) => Promise<void>) | null
	const [updateSWFunction, setUpdateSWFunction] = useState<UpdateFunction>(null)
	const { t: _t } = useI18n() // t is not used in this file but kept for future use

	// Update the theme only when the mode changes
	const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode])

	const toggleThemeMode = () => {
		setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'))
	}

	// This function is defined but not currently used - kept for future implementation
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const __toggleDrawer = () => {
		setDrawerOpen(!drawerOpen)
	}

	const handleUpdateApp = () => {
		try {
			if (typeof updateSWFunction === 'function') {
				try {
					void updateSWFunction(true)
				} catch (error) {
					console.error('Failed to update application:', error)
					void loggerService.error(
						'Failed to update application',
						error instanceof Error ? error : new Error(String(error)),
					)
				}
			}
		} catch (error) {
			console.error('Error updating application:', error)
		}
	}

	// Initialize services
	useEffect(() => {
		const initializeServices = async () => {
			try {
				// Start performance monitoring with a stable ID
				performanceMonitoring.setEnabled(true)
				const initMetricId = performanceMonitoring.startMeasure(
					'App.initialization',
					PerformanceCategory.RENDERING,
				)

				// Initialize critical services in parallel
				let loggerInitialized = false
				let dbInitialized = false

				try {
					// Initialize services with proper error handling
					const results = await Promise.all([
						// Initialize logger service
						loggerService.initialize().catch((error) => {
							console.error('Logger initialization failed:', error)
							return false
						}),

						// Initialize IndexedDB
						indexedDBService.init().catch((error) => {
							console.error('IndexedDB initialization failed:', error)
							return false
						}),
					])

					// Extract results
					;[loggerInitialized, dbInitialized] = results
				} catch (error) {
					console.error('Error during service initialization:', error)
					// Continue with default values (false) for both services
				}

				// Log initialization results
				if (!loggerInitialized) {
					console.warn('Logger service failed to initialize')
				}

				if (!dbInitialized) {
					console.warn('IndexedDB initialization failed, some features may not work properly')
					if (loggerInitialized) {
						void loggerService.warn('IndexedDB initialization failed')
					}
				}

				// Use requestIdleCallback or setTimeout with 0 to defer non-critical initialization
				// This allows the main UI to render first
				const initNonCriticalServices = () => {
					// Configure offline service
					try {
						offlineService.configure({
							syncInterval: 60000,
							maxRetries: 5,
							autoSync: true,
						})
						offlineService.startAutoSync()
					} catch (error) {
						console.error('Failed to initialize offline service:', error)
						void loggerService.error(
							'Failed to initialize offline service',
							error instanceof Error ? error : new Error(String(error)),
						)
					}

					// Register service worker
					try {
						registerSW({
							onNeedRefresh(updateFn) {
								setUpdateSWFunction(() => updateFn)
								setUpdateAvailable(true)
								void loggerService.info('New app version available')
							},
							onOfflineReady() {
								void loggerService.info('App is ready for offline use')
							},
							onRegisterError(error) {
								console.error('Service worker registration failed:', error)
								void loggerService.error('Service worker registration failed', error)
							},
						})
					} catch (error) {
						console.error('Failed to register service worker:', error)
						void loggerService.error(
							'Failed to register service worker',
							error instanceof Error ? error : new Error(String(error)),
						)
					}
				}

				// Use requestIdleCallback if available, otherwise use setTimeout with 0
				if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
					window.requestIdleCallback?.(initNonCriticalServices)
				} else {
					setTimeout(initNonCriticalServices, 0)
				}

				performanceMonitoring.endMeasure(initMetricId)
			} catch (error) {
				console.error('Failed to initialize services:', error)
				// Don't try to log here as logger might not be initialized
			}
		}

		void initializeServices()
		// Clean up on unmount
		return () => {
			// Only try to stop auto sync if the service is initialized
			try {
				if (typeof offlineService?.stopAutoSync === 'function') {
					// stopAutoSync returns void, not a Promise
					offlineService.stopAutoSync()
				}
			} catch (error) {
				console.error('Error during cleanup:', error)
			}
		}
	}, [])

	return (
		<>
			<CSPMeta />
			<ThemeProvider theme={theme}>
				<CssBaseline />
				<ToastProvider>
					<ActionFeedbackProvider>
						<ErrorBoundary>
							<BrowserRouter
								future={{
									v7_startTransition: true,
									v7_relativeSplatPath: true,
								}}>
								<Suspense fallback={<LoadingFallback />}>
									<Routes>
										<Route
											path="/"
											element={
												<HomePage
													onThemeToggle={toggleThemeMode}
													isDarkMode={mode === 'dark'}
												/>
											}
										/>
										<Route
											path="/projects"
											element={
												<ProjectDashboard
													onThemeToggle={toggleThemeMode}
													isDarkMode={mode === 'dark'}
												/>
											}
										/>
										<Route
											path="/projects/:projectId/*"
											element={withOfflineFallback(ProjectDetailPage)({
												onThemeToggle: toggleThemeMode,
												isDarkMode: mode === 'dark',
											})}
										/>
										<Route
											path="/projects/:projectId/brainstorm"
											element={withOfflineFallback(ProjectDetailPage)({
												onThemeToggle: toggleThemeMode,
												isDarkMode: mode === 'dark',
											})}
										/>
										<Route
											path="/projects/:projectId/settings"
											element={withOfflineFallback(ProjectDetailPage)({
												onThemeToggle: toggleThemeMode,
												isDarkMode: mode === 'dark',
											})}
										/>
										<Route
											path="/settings"
											element={
												<SettingsPage
													onThemeToggle={toggleThemeMode}
													isDarkMode={mode === 'dark'}
												/>
											}
										/>
										<Route
											path="/performance"
											element={
												<PerformancePage
													onThemeToggle={toggleThemeMode}
													isDarkMode={mode === 'dark'}
												/>
											}
										/>
										{/* Demo route for our redesigned UI */}
										<Route path="/brainstorm-demo" element={<BrainstormDemoPage />} />
										<Route path="*" element={<Navigate to="/" replace />} />
									</Routes>
								</Suspense>

								{/* Offline indicator removed as per UI update plan */}

								{/* Screen reader announcer - always visible */}
								<ScreenReaderAnnouncer messages={[]} politeness="polite" />

								{/* Update notification */}
								<Snackbar
									open={updateAvailable}
									anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
									<Alert
										severity="info"
										action={
											<Button color="inherit" size="small" onClick={handleUpdateApp}>
												Update
											</Button>
										}>
										A new version is available!
									</Alert>
								</Snackbar>
							</BrowserRouter>
						</ErrorBoundary>
					</ActionFeedbackProvider>
				</ToastProvider>
			</ThemeProvider>
		</>
	)
}

const App = () => {
	return (
		<SettingsProvider>
			<I18nProvider initialLocale="en">
				<RTLProvider>
					<AccessibilityProvider>
						<AppWithTheme />
					</AccessibilityProvider>
				</RTLProvider>
			</I18nProvider>
		</SettingsProvider>
	)
}

export default App
