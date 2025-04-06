import {
  Drawer as MuiDrawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Box,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  BubbleChart as BrainstormIcon,
  History as HistoryIcon,
  Storage as ProjectsIcon,
  Settings as SettingsIcon,
  Chat as ChatIcon,
  CloudUpload as BackupIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  width?: number;
}

export const Drawer = ({ open, onClose, width = 240 }: DrawerProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/' },
    { text: 'Projects', icon: <ProjectsIcon />, path: '/projects' },
    { text: 'Brainstorm', icon: <BrainstormIcon />, path: '/brainstorm' },
    { text: 'History', icon: <HistoryIcon />, path: '/history' },
    { text: 'Chat Assistant', icon: <ChatIcon />, path: '/chat' },
  ];

  const bottomMenuItems = [
    { text: 'Backup', icon: <BackupIcon />, path: '/backup' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (isMobile) {
      onClose();
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <MuiDrawer
      variant={isMobile ? 'temporary' : 'persistent'}
      open={open}
      onClose={onClose}
      sx={{
        width: open ? width : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width,
          boxSizing: 'border-box',
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <Typography variant="h6" component="div">
          d.o.it.brainstorming
        </Typography>
        <Typography variant="caption" color="text.secondary">
          v{import.meta.env.VITE_PROJECT_VERSION || '0.1.0'}
        </Typography>
      </Box>

      <Divider />

      <List>
        {menuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Box sx={{ flexGrow: 1 }} />

      <Divider />

      <List>
        {bottomMenuItems.map(item => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              selected={isActive(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </MuiDrawer>
  );
};
