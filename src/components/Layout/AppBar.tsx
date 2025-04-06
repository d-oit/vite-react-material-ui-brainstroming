import { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  Typography,
  IconButton,
  Menu,
  MenuItem,
  Box,
  useMediaQuery,
  useTheme,
  Button,
  Tooltip,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
  AccountCircle,
  Settings as SettingsIcon,
  Help as HelpIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ThemeMode } from '@/types';

interface AppBarProps {
  title: string;
  onMenuClick: () => void;
}

export const AppBar = ({ title, onMenuClick }: AppBarProps) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { themeMode, toggleThemeMode } = useThemeMode();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <MuiAppBar position="fixed">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          aria-label="menu"
          onClick={onMenuClick}
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Tooltip title={themeMode === ThemeMode.DARK ? 'Light Mode' : 'Dark Mode'}>
            <IconButton color="inherit" onClick={toggleThemeMode}>
              {themeMode === ThemeMode.DARK ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {!isMobile && (
            <Button color="inherit" startIcon={<HelpIcon />}>
              Help
            </Button>
          )}

          <IconButton
            color="inherit"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
          >
            <AccountCircle />
          </IconButton>

          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleClose}>
              <SettingsIcon fontSize="small" sx={{ mr: 1 }} />
              Settings
            </MenuItem>
            {isMobile && (
              <MenuItem onClick={handleClose}>
                <HelpIcon fontSize="small" sx={{ mr: 1 }} />
                Help
              </MenuItem>
            )}
          </Menu>
        </Box>
      </Toolbar>
    </MuiAppBar>
  );
};
