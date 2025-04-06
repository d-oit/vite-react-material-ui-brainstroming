import {
  Dashboard as DashboardIcon,
  BubbleChart as BrainstormIcon,
  Storage as ProjectsIcon,
  Chat as ChatIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

export const MobileBottomNav = ({ onMenuClick }: MobileBottomNavProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (_event: React.SyntheticEvent, newValue: string) => {
    if (newValue === 'menu') {
      onMenuClick();
    } else {
      navigate(newValue);
    }
  };

  return (
    <Paper
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: theme => theme.zIndex.appBar,
      }}
      elevation={3}
    >
      <BottomNavigation showLabels value={location.pathname} onChange={handleChange}>
        <BottomNavigationAction label="Home" icon={<DashboardIcon />} value="/" />
        <BottomNavigationAction label="Projects" icon={<ProjectsIcon />} value="/projects" />
        <BottomNavigationAction label="Brainstorm" icon={<BrainstormIcon />} value="/brainstorm" />
        <BottomNavigationAction label="Chat" icon={<ChatIcon />} value="/chat" />
        <BottomNavigationAction label="Menu" icon={<MenuIcon />} value="menu" />
      </BottomNavigation>
    </Paper>
  );
};
