import { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  createTheme,
  PaletteMode,
  Box,
  Typography,
  Button,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  BubbleChart as BrainstormIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { registerSW } from 'virtual:pwa-register';
import { useI18n } from './contexts/I18nContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { HomePage } from './pages/HomePage';
import { EnhancedBrainstormPage } from './pages/EnhancedBrainstormPage';
import { SettingsPage } from './pages/SettingsPage';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import OfflineIndicator from './components/OfflineIndicator/OfflineIndicator';
import AccessibilityMenu from './components/Accessibility/AccessibilityMenu';
import indexedDBService from './services/IndexedDBService';
import loggerService from './services/LoggerService';
import offlineService from './services/OfflineService';

// Define theme settings
const getDesignTokens = (mode: PaletteMode) => ({
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
          boxShadow:
            mode === 'light' ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)' : 'none',
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
});

const AppWithTheme = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSWFunction, setUpdateSWFunction] = useState<
    ((reload?: boolean) => Promise<void>) | null
  >(null);
  const { t } = useI18n();

  // Update the theme only when the mode changes
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const toggleThemeMode = () => {
    setMode(prevMode => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const toggleDrawer = () => {
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
    indexedDBService.init().catch(error => {
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
            <Route path="/brainstorm" element={<EnhancedBrainstormPage />} />
            <Route path="/brainstorm/:projectId" element={<EnhancedBrainstormPage />} />
            <Route
              path="/settings"
              element={
                <SettingsPage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>

          {/* Offline indicator */}
          <OfflineIndicator position="bottom-right" showSnackbar={true} />

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
