import {
  Accessibility as AccessibilityIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon,
  Contrast as ContrastIcon,
  Animation as AnimationIcon,
  HighlightAlt as FocusIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Menu,
  // MenuItem,
  // ListItemIcon,
  // ListItemText,
  Typography,
  Divider,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  useTheme,
} from '@mui/material';
import { useState } from 'react';

import { useSettings } from '../../contexts/SettingsContext';

interface AccessibilityMenuProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export const AccessibilityMenu = ({ position = 'bottom-left' }: AccessibilityMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { settings, updateSettings } = useSettings();
  const theme = useTheme();

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return { top: 16, right: 16 };
      case 'bottom-right':
        return { bottom: 16, right: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-left':
      default:
        return { bottom: 16, left: 16 };
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleFontSizeChange = (_event: Event, newValue: number | number[]) => {
    updateSettings({ fontSize: newValue as number });
  };

  const handleHighContrastChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This would be implemented in the theme
    console.log('High contrast mode:', event.target.checked);
  };

  const handleReduceMotionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This would be implemented in the CSS/animations
    console.log('Reduce motion:', event.target.checked);
  };

  const handleFocusIndicatorsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // This would be implemented in the CSS
    console.log('Enhanced focus indicators:', event.target.checked);
  };

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          ...getPositionStyles(),
          zIndex: 1000,
        }}
      >
        <Tooltip title="Accessibility Options">
          <IconButton
            onClick={handleClick}
            aria-label="Accessibility Options"
            aria-controls="accessibility-menu"
            aria-haspopup="true"
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[3],
              '&:hover': {
                backgroundColor: theme.palette.background.default,
              },
            }}
          >
            <AccessibilityIcon />
          </IconButton>
        </Tooltip>
      </Box>

      <Menu
        id="accessibility-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{
          vertical: position.includes('top') ? 'top' : 'bottom',
          horizontal: position.includes('right') ? 'right' : 'left',
        }}
        transformOrigin={{
          vertical: position.includes('top') ? 'top' : 'bottom',
          horizontal: position.includes('right') ? 'right' : 'left',
        }}
        PaperProps={{
          sx: {
            width: 320,
            p: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="div">
            Accessibility
          </Typography>
          <IconButton size="small" onClick={handleClose} aria-label="Close accessibility menu">
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 2 }} />

        <Typography variant="subtitle2" gutterBottom>
          Text Size
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextDecreaseIcon fontSize="small" sx={{ mr: 1 }} />
          <Slider
            value={settings.fontSize}
            onChange={handleFontSizeChange}
            aria-labelledby="font-size-slider"
            valueLabelDisplay="auto"
            step={1}
            marks
            min={12}
            max={20}
            sx={{ mx: 1 }}
          />
          <TextIncreaseIcon fontSize="small" sx={{ ml: 1 }} />
        </Box>

        <Typography variant="subtitle2" gutterBottom>
          Visual Preferences
        </Typography>

        <FormControlLabel
          control={
            <Switch
              onChange={handleHighContrastChange}
              inputProps={{ 'aria-label': 'High contrast mode' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ContrastIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">High contrast mode</Typography>
            </Box>
          }
          sx={{ display: 'flex', mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              onChange={handleReduceMotionChange}
              inputProps={{ 'aria-label': 'Reduce motion' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <AnimationIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">Reduce motion</Typography>
            </Box>
          }
          sx={{ display: 'flex', mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              onChange={handleFocusIndicatorsChange}
              inputProps={{ 'aria-label': 'Enhanced focus indicators' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FocusIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">Enhanced focus indicators</Typography>
            </Box>
          }
          sx={{ display: 'flex', mb: 1 }}
        />

        <Divider sx={{ my: 2 }} />

        <Button variant="outlined" fullWidth onClick={handleClose}>
          Close
        </Button>
      </Menu>
    </>
  );
};

export default AccessibilityMenu;
