import { ZoomIn, ZoomOut, Fullscreen, FullscreenExit } from '@mui/icons-material';
import { Box, useMediaQuery, useTheme, Paper, Typography, IconButton } from '@mui/material';
import React from 'react';

interface MobileOptimizedViewProps {
  children: React.ReactNode;
  title?: string;
  controlsEnabled?: boolean;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

/**
 * A component that optimizes the view for mobile devices
 * Provides zoom controls and fullscreen toggle
 */
const MobileOptimizedView: React.FC<MobileOptimizedViewProps> = ({
  children,
  title,
  controlsEnabled = true,
  onZoomIn,
  onZoomOut,
  onFullscreen,
  isFullscreen = false,
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {title && (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 1,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="h6" noWrap>
            {title}
          </Typography>

          {controlsEnabled && isMobile && (
            <Box>
              <IconButton onClick={onZoomIn} size="small" aria-label="Zoom in">
                <ZoomIn />
              </IconButton>
              <IconButton onClick={onZoomOut} size="small" aria-label="Zoom out">
                <ZoomOut />
              </IconButton>
              <IconButton onClick={onFullscreen} size="small" aria-label="Toggle fullscreen">
                {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
              </IconButton>
            </Box>
          )}
        </Box>
      )}

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
          position: 'relative',
          ...(isMobile && {
            touchAction: 'pan-x pan-y', // Enable touch gestures
          }),
        }}
      >
        {/* Mobile-optimized container */}
        <Box
          sx={{
            width: '100%',
            height: '100%',
            ...(isMobile && {
              minHeight: isFullscreen ? '100vh' : 'auto',
            }),
          }}
        >
          {children}
        </Box>
      </Box>

      {/* Mobile controls at the bottom */}
      {controlsEnabled && isMobile && !title && (
        <Paper
          elevation={3}
          sx={{
            position: 'fixed',
            bottom: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1000,
            borderRadius: 8,
            px: 1,
          }}
        >
          <IconButton onClick={onZoomIn} size="small" aria-label="Zoom in">
            <ZoomIn />
          </IconButton>
          <IconButton onClick={onZoomOut} size="small" aria-label="Zoom out">
            <ZoomOut />
          </IconButton>
          <IconButton onClick={onFullscreen} size="small" aria-label="Toggle fullscreen">
            {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
          </IconButton>
        </Paper>
      )}
    </Box>
  );
};

export default MobileOptimizedView;
