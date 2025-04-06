import {
  Accessibility as AccessibilityIcon,
  TextIncrease as TextIncreaseIcon,
  TextDecrease as TextDecreaseIcon,
  Contrast as ContrastIcon,
  Animation as AnimationIcon,
  HighlightAlt as FocusIcon,
  Close as CloseIcon,
  VolumeUp as ScreenReaderIcon,
  Keyboard as TabNavigationIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Menu,
  Typography,
  Divider,
  Slider,
  Switch,
  FormControlLabel,
  Tooltip,
  IconButton,
  useTheme,
  Snackbar,
} from '@mui/material';
import { useState, useEffect } from 'react';

import { useErrorNotification } from '../../contexts/ErrorNotificationContext';
import { useSettings } from '../../contexts/SettingsContext';

interface AccessibilityMenuProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
}

export const AccessibilityMenu = ({ position = 'bottom-left' }: AccessibilityMenuProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { settings, updateSettings } = useSettings();
  const { showError } = useErrorNotification();
  const theme = useTheme();
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  // Accessibility settings state
  const [highContrast, setHighContrast] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const [enhancedFocus, setEnhancedFocus] = useState(false);
  const [keyboardNavigation, setKeyboardNavigation] = useState(false);
  const [screenReaderOptimized, setScreenReaderOptimized] = useState(false);

  // Load accessibility settings from localStorage on mount
  useEffect(() => {
    try {
      const savedSettings = localStorage.getItem('accessibility_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setHighContrast(parsed.highContrast || false);
        setReduceMotion(parsed.reduceMotion || false);
        setEnhancedFocus(parsed.enhancedFocus || false);
        setKeyboardNavigation(parsed.keyboardNavigation || false);
        setScreenReaderOptimized(parsed.screenReaderOptimized || false);

        // Apply settings
        applyAccessibilitySettings(parsed);
      }
    } catch (error) {
      console.error('Failed to load accessibility settings:', error);
    }
  }, []);

  // Apply accessibility settings to the document
  const applyAccessibilitySettings = (settings: {
    highContrast?: boolean;
    reduceMotion?: boolean;
    enhancedFocus?: boolean;
    keyboardNavigation?: boolean;
    screenReaderOptimized?: boolean;
  }) => {
    // Apply high contrast
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    // Apply reduced motion
    if (settings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Apply enhanced focus
    if (settings.enhancedFocus) {
      document.documentElement.classList.add('enhanced-focus');
    } else {
      document.documentElement.classList.remove('enhanced-focus');
    }

    // Apply keyboard navigation
    if (settings.keyboardNavigation) {
      document.documentElement.classList.add('keyboard-navigation');
    } else {
      document.documentElement.classList.remove('keyboard-navigation');
    }

    // Apply screen reader optimizations
    if (settings.screenReaderOptimized) {
      document.documentElement.classList.add('screen-reader-optimized');
    } else {
      document.documentElement.classList.remove('screen-reader-optimized');
    }
  };

  // Save accessibility settings to localStorage
  const saveAccessibilitySettings = () => {
    try {
      const settings = {
        highContrast,
        reduceMotion,
        enhancedFocus,
        keyboardNavigation,
        screenReaderOptimized,
      };
      localStorage.setItem('accessibility_settings', JSON.stringify(settings));

      // Show success message
      setSnackbarMessage('Accessibility settings saved');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Failed to save accessibility settings:', error);
      showError('Failed to save accessibility settings');
    }
  };

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
    setHighContrast(event.target.checked);
    applyAccessibilitySettings({
      ...{
        highContrast: event.target.checked,
        reduceMotion,
        enhancedFocus,
        keyboardNavigation,
        screenReaderOptimized,
      },
    });
  };

  const handleReduceMotionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReduceMotion(event.target.checked);
    applyAccessibilitySettings({
      ...{
        highContrast,
        reduceMotion: event.target.checked,
        enhancedFocus,
        keyboardNavigation,
        screenReaderOptimized,
      },
    });
  };

  const handleFocusIndicatorsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setEnhancedFocus(event.target.checked);
    applyAccessibilitySettings({
      ...{
        highContrast,
        reduceMotion,
        enhancedFocus: event.target.checked,
        keyboardNavigation,
        screenReaderOptimized,
      },
    });
  };

  const handleKeyboardNavigationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setKeyboardNavigation(event.target.checked);
    applyAccessibilitySettings({
      ...{
        highContrast,
        reduceMotion,
        enhancedFocus,
        keyboardNavigation: event.target.checked,
        screenReaderOptimized,
      },
    });
  };

  const handleScreenReaderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setScreenReaderOptimized(event.target.checked);
    applyAccessibilitySettings({
      ...{
        highContrast,
        reduceMotion,
        enhancedFocus,
        keyboardNavigation,
        screenReaderOptimized: event.target.checked,
      },
    });
  };

  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
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
              checked={highContrast}
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
              checked={reduceMotion}
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
              checked={enhancedFocus}
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

        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
          Keyboard & Screen Reader
        </Typography>

        <FormControlLabel
          control={
            <Switch
              checked={keyboardNavigation}
              onChange={handleKeyboardNavigationChange}
              inputProps={{ 'aria-label': 'Improved keyboard navigation' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <TabNavigationIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">Improved keyboard navigation</Typography>
            </Box>
          }
          sx={{ display: 'flex', mb: 1 }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={screenReaderOptimized}
              onChange={handleScreenReaderChange}
              inputProps={{ 'aria-label': 'Screen reader optimizations' }}
            />
          }
          label={
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <ScreenReaderIcon fontSize="small" sx={{ mr: 1 }} />
              <Typography variant="body2">Screen reader optimizations</Typography>
            </Box>
          }
          sx={{ display: 'flex', mb: 1 }}
        />

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
          <Button variant="outlined" onClick={handleClose} sx={{ flex: 1 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={() => {
              saveAccessibilitySettings();
              handleClose();
            }}
            sx={{ flex: 1 }}
          >
            Save
          </Button>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={3000}
          onClose={handleSnackbarClose}
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Menu>
    </>
  );
};

export default AccessibilityMenu;
