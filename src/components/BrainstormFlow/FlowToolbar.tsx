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
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'row',
          gap: 1,
          backgroundColor: theme => theme.palette.background.paper,
          borderRadius: 20,
          padding: 0.5,
          boxShadow: theme => theme.shadows[3],
        }}
      >
        <Tooltip title={t('brainstorm.zoomIn')}>
          <IconButton onClick={onZoomIn} size="medium" aria-label={t('brainstorm.zoomIn')}>
            <ZoomIn fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('brainstorm.zoomOut')}>
          <IconButton onClick={onZoomOut} size="medium" aria-label={t('brainstorm.zoomOut')}>
            <ZoomOut fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title={t('brainstorm.fitView')}>
          <IconButton onClick={onFitView} size="medium" aria-label={t('brainstorm.fitView')}>
            <FitScreen fontSize="small" />
          </IconButton>
        </Tooltip>
        {readOnly !== true && (
          <Tooltip title={t('brainstorm.addNode')}>
            <IconButton
              onClick={() => onAddNode(NodeType.IDEA)}
              size="medium"
              color="primary"
              aria-label={t('brainstorm.addNode')}
            >
              <Add fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
      </Box>
    );
  }
);

FlowToolbar.displayName = 'FlowToolbar';

export default FlowToolbar;
