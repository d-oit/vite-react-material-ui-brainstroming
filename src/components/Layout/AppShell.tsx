import { ReactNode, useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
import {
  Menu as MenuIcon,
  Brightness4 as DarkIcon,
  Brightness7 as LightIcon,
  BubbleChart as BrainstormIcon,
  Home as HomeIcon,
  Settings as SettingsIcon,
  Add as AddIcon,
  History as HistoryIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';

interface AppShellProps {
  children: ReactNode;
  title?: string;
  loading?: boolean;
  error?: string | null;
  onThemeToggle: () => void;
  isDarkMode: boolean;
  onCreateNew?: () => void;
}

export const AppShell = ({
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
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [errorOpen, setErrorOpen] = useState(!!error);
  
  // Update error state when prop changes
  useEffect(() => {
    setErrorOpen(!!error);
  }, [error]);
  
  const toggleDrawer = (open: boolean) => () => {
    setDrawerOpen(open);
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
      active: location.pathname === '/' 
    },
    { 
      text: t('nav.brainstorm'), 
      icon: <BrainstormIcon />, 
      path: '/brainstorm',
      active: location.pathname === '/brainstorm' 
    },
    { 
      text: t('nav.settings'), 
      icon: <SettingsIcon />, 
      path: '/settings',
      active: location.pathname === '/settings' 
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
        {isMobile && (
          <IconButton onClick={toggleDrawer(false)} edge="end">
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      
      <List sx={{ flexGrow: 1, pt: 0 }}>
        {navigationItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
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
          v{import.meta.env.VITE_APP_VERSION || '1.0.0'}
        </Typography>
        <IconButton onClick={onThemeToggle} size="small">
          {isDarkMode ? <LightIcon /> : <DarkIcon />}
        </IconButton>
      </Box>
    </Box>
  );
  
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppBar 
        position="fixed" 
        elevation={1}
        sx={{
          zIndex: theme.zIndex.drawer + 1,
          backgroundColor: theme.palette.mode === 'dark' 
            ? theme.palette.background.default 
            : theme.palette.primary.main,
          backdropFilter: 'blur(8px)',
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
            onClick={toggleDrawer(true)}
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
            }}
          >
            {title || t('app.title')}
          </Typography>
          
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
          onClose={toggleDrawer(false)}
          onOpen={toggleDrawer(true)}
          disableBackdropTransition={!isTablet}
          disableDiscovery={isTablet}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
            },
          }}
        >
          {drawerContent}
        </SwipeableDrawer>
      ) : (
        <Drawer
          variant="persistent"
          anchor="left"
          open={drawerOpen}
          sx={{
            width: drawerOpen ? 280 : 0,
            flexShrink: 0,
            '& .MuiDrawer-paper': {
              width: 280,
              boxSizing: 'border-box',
              top: 64, // AppBar height
              height: 'calc(100% - 64px)',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}
      
      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          mt: '64px', // AppBar height
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          ...(drawerOpen && !isMobile && {
            marginLeft: '280px',
            transition: theme.transitions.create('margin', {
              easing: theme.transitions.easing.easeOut,
              duration: theme.transitions.duration.enteringScreen,
            }),
          }),
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          height: 'calc(100vh - 64px)', // Full height minus AppBar
          overflow: 'hidden',
        }}
      >
        {children}
        
        {/* Floating action button for creating new items */}
        {onCreateNew && (
          <Fab
            color="primary"
            aria-label="add"
            sx={{
              position: 'fixed',
              bottom: 16,
              right: 16,
              zIndex: 1000,
            }}
            onClick={onCreateNew}
          >
            <AddIcon />
          </Fab>
        )}
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
