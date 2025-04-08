import {
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  Fullscreen as ExpandIcon,
  FullscreenExit as CollapseIcon,
  Visibility as ShowIcon,
  VisibilityOff as HideIcon,
} from '@mui/icons-material';
import { Box, IconButton, Tooltip, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { MiniMap as ReactFlowMiniMap } from 'reactflow';

import { useI18n } from '../../contexts/I18nContext';

interface EnhancedMiniMapProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  nodeColor?: string | ((node: any) => string);
  nodeBorderRadius?: number;
  nodeStrokeWidth?: number;
  nodeStrokeColor?: string;
  maskColor?: string;
  backgroundColor?: string;
  borderColor?: string;
  zoomable?: boolean;
  pannable?: boolean;
  defaultVisible?: boolean;
  defaultExpanded?: boolean;
}

export const EnhancedMiniMap: React.FC<EnhancedMiniMapProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  position = 'bottom-left',
  nodeColor,
  nodeBorderRadius = 4,
  nodeStrokeWidth = 2,
  nodeStrokeColor,
  maskColor,
  backgroundColor,
  borderColor,
  zoomable = true,
  pannable = true,
  defaultVisible = true,
  defaultExpanded = false,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [visible, setVisible] = useState(defaultVisible);
  const [expanded, setExpanded] = useState(defaultExpanded);

  // Default colors based on theme
  const defaultBackgroundColor =
    theme.palette.mode === 'dark' ? theme.palette.grey[900] : theme.palette.grey[100];

  const defaultBorderColor = theme.palette.divider;

  const defaultMaskColor =
    theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(255, 255, 255, 0.6)';

  const defaultNodeStrokeColor =
    theme.palette.mode === 'dark' ? theme.palette.grey[300] : theme.palette.grey[700];

  // Calculate position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-left':
        return { top: 10, left: 10 };
      case 'top-right':
        return { top: 10, right: 10 };
      case 'bottom-right':
        return { bottom: 10, right: 10 };
      case 'bottom-left':
      default:
        return { bottom: 10, left: 10 };
    }
  };

  // If not visible, just show the toggle button
  if (!visible) {
    return (
      <Box
        sx={{
          position: 'absolute',
          ...getPositionStyles(),
          zIndex: 5,
        }}
      >
        <Tooltip title={t('flow.showMiniMap') || 'Show mini map'}>
          <IconButton
            onClick={() => setVisible(true)}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            <ShowIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'absolute',
        ...getPositionStyles(),
        zIndex: 5,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 0.5,
          mb: 0.5,
        }}
      >
        <Tooltip title={t('flow.zoomIn') || 'Zoom in'}>
          <IconButton
            onClick={onZoomIn}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.zoomOut') || 'Zoom out'}>
          <IconButton
            onClick={onZoomOut}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.fitView') || 'Fit view'}>
          <IconButton
            onClick={onFitView}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            <ExpandIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        <Tooltip
          title={
            expanded
              ? t('flow.collapseMiniMap') || 'Collapse mini map'
              : t('flow.expandMiniMap') || 'Expand mini map'
          }
        >
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            {expanded ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
          </IconButton>
        </Tooltip>

        <Tooltip title={t('flow.hideMiniMap') || 'Hide mini map'}>
          <IconButton
            onClick={() => setVisible(false)}
            size="small"
            sx={{
              backgroundColor: defaultBackgroundColor,
              border: `1px solid ${defaultBorderColor}`,
              '&:hover': {
                backgroundColor:
                  theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[200],
              },
            }}
          >
            <HideIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <ReactFlowMiniMap
        nodeColor={nodeColor}
        nodeBorderRadius={nodeBorderRadius}
        nodeStrokeWidth={nodeStrokeWidth}
        nodeStrokeColor={nodeStrokeColor || defaultNodeStrokeColor}
        maskColor={maskColor || defaultMaskColor}
        zoomable={zoomable}
        pannable={pannable}
        style={{
          backgroundColor: backgroundColor || defaultBackgroundColor,
          border: `1px solid ${borderColor || defaultBorderColor}`,
          width: expanded ? 240 : 160,
          height: expanded ? 180 : 120,
          transition: 'width 0.3s ease, height 0.3s ease',
        }}
      />
    </Box>
  );
};

export default EnhancedMiniMap;
