import {
  Settings as SettingsIcon,
  GridOn as GridOnIcon,
  GridOff as GridOffIcon,
  Fullscreen as FullscreenIcon,
  FullscreenExit as FullscreenExitIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import React from 'react';

interface ControlsPanelProps {
  handleSettingsOpen: (event: React.MouseEvent<HTMLElement>) => void;
  toggleGrid: () => void;
  toggleFullscreen: () => void;
  zoomIn: () => void;
  zoomOut: () => void;
  isFullscreen: boolean;
  showGrid: boolean;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  handleSettingsOpen,
  toggleGrid,
  toggleFullscreen,
  zoomIn,
  zoomOut,
  isFullscreen,
  showGrid,
}) => {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        gap: 1,
        p: 1,
        bgcolor: 'background.paper',
        borderRadius: 1,
        boxShadow: 1,
      }}
    >
      <Tooltip title="Settings">
        <IconButton onClick={handleSettingsOpen} size="small" aria-label="Settings">
          <SettingsIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title={showGrid ? 'Hide Grid' : 'Show Grid'}>
        <IconButton
          onClick={toggleGrid}
          size="small"
          aria-label={showGrid ? 'Hide Grid' : 'Show Grid'}
        >
          {showGrid ? <GridOffIcon /> : <GridOnIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}>
        <IconButton
          onClick={toggleFullscreen}
          size="small"
          aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
        >
          {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
        </IconButton>
      </Tooltip>

      <Tooltip title="Zoom Out">
        <IconButton onClick={zoomOut} size="small" aria-label="Zoom Out">
          <ZoomOutIcon />
        </IconButton>
      </Tooltip>

      <Tooltip title="Zoom In">
        <IconButton onClick={zoomIn} size="small" aria-label="Zoom In">
          <ZoomInIcon />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ControlsPanel;
