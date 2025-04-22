import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  FitScreen as FitViewIcon,
  GridOn as GridIcon,
  GridOff as GridOffIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  Accessibility as AccessibilityIcon,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, Popover, Slider, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface EnhancedControlsProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleGrid?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onFullscreen?: () => void;
  onAccessibility?: () => void;
  onZoomChange?: (zoom: number) => void;
  showGrid?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  isFullscreen?: boolean;
  currentZoom?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

export const EnhancedControls: React.FC<EnhancedControlsProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleGrid,
  onUndo,
  onRedo,
  onSave,
  onFullscreen,
  onZoomChange,
  showGrid = true,
  canUndo = false,
  onAccessibility,
  canRedo = false,
  isFullscreen = false,
  currentZoom = 1,
  position = 'bottom-right',
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [settingsAnchorEl, setSettingsAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [zoomValue, setZoomValue] = useState<number>(currentZoom * 100);

  const handleSettingsClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  const handleSettingsClose = () => {
    setSettingsAnchorEl(null);
  };

  const handleZoomChange = (_event: Event, newValue: number | number[]) => {
    const zoom = Array.isArray(newValue) ? newValue[0] : newValue;
    setZoomValue(zoom);
    if (onZoomChange) {
      onZoomChange(zoom / 100);
    }
  };

  // Calculate position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 10, left: 10 };
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-left':
        return { bottom: 10, left: 10 };
      case 'bottom-right':
      default:
        return { top: 10, right: 10 }; // Changed to top-right to avoid overlap with minimap
    }
  };

  const settingsOpen = Boolean(settingsAnchorEl);

  return (
    <Box
      sx={{
        position: 'absolute',
        ...getPositionStyles(),
        zIndex: 10,
        display: 'flex',
        flexDirection: 'row', // Changed to row for horizontal layout
        gap: 0.5,
        backgroundColor: theme.palette.background.paper,
        borderRadius: 2,
        padding: 0.5,
        boxShadow: theme => theme.shadows[3],
      }}
    >
      {/* Reordered buttons to match the screenshot */}
      <Tooltip title={t('flow.settings') || 'Settings'} placement="bottom">
        <IconButton
          onClick={handleSettingsClick}
          size="small"
          aria-label={t('flow.settings') || 'Settings'}
        >
          <SettingsIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {onToggleGrid && (
        <Tooltip
          title={showGrid ? t('flow.hideGrid') || 'Hide grid' : t('flow.showGrid') || 'Show grid'}
          placement="bottom"
        >
          <IconButton
            onClick={onToggleGrid}
            size="small"
            aria-label={
              showGrid ? t('flow.hideGrid') || 'Hide grid' : t('flow.showGrid') || 'Show grid'
            }
          >
            {showGrid ? <GridOffIcon fontSize="small" /> : <GridIcon fontSize="small" />}
          </IconButton>
        </Tooltip>
      )}

      {onFullscreen && (
        <Tooltip
          title={
            isFullscreen
              ? t('flow.exitFullscreen') || 'Exit fullscreen'
              : t('flow.enterFullscreen') || 'Enter fullscreen'
          }
          placement="bottom"
        >
          <IconButton
            onClick={onFullscreen}
            size="small"
            aria-label={
              isFullscreen
                ? t('flow.exitFullscreen') || 'Exit fullscreen'
                : t('flow.enterFullscreen') || 'Enter fullscreen'
            }
          >
            {isFullscreen ? (
              <FullscreenExitIcon fontSize="small" />
            ) : (
              <FullscreenIcon fontSize="small" />
            )}
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('flow.zoomOut') || 'Zoom out'} placement="bottom">
        <IconButton onClick={onZoomOut} size="small" aria-label={t('flow.zoomOut') || 'Zoom out'}>
          <ZoomOutIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      <Tooltip title={t('flow.zoomIn') || 'Zoom in'} placement="bottom">
        <IconButton onClick={onZoomIn} size="small" aria-label={t('flow.zoomIn') || 'Zoom in'}>
          <ZoomInIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {/* Only show save button if onSave is provided (which means autosave is disabled) */}
      {onSave && (
        <Tooltip title={t('flow.save') || 'Save'} placement="bottom">
          <IconButton
            onClick={onSave}
            size="small"
            aria-label={t('flow.save') || 'Save'}
            data-testid="save-button"
          >
            <SaveIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Tooltip title={t('flow.fitView') || 'Fit view'} placement="bottom">
        <IconButton onClick={onFitView} size="small" aria-label={t('flow.fitView') || 'Fit view'}>
          <FitViewIcon fontSize="small" />
        </IconButton>
      </Tooltip>

      {onUndo && (
        <Tooltip title={t('flow.undo') || 'Undo'} placement="bottom">
          <span>
            <IconButton
              onClick={onUndo}
              size="small"
              disabled={!canUndo}
              aria-label={t('flow.undo') || 'Undo'}
            >
              <UndoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {onRedo && (
        <Tooltip title={t('flow.redo') || 'Redo'} placement="bottom">
          <span>
            <IconButton
              onClick={onRedo}
              size="small"
              disabled={!canRedo}
              aria-label={t('flow.redo') || 'Redo'}
            >
              <RedoIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      )}

      {onAccessibility && (
        <Tooltip title={t('accessibility.title') || 'Accessibility'} placement="bottom">
          <IconButton
            onClick={onAccessibility}
            size="small"
            aria-label={t('accessibility.title') || 'Accessibility'}
          >
            <AccessibilityIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      <Popover
        open={settingsOpen}
        anchorEl={settingsAnchorEl}
        onClose={handleSettingsClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 250 }}>
          <Typography variant="subtitle2" gutterBottom>
            {t('flow.zoomLevel') || 'Zoom Level'}: {zoomValue}%
          </Typography>
          <Slider
            value={zoomValue}
            onChange={handleZoomChange}
            aria-labelledby="zoom-slider"
            min={10}
            max={400}
            step={10}
            valueLabelDisplay="auto"
            valueLabelFormat={value => `${value}%`}
          />

          <Typography variant="subtitle2" gutterBottom sx={{ mt: 2 }}>
            {t('flow.shortcuts') || 'Keyboard Shortcuts'}
          </Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            <strong>Ctrl + +</strong>: {t('flow.zoomIn') || 'Zoom in'}
          </Typography>
          <Typography variant="body2">
            <strong>Ctrl + -</strong>: {t('flow.zoomOut') || 'Zoom out'}
          </Typography>
          <Typography variant="body2">
            <strong>Ctrl + 0</strong>: {t('flow.fitView') || 'Fit view'}
          </Typography>
          <Typography variant="body2">
            <strong>Ctrl + Z</strong>: {t('flow.undo') || 'Undo'}
          </Typography>
          <Typography variant="body2">
            <strong>Ctrl + Y</strong>: {t('flow.redo') || 'Redo'}
          </Typography>
          <Typography variant="body2">
            <strong>Ctrl + S</strong>: {t('flow.save') || 'Save'}
          </Typography>
          <Typography variant="body2">
            <strong>Delete</strong>: {t('flow.deleteSelected') || 'Delete selected'}
          </Typography>
        </Box>
      </Popover>
    </Box>
  );
};

export default EnhancedControls;
