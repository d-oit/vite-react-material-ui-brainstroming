import {
  Delete as DeleteIcon,
  ColorLens as StyleIcon,
  Straighten as StraightenIcon,
  ShowChart as CurveIcon,
} from '@mui/icons-material';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material';
import React from 'react';

import { useI18n } from '../../contexts/I18nContext';
import type { Edge } from '../../types';

interface EdgeContextMenuProps {
  edge: Edge | null;
  anchorPosition: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onDelete: (edge: Edge) => void;
  onStyle: (edge: Edge) => void;
  onChangeType: (edge: Edge, type: 'straight' | 'curved') => void;
}

export const EdgeContextMenu: React.FC<EdgeContextMenuProps> = ({
  edge,
  anchorPosition,
  open,
  onClose,
  onDelete,
  onStyle,
  onChangeType,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  if (!edge) return null;

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition !== null ? { top: anchorPosition.y, left: anchorPosition.x } : undefined
      }
      MenuListProps={{
        'aria-label': t('flow.edgeContextMenu') || 'Edge context menu',
        dense: true,
      }}
      PaperProps={{
        elevation: 3,
        sx: {
          minWidth: 200,
          maxWidth: 300,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
        },
      }}
    >
      <MenuItem
        onClick={() => {
          onStyle(edge);
          onClose();
        }}
        aria-label={t('flow.styleEdge') || 'Style edge'}
      >
        <ListItemIcon>
          <StyleIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.style') || 'Style'}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          onChangeType(edge, 'straight');
          onClose();
        }}
        aria-label={t('flow.makeStraight') || 'Make straight'}
      >
        <ListItemIcon>
          <StraightenIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.straight') || 'Straight'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          onChangeType(edge, 'curved');
          onClose();
        }}
        aria-label={t('flow.makeCurved') || 'Make curved'}
      >
        <ListItemIcon>
          <CurveIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.curved') || 'Curved'}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          onDelete(edge);
          onClose();
        }}
        aria-label={t('flow.deleteEdge') || 'Delete edge'}
        sx={{ color: theme.palette.error.main }}
      >
        <ListItemIcon sx={{ color: 'inherit' }}>
          <DeleteIcon fontSize="small" color="error" />
        </ListItemIcon>
        <ListItemText>{t('flow.delete') || 'Delete'}</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default EdgeContextMenu;
