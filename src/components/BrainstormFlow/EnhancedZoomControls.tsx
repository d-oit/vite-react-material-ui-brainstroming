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
  alpha,
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
            backgroundColor: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(8px)',
            boxShadow: theme.shadows[3],
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

      {/* Additional Controls */}
      <Paper
        elevation={3}
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          p: 0.5,
          borderRadius: 2,
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
          backdropFilter: 'blur(8px)',
          boxShadow: theme.shadows[3],
        }}
      >
        {/* MiniMap Toggle */}
        {onToggleMiniMap && (
          <Tooltip title={t('flow.toggleMiniMap') ?? 'Toggle Mini Map (Ctrl+M)'} placement="left">
            <IconButton
              onClick={onToggleMiniMap}
              size="small"
              color={showMiniMap ? 'primary' : 'default'}
            >
              {showMiniMap ? <MapIcon fontSize="small" /> : <HideMapIcon fontSize="small" />}
            </IconButton>
          </Tooltip>
        )}

        {/* Fullscreen Toggle */}
        {onToggleFullscreen && (
          <Tooltip
            title={t('flow.toggleFullscreen') ?? 'Toggle Fullscreen (Ctrl+Shift+F)'}
            placement="left"
          >
            <IconButton
              onClick={onToggleFullscreen}
              size="small"
              color={isFullscreen ? 'primary' : 'default'}
            >
              {isFullscreen ? (
                <FullscreenExitIcon fontSize="small" />
              ) : (
                <FullscreenIcon fontSize="small" />
              )}
            </IconButton>
          </Tooltip>
        )}

        {/* Zoom Level Toggle */}
        <Tooltip title={t('flow.zoomLevel') ?? 'Zoom Level'} placement="left">
          <IconButton
            onClick={() => setShowZoomSlider(!showZoomSlider)}
            size="small"
            color={showZoomSlider ? 'primary' : 'default'}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: 40,
              width: 40,
            }}
          >
            <Typography variant="caption" fontSize="0.7rem" lineHeight={1}>
              ZOOM
            </Typography>
            <Typography variant="caption" fontWeight="bold" lineHeight={1}>
              {formatZoomLevel(zoomLevel)}
            </Typography>
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
};

export default EnhancedZoomControls;
