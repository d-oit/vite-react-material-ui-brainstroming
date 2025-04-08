import type { PaletteMode, ThemeOptions } from '@mui/material';
import { ThemeProvider, CssBaseline, createTheme, Button, Snackbar, Alert } from '@mui/material';
import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Icons are imported but not used in this file
// They might be used in child components or for future implementation
import { registerSW } from 'virtual:pwa-register';

// Import all styles
import './styles';

import AccessibilityMenu from './components/Accessibility/AccessibilityMenu';
import AccessibilityOverlay from './components/Accessibility/AccessibilityOverlay';
import AccessibilityProvider from './components/Accessibility/AccessibilityProvider';
import ScreenReaderAnnouncer from './components/Accessibility/ScreenReaderAnnouncer';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import RTLProvider from './components/I18n/RTLProvider';
import _OfflineFallback from './components/OfflineIndicator/OfflineFallback';
import _OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import withOfflineFallback from './components/OfflineIndicator/withOfflineFallback';
import PerformanceProfiler from './components/PerformanceProfiler';
import CSPMeta from './components/Security/CSPMeta';
import LoadingFallback from './components/UI/LoadingFallback';
import { ActionFeedbackProvider } from './contexts/ActionFeedbackContext';
import { I18nProvider, useI18n } from './contexts/I18nContext';
import { SettingsProvider } from './contexts/SettingsContext';
import indexedDBService from './services/IndexedDBService';
import loggerService from './services/LoggerService';
import offlineService from './services/OfflineService';
import performanceMonitoring, { PerformanceCategory } from './utils/performanceMonitoring';

// Lazy load pages and heavy components for better performance
const HomePage = lazy(() => import('./pages/HomePage'));
const ProjectDashboard = lazy(() => import('./pages/ProjectDashboard'));
const ProjectDetailPage = lazy(() => import('./pages/ProjectDetailPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Lazy load Material UI components that are heavy
// These components are used dynamically based on user interactions
// These components are lazy loaded but not directly used in this file
// They are kept for potential future use
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _Dialog = lazy(() => import('@mui/material/Dialog'));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _Drawer = lazy(() => import('@mui/material/Drawer'));
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _AppBar = lazy(() => import('@mui/material/AppBar'));

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
  };
};

const AppWithTheme = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSWFunction, setUpdateSWFunction] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);
  const { t: _t } = useI18n(); // t is not used in this file but kept for future use

  // Update the theme only when the mode changes
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const toggleThemeMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // This function is defined but not currently used - kept for future implementation
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const __toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUpdateApp = () => {
    if (updateSWFunction) {
      void updateSWFunction(true);
    }
  };

  // Initialize services
  useEffect(() => {
    // Initialize performance monitoring
    performanceMonitoring.setEnabled(true);
    const initMetricId = performanceMonitoring.startMeasure(
      'App.initialization',
      PerformanceCategory.RENDERING
    );
    // Initialize IndexedDB
    indexedDBService
      .init()
      .then(initialized => {
        if (!initialized) {
          console.warn('IndexedDB initialization failed, some features may not work properly');
          loggerService.warn(
            'IndexedDB initialization failed, some features may not work properly'
          );
        } else {
          console.log('IndexedDB initialized successfully in App');
          loggerService.info('IndexedDB initialized successfully in App');
        }
      })
      .catch(error => {
        console.error('Failed to initialize IndexedDB:', error);
        loggerService.error('Failed to initialize IndexedDB', error);
      });

    // Start offline sync service
    offlineService.configure({
      syncInterval: 60000, // 1 minute
      maxRetries: 5,
      autoSync: true,
    });
    offlineService.startAutoSync();

    // Register service worker for PWA
    try {
      // Register service worker and store the function
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _updateSW = registerSW({
        onNeedRefresh(updateFn) {
          // Store the update function for later use
          setUpdateSWFunction(() => updateFn);
          setUpdateAvailable(true);

          // Log the update availability
          loggerService.info('New app version available');
        },
        onOfflineReady() {
          loggerService.info('App is ready for offline use');
        },
        onRegisterError(error) {
          loggerService.error('Service worker registration failed', error);
        },
      });
    } catch (error) {
      console.error('Failed to register service worker:', error);
      loggerService.error(
        'Failed to register service worker',
        error instanceof Error ? error : new Error(String(error))
      );
    }

    // End the initialization metric
    performanceMonitoring.endMeasure(initMetricId);

    // Clean up on unmount
    return () => {
      offlineService.stopAutoSync();
    };
  }, []);

  return (
    <>
      <CSPMeta />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ActionFeedbackProvider>
          <ErrorBoundary>
            <BrowserRouter
              future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true,
              }}
            >
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route
                    path="/"
                    element={
                      <HomePage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />
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
                    path="/settings"
                    element={
                      <SettingsPage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />
                    }
                  />
                  {/* Removed standalone brainstorming route - now using quick project creation */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>

              {/* Offline indicator removed as per UI update plan */}

              {/* Accessibility components */}
              <AccessibilityMenu position="bottom-left" />
              <AccessibilityOverlay />

              {/* Performance profiler */}
              <PerformanceProfiler />

              {/* Screen reader announcer */}
              <ScreenReaderAnnouncer messages={[]} politeness="polite" />

              {/* Update notification */}
              <Snackbar
                open={updateAvailable}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
              >
                <Alert
                  severity="info"
                  action={
                    <Button color="inherit" size="small" onClick={handleUpdateApp}>
                      Update
                    </Button>
                  }
                >
                  A new version is available!
                </Alert>
              </Snackbar>
            </BrowserRouter>
          </ErrorBoundary>
        </ActionFeedbackProvider>
      </ThemeProvider>
    </>
  );
};

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
  );
};

export default App;
