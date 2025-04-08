import {
  AddCircleOutline as AddNodeIcon,
  ContentPaste as PasteIcon,
  ZoomOutMap as FitViewIcon,
  GridOn as GridIcon,
  GridOff as GridOffIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
} from '@mui/icons-material';
import { Menu, MenuItem, ListItemIcon, ListItemText, Divider, useTheme } from '@mui/material';
import React from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { NodeType } from '../../types';

interface CanvasContextMenuProps {
  anchorPosition: { x: number; y: number } | null;
  open: boolean;
  onClose: () => void;
  onAddNode: (type: NodeType, position: { x: number; y: number }) => void;
  onPaste: () => void;
  onFitView: () => void;
  onToggleGrid: () => void;
  onUndo: () => void;
  onRedo: () => void;
  showGrid: boolean;
  canUndo: boolean;
  canRedo: boolean;
  canPaste: boolean;
}

/**
 * CanvasContextMenu component for displaying a context menu for the canvas
 * Provides options for adding nodes, pasting, fitting view, toggling grid, and undo/redo
 */
export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  anchorPosition,
  open,
  onClose,
  onAddNode,
  onPaste,
  onFitView,
  onToggleGrid,
  onUndo,
  onRedo,
  showGrid,
  canUndo,
  canRedo,
  canPaste,
}) => {
  const theme = useTheme();
  const { t } = useI18n();

  return (
    <Menu
      open={open}
      onClose={onClose}
      anchorReference="anchorPosition"
      anchorPosition={
        anchorPosition !== null ? { top: anchorPosition.y, left: anchorPosition.x } : undefined
      }
      // Ensure the menu is properly labeled for screen readers
      MenuListProps={{
        'aria-label': t('flow.canvasContextMenu') || 'Canvas context menu',
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
          if (anchorPosition) {
            onAddNode(NodeType.IDEA, { x: anchorPosition.x, y: anchorPosition.y });
          }
          onClose();
        }}
        aria-label={t('flow.addIdeaNode') || 'Add idea node'}
      >
        <ListItemIcon>
          <AddNodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.addIdea') || 'Add Idea'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (anchorPosition) {
            onAddNode(NodeType.TASK, { x: anchorPosition.x, y: anchorPosition.y });
          }
          onClose();
        }}
        aria-label={t('flow.addTaskNode') || 'Add task node'}
      >
        <ListItemIcon>
          <AddNodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.addTask') || 'Add Task'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (anchorPosition) {
            onAddNode(NodeType.NOTE, { x: anchorPosition.x, y: anchorPosition.y });
          }
          onClose();
        }}
        aria-label={t('flow.addNoteNode') || 'Add note node'}
      >
        <ListItemIcon>
          <AddNodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.addNote') || 'Add Note'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          if (anchorPosition) {
            onAddNode(NodeType.RESOURCE, { x: anchorPosition.x, y: anchorPosition.y });
          }
          onClose();
        }}
        aria-label={t('flow.addResourceNode') || 'Add resource node'}
      >
        <ListItemIcon>
          <AddNodeIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.addResource') || 'Add Resource'}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          onPaste();
          onClose();
        }}
        disabled={!canPaste}
        aria-label={t('flow.paste') || 'Paste'}
      >
        <ListItemIcon>
          <PasteIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.paste') || 'Paste'}</ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          onFitView();
          onClose();
        }}
        aria-label={t('flow.fitView') || 'Fit view'}
      >
        <ListItemIcon>
          <FitViewIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.fitView') || 'Fit View'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          onToggleGrid();
          onClose();
        }}
        aria-label={
          showGrid ? t('flow.hideGrid') || 'Hide grid' : t('flow.showGrid') || 'Show grid'
        }
      >
        <ListItemIcon>
          {showGrid ? <GridOffIcon fontSize="small" /> : <GridIcon fontSize="small" />}
        </ListItemIcon>
        <ListItemText>
          {showGrid ? t('flow.hideGrid') || 'Hide Grid' : t('flow.showGrid') || 'Show Grid'}
        </ListItemText>
      </MenuItem>

      <Divider />

      <MenuItem
        onClick={() => {
          onUndo();
          onClose();
        }}
        disabled={!canUndo}
        aria-label={t('flow.undo') || 'Undo'}
      >
        <ListItemIcon>
          <UndoIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.undo') || 'Undo'}</ListItemText>
      </MenuItem>

      <MenuItem
        onClick={() => {
          onRedo();
          onClose();
        }}
        disabled={!canRedo}
        aria-label={t('flow.redo') || 'Redo'}
      >
        <ListItemIcon>
          <RedoIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>{t('flow.redo') || 'Redo'}</ListItemText>
      </MenuItem>
    </Menu>
  );
};

export default CanvasContextMenu;
