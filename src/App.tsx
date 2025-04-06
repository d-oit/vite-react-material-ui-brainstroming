import type { PaletteMode, ThemeOptions } from '@mui/material';
import { ThemeProvider, CssBaseline, createTheme, Button, Snackbar, Alert } from '@mui/material';
import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
// Icons are imported but not used in this file
// They might be used in child components or for future implementation
import { registerSW } from 'virtual:pwa-register';

import AccessibilityMenu from './components/Accessibility/AccessibilityMenu';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import OfflineFallback from './components/OfflineIndicator/OfflineFallback';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import withOfflineFallback from './components/OfflineIndicator/withOfflineFallback';
import CSPMeta from './components/Security/CSPMeta';
import { useI18n } from './contexts/I18nContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { HomePage } from './pages/HomePage';
import ProjectDashboard from './pages/ProjectDashboard';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import indexedDBService from './services/IndexedDBService';
import loggerService from './services/LoggerService';
import offlineService from './services/OfflineService';

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
  const _toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleUpdateApp = () => {
    if (updateSWFunction) {
      updateSWFunction(true);
    }
  };

  // Initialize services
  useEffect(() => {
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const updateSW = registerSW({
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
        <ErrorBoundary>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route
                path="/"
                element={<HomePage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />}
              />
              <Route
                path="/projects"
                element={
                  <ProjectDashboard onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />
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

            {/* Offline indicator removed as per UI update plan */}

            {/* Accessibility menu */}
            <AccessibilityMenu position="bottom-left" />

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
      </ThemeProvider>
    </>
  );
};

const App = () => {
  return (
    <SettingsProvider>
      <AppWithTheme />
    </SettingsProvider>
  );
};

export default App;
