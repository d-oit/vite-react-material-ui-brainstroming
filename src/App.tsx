import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useNavigate } from 'react-router-dom';
import {
  ThemeProvider,
  CssBaseline,
  createTheme,
  PaletteMode,
  Box,
  Typography,
  Button,
  Container,
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
  Settings as SettingsIcon,
  History as HistoryIcon,
  Chat as ChatIcon
} from '@mui/icons-material';
import { useI18n } from './contexts/I18nContext';
import { SettingsProvider } from './contexts/SettingsContext';
import { SimpleBrainstormPage } from './pages/SimpleBrainstormPage';
import { SettingsPage } from './pages/SettingsPage';

// PWA registration
// import { registerSW } from 'virtual:pwa-register';

const HomePage = () => {
  const { t } = useI18n();
  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h2" component="h1" gutterBottom>
          {t('app.title')}
        </Typography>
        <Typography variant="h5" component="p" color="text.secondary" gutterBottom>
          {t('app.tagline')}
        </Typography>
        <Typography variant="body1" paragraph>
          Welcome to the d.o.it.brainstorming app!
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button
            variant="contained"
            color="primary"
            size="large"
            component={Link}
            to="/brainstorm"
            startIcon={<DashboardIcon />}
          >
            Start Brainstorming
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

const AppWithTheme = () => {
  const [mode, setMode] = useState<PaletteMode>('light');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { t } = useI18n();

  const toggleThemeMode = () => {
    setMode(prevMode => prevMode === 'light' ? 'dark' : 'light');
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const theme = createTheme({
    palette: {
      mode,
      primary: {
        main: '#2196f3',
      },
      secondary: {
        main: '#ff9800',
      },
    },
  });

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
          <AppBar position="static">
            <Toolbar>
              <IconButton
                size="large"
                edge="start"
                color="inherit"
                aria-label="menu"
                sx={{ mr: 2 }}
                onClick={toggleDrawer}
              >
                <MenuIcon />
              </IconButton>
              <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                {t('app.title')}
              </Typography>
              <IconButton color="inherit" onClick={toggleThemeMode}>
                {mode === 'dark' ? <LightIcon /> : <DarkIcon />}
              </IconButton>
            </Toolbar>
          </AppBar>

          <Drawer
            anchor="left"
            open={drawerOpen}
            onClose={toggleDrawer}
          >
            <Box
              sx={{ width: 250 }}
              role="presentation"
              onClick={toggleDrawer}
            >
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/">
                    <ListItemIcon>
                      <HomeIcon />
                    </ListItemIcon>
                    <ListItemText primary="Home" />
                  </ListItemButton>
                </ListItem>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/brainstorm">
                    <ListItemIcon>
                      <BrainstormIcon />
                    </ListItemIcon>
                    <ListItemText primary="Brainstorm" />
                  </ListItemButton>
                </ListItem>
              </List>
              <Divider />
              <List>
                <ListItem disablePadding>
                  <ListItemButton component={Link} to="/settings">
                    <ListItemIcon>
                      <SettingsIcon />
                    </ListItemIcon>
                    <ListItemText primary="Settings" />
                  </ListItemButton>
                </ListItem>
              </List>
            </Box>
          </Drawer>

          <Box sx={{ flexGrow: 1, p: 2 }}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/brainstorm" element={<SimpleBrainstormPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Box>
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
