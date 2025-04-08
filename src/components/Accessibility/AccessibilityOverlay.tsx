import {
  Accessibility as AccessibilityIcon,
  TextFields as TextFieldsIcon,
  Contrast as ContrastIcon,
  Animation as AnimationIcon,
  TouchApp as TouchIcon,
  Keyboard as KeyboardIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Fab,
  FormControl,
  FormControlLabel,
  FormGroup,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Slider,
  Switch,
  Tooltip,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';

interface AccessibilityOverlayProps {
  onApplySettings?: (settings: {
    highContrast: boolean;
    largeText: boolean;
    reducedMotion: boolean;
    touchOptimized: boolean;
    keyboardFocusVisible: boolean;
    textSpacing: number;
    colorBlindMode: 'none' | 'protanopia' | 'deuteranopia' | 'tritanopia' | 'achromatopsia';
  }) => void;
}

export const AccessibilityOverlay: React.FC<AccessibilityOverlayProps> = ({ onApplySettings }) => {
  // Theme is used for styling references
  const _theme = useTheme();
  const { t } = useI18n();
  const { accessibilityPreferences, updateAccessibilityPreferences } = useSettings();

  const [open, setOpen] = useState(false);
  const [settings, setSettings] = useState({
    highContrast: accessibilityPreferences?.highContrast === true,
    largeText: accessibilityPreferences?.largeText === true,
    reducedMotion: accessibilityPreferences?.reducedMotion === true,
    touchOptimized: accessibilityPreferences?.touchOptimized === true,
    keyboardFocusVisible: accessibilityPreferences?.keyboardFocusVisible !== false, // Default to true
    textSpacing: accessibilityPreferences?.textSpacing ?? 1,
    colorBlindMode: accessibilityPreferences?.colorBlindMode ?? 'none',
  });

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleChange = (name: string, value: boolean | number | string) => {
    setSettings(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleApply = () => {
    if (typeof onApplySettings === 'function') {
      onApplySettings(settings);
    }

    if (typeof updateAccessibilityPreferences === 'function') {
      updateAccessibilityPreferences(settings);
    }

    handleClose();
  };

  const handleReset = () => {
    setSettings({
      highContrast: false,
      largeText: false,
      reducedMotion: false,
      touchOptimized: false,
      keyboardFocusVisible: true,
      textSpacing: 1,
      colorBlindMode: 'none',
    });
  };

  return (
    <>
      <Tooltip title={t('accessibility.openPanel') || 'Accessibility Options'}>
        <Fab
          color="primary"
          size="medium"
          aria-label={t('accessibility.openPanel') || 'Accessibility Options'}
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 16,
            right: 16,
            zIndex: 1000,
          }}
        >
          <AccessibilityIcon />
        </Fab>
      </Tooltip>

      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        aria-labelledby="accessibility-dialog-title"
      >
        <DialogTitle id="accessibility-dialog-title">
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">
              {t('accessibility.title') || 'Accessibility Options'}
            </Typography>
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleClose}
              aria-label={t('common.close') || 'Close'}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('accessibility.visualOptions') || 'Visual Options'}
            </Typography>
            <FormGroup>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContrastIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.highContrast}
                      onChange={e => handleChange('highContrast', e.target.checked)}
                      name="highContrast"
                      color="primary"
                    />
                  }
                  label={t('accessibility.highContrast') || 'High Contrast Mode'}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TextFieldsIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.largeText}
                      onChange={e => handleChange('largeText', e.target.checked)}
                      name="largeText"
                      color="primary"
                    />
                  }
                  label={t('accessibility.largeText') || 'Large Text'}
                />
              </Box>

              <Box sx={{ display: 'flex', mb: 2 }}>
                <TextFieldsIcon sx={{ mr: 2, mt: 2, color: 'primary.main' }} />
                <Box sx={{ width: '100%' }}>
                  <Typography id="text-spacing-slider" gutterBottom>
                    {t('accessibility.textSpacing') || 'Text Spacing'}
                  </Typography>
                  <Slider
                    value={settings.textSpacing}
                    onChange={(_, value) => handleChange('textSpacing', value)}
                    min={0.8}
                    max={2}
                    step={0.1}
                    aria-labelledby="text-spacing-slider"
                    marks={[
                      { value: 0.8, label: '0.8x' },
                      { value: 1, label: '1x' },
                      { value: 1.5, label: '1.5x' },
                      { value: 2, label: '2x' },
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={value => `${value}x`}
                  />
                </Box>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <ContrastIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControl fullWidth>
                  <InputLabel id="color-blind-mode-label">
                    {t('accessibility.colorBlindMode') || 'Color Blind Mode'}
                  </InputLabel>
                  <Select
                    labelId="color-blind-mode-label"
                    value={settings.colorBlindMode}
                    label={t('accessibility.colorBlindMode') || 'Color Blind Mode'}
                    onChange={e => handleChange('colorBlindMode', e.target.value)}
                  >
                    <MenuItem value="none">{t('accessibility.colorBlindNone') || 'None'}</MenuItem>
                    <MenuItem value="protanopia">
                      {t('accessibility.protanopia') || 'Protanopia (Red-Blind)'}
                    </MenuItem>
                    <MenuItem value="deuteranopia">
                      {t('accessibility.deuteranopia') || 'Deuteranopia (Green-Blind)'}
                    </MenuItem>
                    <MenuItem value="tritanopia">
                      {t('accessibility.tritanopia') || 'Tritanopia (Blue-Blind)'}
                    </MenuItem>
                    <MenuItem value="achromatopsia">
                      {t('accessibility.achromatopsia') || 'Achromatopsia (Monochromacy)'}
                    </MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </FormGroup>
          </Box>

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              {t('accessibility.interactionOptions') || 'Interaction Options'}
            </Typography>
            <FormGroup>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <AnimationIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.reducedMotion}
                      onChange={e => handleChange('reducedMotion', e.target.checked)}
                      name="reducedMotion"
                      color="primary"
                    />
                  }
                  label={t('accessibility.reducedMotion') || 'Reduced Motion'}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <TouchIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.touchOptimized}
                      onChange={e => handleChange('touchOptimized', e.target.checked)}
                      name="touchOptimized"
                      color="primary"
                    />
                  }
                  label={t('accessibility.touchOptimized') || 'Touch Optimized'}
                />
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <KeyboardIcon sx={{ mr: 2, color: 'primary.main' }} />
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.keyboardFocusVisible}
                      onChange={e => handleChange('keyboardFocusVisible', e.target.checked)}
                      name="keyboardFocusVisible"
                      color="primary"
                    />
                  }
                  label={t('accessibility.keyboardFocusVisible') || 'Visible Keyboard Focus'}
                />
              </Box>
            </FormGroup>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="textSecondary">
              {t('accessibility.description') ||
                'These settings help make the application more accessible. Changes will be saved for your next visit.'}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} color="inherit">
            {t('common.reset') || 'Reset'}
          </Button>
          <Button onClick={handleClose} color="inherit">
            {t('common.cancel') || 'Cancel'}
          </Button>
          <Button onClick={handleApply} color="primary" variant="contained">
            {t('common.apply') || 'Apply'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccessibilityOverlay;
