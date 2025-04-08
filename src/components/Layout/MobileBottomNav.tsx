import {
  Dashboard as DashboardIcon,
  BubbleChart as BrainstormIcon,
  Storage as ProjectsIcon,
  Menu as MenuIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper, Fab, Box, useTheme } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'menu') {
      onMenuClick();
    } else {
      navigate(newValue);
    }
  };

  const handleCreateNew = () => {
    navigate('/projects/new');
  };

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: theme.zIndex.appBar - 1, height: '64px' }}>
      {/* Floating action button for quick create */}
      <Fab
        color="primary"
        aria-label="create new"
        onClick={handleCreateNew}
        sx={{
          position: 'absolute',
          top: -28,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: theme.zIndex.appBar, // Same as AppBar to ensure it's above other elements
          boxShadow: theme.shadows[4],
          transition: theme.transitions.create(['transform', 'box-shadow'], {
            duration: '250ms',
          }),
          '&:hover': {
            transform: 'translateX(-50%) scale(1.05)',
            boxShadow: theme.shadows[6],
          },
        }}
      >
        <AddIcon />
      </Fab>

      <Paper
        sx={{
          width: '100%',
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          overflow: 'hidden',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
        }}
        elevation={3}
      >
        <BottomNavigation
          showLabels
          value={location.pathname}
          onChange={handleChange}
          sx={{
            height: 64,
            '& .MuiBottomNavigationAction-root': {
              minWidth: 'auto',
              padding: '6px 0',
              '&.Mui-selected': {
                color: theme.palette.primary.main,
              },
            },
            '& .MuiBottomNavigationAction-label': {
              fontSize: '0.625rem',
              '&.Mui-selected': {
                fontSize: '0.75rem',
              },
            },
          }}
        >
          <BottomNavigationAction
            label="Home"
            icon={<DashboardIcon />}
            value="/"
            sx={{
              transition: theme.transitions.create('transform', {
                duration: '200ms',
              }),
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          />
          <BottomNavigationAction
            label="Projects"
            icon={<ProjectsIcon />}
            value="/projects"
            sx={{
              transition: theme.transitions.create('transform', {
                duration: '200ms',
              }),
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          />
          {/* Empty space for FAB */}
          <BottomNavigationAction
            label=""
            icon={<Box sx={{ height: 24 }} />}
            disabled
            sx={{
              opacity: 0,
              cursor: 'default',
              pointerEvents: 'none',
            }}
          />
          <BottomNavigationAction
            label="Brainstorm"
            icon={<BrainstormIcon />}
            value="/brainstorm"
            sx={{
              transition: theme.transitions.create('transform', {
                duration: '200ms',
              }),
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          />
          <BottomNavigationAction
            label="Menu"
            icon={<MenuIcon />}
            value="menu"
            sx={{
              transition: theme.transitions.create('transform', {
                duration: '200ms',
              }),
              '&:active': {
                transform: 'scale(0.95)',
              },
            }}
          />
        </BottomNavigation>
      </Paper>
    </Box>
  );
};
