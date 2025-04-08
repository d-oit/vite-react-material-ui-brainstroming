import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Undo as UndoIcon,
  Redo as RedoIcon,
  ContentCopy as CopyIcon,
  ContentPaste as PasteIcon,
  ContentCut as CutIcon,
  FormatColorFill as FillIcon,
  BorderColor as BorderColorIcon,
  TextFields as TextIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import {
  Box,
  SpeedDial,
  SpeedDialAction,
  SpeedDialIcon,
  Tooltip,
  useTheme,
  Divider,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface EnhancedControlsPanelProps {
  onAddNode?: () => void;
  onDelete?: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onOpenNodeStyle?: () => void;
  onOpenEdgeStyle?: () => void;
  onOpenTextStyle?: () => void;
  onOpenSettings?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasSelection?: boolean;
  hasCopiedItems?: boolean;
}

/**
 * Enhanced controls panel with SpeedDial for quick actions
 */
const EnhancedControlsPanel: React.FC<EnhancedControlsPanelProps> = ({
  onAddNode,
  onDelete,
  onSave,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onCut,
  onOpenNodeStyle,
  onOpenEdgeStyle,
  onOpenTextStyle,
  onOpenSettings,
  canUndo = false,
  canRedo = false,
  hasSelection = false,
  hasCopiedItems = false,
}) => {
  const { t } = useI18n();
  const theme = useTheme();
  const [open, setOpen] = useState(false);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  // Group actions by category
  const editActions = [
    {
      icon: <AddIcon />,
      name: t('flow.addNode') ?? 'Add Node',
      onClick: () => {
        if (onAddNode) onAddNode();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.addNodeTooltip') ?? 'Add a new node (Ctrl+N)',
    },
    {
      icon: <DeleteIcon />,
      name: t('flow.delete') ?? 'Delete',
      onClick: () => {
        if (onDelete) onDelete();
        handleClose();
      },
      disabled: !hasSelection,
      tooltip: t('flow.deleteTooltip') ?? 'Delete selected items (Delete)',
    },
  ];

  const historyActions = [
    {
      icon: <UndoIcon />,
      name: t('flow.undo') ?? 'Undo',
      onClick: () => {
        if (onUndo) onUndo();
        handleClose();
      },
      disabled: !canUndo,
      tooltip: t('flow.undoTooltip') ?? 'Undo last action (Ctrl+Z)',
    },
    {
      icon: <RedoIcon />,
      name: t('flow.redo') ?? 'Redo',
      onClick: () => {
        if (onRedo) onRedo();
        handleClose();
      },
      disabled: !canRedo,
      tooltip: t('flow.redoTooltip') ?? 'Redo last action (Ctrl+Y)',
    },
    {
      icon: <SaveIcon />,
      name: t('flow.save') ?? 'Save',
      onClick: () => {
        if (onSave) onSave();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.saveTooltip') ?? 'Save diagram (Ctrl+S)',
    },
  ];

  const clipboardActions = [
    {
      icon: <CopyIcon />,
      name: t('flow.copy') ?? 'Copy',
      onClick: () => {
        if (onCopy) onCopy();
        handleClose();
      },
      disabled: !hasSelection,
      tooltip: t('flow.copyTooltip') ?? 'Copy selected items (Ctrl+C)',
    },
    {
      icon: <PasteIcon />,
      name: t('flow.paste') ?? 'Paste',
      onClick: () => {
        if (onPaste) onPaste();
        handleClose();
      },
      disabled: !hasCopiedItems,
      tooltip: t('flow.pasteTooltip') ?? 'Paste copied items (Ctrl+V)',
    },
    {
      icon: <CutIcon />,
      name: t('flow.cut') ?? 'Cut',
      onClick: () => {
        if (onCut) onCut();
        handleClose();
      },
      disabled: !hasSelection,
      tooltip: t('flow.cutTooltip') ?? 'Cut selected items (Ctrl+X)',
    },
  ];

  const styleActions = [
    {
      icon: <FillIcon />,
      name: t('flow.nodeStyle') ?? 'Node Style',
      onClick: () => {
        if (onOpenNodeStyle) onOpenNodeStyle();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.nodeStyleTooltip') ?? 'Change node style',
    },
    {
      icon: <BorderColorIcon />,
      name: t('flow.edgeStyle') ?? 'Edge Style',
      onClick: () => {
        if (onOpenEdgeStyle) onOpenEdgeStyle();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.edgeStyleTooltip') ?? 'Change edge style',
    },
    {
      icon: <TextIcon />,
      name: t('flow.textStyle') ?? 'Text Style',
      onClick: () => {
        if (onOpenTextStyle) onOpenTextStyle();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.textStyleTooltip') ?? 'Change text style',
    },
    {
      icon: <SettingsIcon />,
      name: t('flow.settings') ?? 'Settings',
      onClick: () => {
        if (onOpenSettings) onOpenSettings();
        handleClose();
      },
      disabled: false,
      tooltip: t('flow.settingsTooltip') ?? 'Open settings',
    },
  ];

  // Combine all actions
  const allActions = [
    ...editActions,
    { isDivider: true },
    ...historyActions,
    { isDivider: true },
    ...clipboardActions,
    { isDivider: true },
    ...styleActions,
  ];

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 20,
        left: 20,
        zIndex: 10,
      }}
    >
      <SpeedDial
        ariaLabel={t('flow.actions') ?? 'Actions'}
        icon={<SpeedDialIcon />}
        onClose={handleClose}
        onOpen={handleOpen}
        open={open}
        direction="down"
        FabProps={{
          sx: {
            bgcolor: theme.palette.primary.main,
            '&:hover': {
              bgcolor: theme.palette.primary.dark,
            },
          },
        }}
      >
        {allActions.map((action, index) => {
          if ('isDivider' in action && action.isDivider) {
            return (
              <Divider
                key={`divider-${index}`}
                orientation="horizontal"
                flexItem
                sx={{ my: 0.5 }}
              />
            );
          }

          const { icon, name, onClick, disabled, tooltip } = action as {
            icon: React.ReactNode;
            name: string;
            onClick: () => void;
            disabled: boolean;
            tooltip: string;
          };

          return (
            <Box
              key={name}
              sx={{ opacity: disabled ? 0.5 : 1, pointerEvents: disabled ? 'none' : 'auto' }}
            >
              <Tooltip title={tooltip} placement="right">
                <span>
                  <SpeedDialAction icon={icon} onClick={onClick} />
                </span>
              </Tooltip>
            </Box>
          );
        })}
      </SpeedDial>
    </Box>
  );
};

export default EnhancedControlsPanel;
