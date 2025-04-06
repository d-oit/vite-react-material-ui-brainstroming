import { useState, useMemo } from 'react';
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
  Divider
} from '@mui/material';
import {
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Dashboard as DashboardIcon,
  Menu as MenuIcon,
  BubbleChart as BrainstormIcon,
  Home as HomeIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import { useI18n } from './contexts/I18nContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { HomePage } from './pages/HomePage';
import { EnhancedBrainstormPage } from './pages/EnhancedBrainstormPage';
import { SettingsPage } from './pages/SettingsPage';

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
          boxShadow: mode === 'light'
            ? '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)'
            : 'none',
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
  const { t } = useI18n();

  // Update the theme only when the mode changes
  const theme = useMemo(() => createTheme(getDesignTokens(mode)), [mode]);

  const toggleThemeMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <Routes>
          <Route path="/" element={<HomePage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />} />
          <Route path="/brainstorm" element={<EnhancedBrainstormPage />} />
          <Route path="/brainstorm/:projectId" element={<EnhancedBrainstormPage />} />
          <Route path="/settings" element={<SettingsPage onThemeToggle={toggleThemeMode} isDarkMode={mode === 'dark'} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
};

const App = () => {
  // Register service worker for PWA
  // Commented out for now to avoid errors
  /*
  useEffect(() => {
    const updateSW = registerSW({
      onNeedRefresh() {
        if (confirm('New content available. Reload?')) {
          updateSW(true);
        }
      },
      onOfflineReady() {
        console.log('App is ready for offline use');
      },
    });
  }, []);
  */

  return (
    <SettingsProvider>
      <AppWithTheme />
    </SettingsProvider>
  );
};

export default App;
