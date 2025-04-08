import {
  Menu as MenuIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  History as _HistoryIcon,
  Chat as _ChatIcon,
  Close as CloseIcon,
  FolderOpen as ProjectsIcon,
  BubbleChart as BrainstormIcon,
  BarChart as BarChartIcon,
} from '@mui/icons-material';
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useMediaQuery,
  useTheme,
  Fab,
  SwipeableDrawer,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';
import SkipLink from '../Accessibility/SkipLink';
import LanguageSelector from '../I18n/LanguageSelector';
import NetworkInfoDialog from '../OfflineIndicator/NetworkInfoDialog';
import NetworkStatusIcon from '../OfflineIndicator/NetworkStatusIcon';
import _OfflineIndicator from '../OfflineIndicator/OfflineIndicator';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  loading?: boolean;
  error?: string | null;
  onThemeToggle: () => void;
  isDarkMode: boolean;
  onCreateNew?: () => void;
}

const AppShell = ({
  children,
  title,
  loading = false,
  error = null,
  onThemeToggle,
  isDarkMode,
  onCreateNew,
}: AppShellProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings: _settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(!!error);
  const [networkInfoDialogOpen, setNetworkInfoDialogOpen] = useState(false);

  // Update error state when prop changes
  useEffect(() => {
    setErrorOpen(!!error);
  }, [error]);

  // Function to toggle drawer state
  const handleToggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      setDrawerOpen(false);
    }
  };

  const navigationItems = [
    {
      text: t('nav.home'),
      icon: <HomeIcon />,
      path: '/',
      active: location.pathname === '/',
    },
    {
      text: t('nav.projects'),
      icon: <ProjectsIcon />,
      path: '/projects',
      active: location.pathname === '/projects',
    },
    {
      text: t('nav.quickBrainstorm'),
      icon: <BrainstormIcon />,
      path: '#',
      onClick: () => {
        // This will be handled in the HomePage component
        navigate('/');
        // We'll trigger the quick brainstorm action from the home page
        const quickBrainstormButton = document.querySelector('[data-quick-brainstorm]');
        if (quickBrainstormButton) {
          (quickBrainstormButton as HTMLButtonElement).click();
        }
      },
      active: false,
    },
    {
      text: t('nav.settings'),
      icon: <SettingsIcon />,
      path: '/settings',
      active: location.pathname === '/settings',
    },
    {
      text: t('nav.performance') || 'Performance',
      icon: <BarChartIcon />,
      path: '/performance',
      active: location.pathname === '/performance',
    },
  ];

  const drawerContent = (
    <Box
      sx={{
        width: isMobile ? '80vw' : 280,
        maxWidth: 360,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
      role="presentation"
    >
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography variant="h6" component="div">
          {t('app.title')}
        </Typography>
        <IconButton onClick={handleToggleDrawer} edge="end">
          <CloseIcon />
        </IconButton>
      </Box>

      <List sx={{ flexGrow: 1, pt: 0 }}>
        {navigationItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => {
                if (item.onClick) item.onClick();
                else handleNavigation(item.path);
              }}
              selected={item.active}
              sx={{
                borderRadius: 1,
                mx: 1,
                my: 0.5,
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main + '20',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.main + '30',
                  },
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: item.active ? theme.palette.primary.main : 'inherit',
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          {t('app.copyright', { year: new Date().getFullYear() }) ||
            `© ${new Date().getFullYear()}`}
        </Typography>
        <IconButton onClick={onThemeToggle} size="small">
          {isDarkMode ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Skip link for keyboard users */}
      <SkipLink targetId="main-content" />

      <AppBar
        position="fixed"
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor:
            theme.palette.mode === 'dark'
              ? theme.palette.background.default
              : theme.palette.primary.main,
          backdropFilter: 'blur(8px)',
          height: 64, // Fixed height for consistency
          ...(theme.palette.mode === 'light' && {
            boxShadow: '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24)',
          }),
        }}
      >
        <Toolbar>
          <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            onClick={handleToggleDrawer}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {title || t('app.title')}
            {/* Version info moved to header for better visibility */}
            <Typography
              variant="caption"
              component="span"
              sx={{
                opacity: 0.7,
                display: { xs: 'none', sm: 'inline' },
                ml: 1,
              }}
            >
              v{import.meta.env.VITE_APP_VERSION ? import.meta.env.VITE_APP_VERSION : '1.0.0'}
            </Typography>
          </Typography>

          {/* Network status icon in header */}
          <NetworkStatusIcon onClick={() => setNetworkInfoDialogOpen(true)} />

          {/* Language selector */}
          <LanguageSelector variant="icon" size="small" />

          {!isMobile && (
            <IconButton color="inherit" onClick={onThemeToggle}>
              {isDarkMode ? <LightIcon /> : <DarkIcon />}
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Drawer - different for mobile vs desktop */}
      {isMobile ? (
        <SwipeableDrawer
          anchor="left"
          open={drawerOpen}
          onClose={handleToggleDrawer}
          onOpen={handleToggleDrawer}
          disableBackdropTransition={!isTablet}
          disableDiscovery={isTablet}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              top: 64, // Position below app bar
              height: 'calc(100% - 64px)', // Adjust height to account for app bar
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="temporary"
          anchor="left"
          open={drawerOpen}
          onClose={handleToggleDrawer}
          sx={{
            width: 280,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              top: 64, // Position below app bar
              height: 'calc(100% - 64px)', // Adjust height to account for app bar
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Main content */}
      <Box
        component="main"
        id="main-content"
        tabIndex={-1} // Makes it focusable for skip link
        aria-label="Main content"
        sx={{
          flexGrow: 1,
          p: 0,
          mt: '64px', // AppBar height
          // No margin transition needed for temporary drawer
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)', // Full height minus AppBar
          overflow: 'hidden',
          '&:focus': {
            outline: 'none', // Remove outline when focused via skip link
          },
        }}
      >
        {children}

        {/* Floating action buttons - grouped in a single container */}
        <Box
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            zIndex: 1000,
          }}
        >
          {onCreateNew && (
            <Fab color="primary" aria-label="add" onClick={onCreateNew}>
              <AddIcon />
            </Fab>
          )}
        </Box>

        {/* Network info dialog */}
        <NetworkInfoDialog
          open={networkInfoDialogOpen}
          onClose={() => setNetworkInfoDialogOpen(false)}
        />
      </Box>

      {/* Loading indicator */}
      <Backdrop
        sx={{
          color: '#fff',
          zIndex: theme.zIndex.drawer + 2,
          backdropFilter: 'blur(4px)',
        }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>

      {/* Error snackbar */}
      <Snackbar
        open={errorOpen}
        autoHideDuration={6000}
        onClose={() => setErrorOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setErrorOpen(false)}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {error}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AppShell;
