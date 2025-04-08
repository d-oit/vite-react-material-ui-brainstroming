import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CenterFocusStrong as FitViewIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Map as MapIcon,
  VisibilityOff as HideMapIcon,
} from '@mui/icons-material';
import {
  Box,
  ButtonGroup,
  IconButton,
  Tooltip,
  Slider,
  Paper,
  Typography,
  useTheme,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface EnhancedZoomControlsProps {
  zoomIn: () => void;
  zoomOut: () => void;
  fitView: () => void;
  zoomLevel: number;
  onZoomChange?: (zoom: number) => void;
  minZoom?: number;
  maxZoom?: number;
  showGrid?: boolean;
  onToggleGrid?: () => void;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

/**
 * Enhanced zoom controls with slider and additional functionality
 */
const EnhancedZoomControls: React.FC<EnhancedZoomControlsProps> = ({
  zoomIn,
  zoomOut,
  fitView,
  zoomLevel,
  onZoomChange,
  minZoom = 0.1,
  maxZoom = 2,
  showGrid = false,
  onToggleGrid,
  showMiniMap = true,
  onToggleMiniMap,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const { t } = useI18n();
  const theme = useTheme();
  const [showZoomSlider, setShowZoomSlider] = useState(false);

  // Format zoom level for display
  const formatZoomLevel = (zoom: number) => {
    return `${Math.round(zoom * 100)}%`;
  };

  // Handle zoom slider change
  const handleZoomSliderChange = (_: Event, value: number | number[]) => {
    if (onZoomChange && typeof value === 'number') {
      onZoomChange(value);
    }
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        bottom: 20,
        right: 20,
        zIndex: 10,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: 1,
      }}
    >
      {/* Zoom Slider */}
      {showZoomSlider && (
        <Paper
          elevation={3}
          sx={{
            p: 1.5,
            borderRadius: 2,
            width: 200,
            mb: 1,
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <Typography variant="caption" gutterBottom>
            {t('flow.zoomLevel') ?? 'Zoom Level'}: {formatZoomLevel(zoomLevel)}
          </Typography>
          <Slider
            value={zoomLevel}
            min={minZoom}
            max={maxZoom}
            step={0.01}
            onChange={handleZoomSliderChange}
            aria-labelledby="zoom-slider"
            sx={{ mt: 1 }}
          />
        </Paper>
      )}

      {/* Zoom Controls */}
      <ButtonGroup
        variant="contained"
        aria-label={t('flow.zoomControls') ?? 'Zoom Controls'}
        sx={{
          backgroundColor: theme.palette.background.paper,
          borderRadius: 2,
          boxShadow: theme.shadows[3],
          '& .MuiButtonGroup-grouped': {
            borderColor: theme.palette.divider,
          },
        }}
      >
        <Tooltip title={t('flow.zoomIn') ?? 'Zoom In (Ctrl+Plus)'}>
          <IconButton onClick={zoomIn} size="small" color="inherit">
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.zoomLevel') ?? 'Zoom Level'}>
          <IconButton
            onClick={() => setShowZoomSlider(!showZoomSlider)}
            size="small"
            color="inherit"
            sx={{ px: 1, minWidth: 60 }}
          >
            <Typography variant="caption" fontWeight="bold">
              {formatZoomLevel(zoomLevel)}
            </Typography>
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.zoomOut') ?? 'Zoom Out (Ctrl+Minus)'}>
          <IconButton onClick={zoomOut} size="small" color="inherit">
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.fitView') ?? 'Fit View (Ctrl+0)'}>
          <IconButton onClick={fitView} size="small" color="inherit">
            <FitViewIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {onToggleGrid && (
          <Tooltip title={t('flow.toggleGrid') ?? 'Toggle Grid (Ctrl+G)'}>
            <IconButton onClick={onToggleGrid} size="small" color="inherit">
              {showGrid ? <GridOffIcon fontSize="small" /> : <GridOnIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {onToggleMiniMap && (
          <Tooltip title={t('flow.toggleMiniMap') ?? 'Toggle Mini Map (Ctrl+M)'}>
            <IconButton onClick={onToggleMiniMap} size="small" color="inherit">
              {showMiniMap ? <MapIcon fontSize="small" /> : <HideMapIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {onToggleFullscreen && (
          <Tooltip title={t('flow.toggleFullscreen') ?? 'Toggle Fullscreen (Ctrl+Shift+F)'}>
            <IconButton onClick={onToggleFullscreen} size="small" color="inherit">
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}
      </ButtonGroup>
    </Box>
  );
};

export default EnhancedZoomControls;
