import { ZoomIn, ZoomOut, FitScreen, Add } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { memo } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { NodeType } from '../../types';

interface FlowToolbarProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onAddNode: (type: NodeType) => void;
  readOnly?: boolean;
}

const FlowToolbar = memo(
  ({ onZoomIn, onZoomOut, onFitView, onAddNode, readOnly }: FlowToolbarProps) => {
    const { t } = useI18n();

    return (
      <Box sx={{ position: 'absolute', top: 10, right: 10, zIndex: 4 }}>
        <Tooltip title={t('brainstorm.zoomIn')}>
          <IconButton onClick={onZoomIn} size="large">
            <ZoomIn />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('brainstorm.zoomOut')}>
          <IconButton onClick={onZoomOut} size="large">
            <ZoomOut />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('brainstorm.fitView')}>
          <IconButton onClick={onFitView} size="large">
            <FitScreen />
          </IconButton>
        </Tooltip>
        {readOnly !== true && (
          <Tooltip title={t('brainstorm.addNode')}>
            <IconButton onClick={() => onAddNode(NodeType.IDEA)} size="large">
              <Add />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }
);

FlowToolbar.displayName = 'FlowToolbar';

export default FlowToolbar;
