import { Help as HelpIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Grid,
  Box,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Fab,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

import KeyboardShortcutsOverlay from './KeyboardShortcutsOverlay';

interface KeyboardShortcut {
  key: string;
  description: string;
  category: 'navigation' | 'editing' | 'view' | 'general';
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
  };
}

interface KeyboardShortcutsHandlerProps {
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onSave?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onCut?: () => void;
  onSelectAll?: () => void;
  onEscape?: () => void;
  onAddNode?: () => void;
  onToggleChat?: () => void;
  onToggleGrid?: () => void;
  onToggleFullscreen?: () => void;
  disabled?: boolean;
}

export const KeyboardShortcutsHandler: React.FC<KeyboardShortcutsHandlerProps> = ({
  onZoomIn,
  onZoomOut,
  onFitView,
  onUndo,
  onRedo,
  onSave,
  onDelete,
  onCopy,
  onPaste,
  onCut,
  onSelectAll,
  onEscape,
  onAddNode,
  onToggleChat,
  onToggleGrid,
  onToggleFullscreen,
  disabled = false,
}) => {
  const { t } = useI18n();
  const theme = useTheme();
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [overlayOpen, setOverlayOpen] = useState(false);

  // Define keyboard shortcuts
  const shortcuts: KeyboardShortcut[] = [
    {
      key: '+',
      description: t('shortcuts.zoomIn') || 'Zoom in',
      category: 'view',
      modifiers: { ctrl: true },
    },
    {
      key: '-',
      description: t('shortcuts.zoomOut') || 'Zoom out',
      category: 'view',
      modifiers: { ctrl: true },
    },
    {
      key: '0',
      description: t('shortcuts.fitView') || 'Fit view',
      category: 'view',
      modifiers: { ctrl: true },
    },
    {
      key: 'z',
      description: t('shortcuts.undo') || 'Undo',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'y',
      description: t('shortcuts.redo') || 'Redo',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 's',
      description: t('shortcuts.save') || 'Save',
      category: 'general',
      modifiers: { ctrl: true },
    },
    {
      key: 'Delete',
      description: t('shortcuts.delete') || 'Delete selected',
      category: 'editing',
    },
    {
      key: 'c',
      description: t('shortcuts.copy') || 'Copy',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'v',
      description: t('shortcuts.paste') || 'Paste',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'x',
      description: t('shortcuts.cut') || 'Cut',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'a',
      description: t('shortcuts.selectAll') || 'Select all',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'Escape',
      description: t('shortcuts.escape') || 'Cancel current action',
      category: 'general',
    },
    {
      key: 'n',
      description: t('shortcuts.addNode') || 'Add new node',
      category: 'editing',
      modifiers: { ctrl: true },
    },
    {
      key: 'c',
      description: t('shortcuts.toggleChat') || 'Toggle chat panel',
      category: 'view',
      modifiers: { ctrl: true, shift: true },
    },
    {
      key: 'g',
      description: t('shortcuts.toggleGrid') || 'Toggle grid',
      category: 'view',
      modifiers: { ctrl: true },
    },
    {
      key: 'f',
      description: t('shortcuts.toggleFullscreen') || 'Toggle fullscreen',
      category: 'view',
      modifiers: { ctrl: true, shift: true },
    },
    {
      key: '?',
      description: t('shortcuts.showShortcuts') || 'Show keyboard shortcuts',
      category: 'general',
      modifiers: { shift: true },
    },
    {
      key: 'F1',
      description: t('shortcuts.help') || 'Show help',
      category: 'general',
    },
  ];

  // Handle keyboard events
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't trigger shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      // Check for keyboard shortcuts
      if (event.key === '?' && event.shiftKey) {
        setShortcutsDialogOpen(true);
        event.preventDefault();
        return;
      }

      if (event.ctrlKey) {
        switch (event.key) {
          case '+':
          case '=': // Both keys are often used for zoom in
            if (onZoomIn) {
              onZoomIn();
              event.preventDefault();
            }
            break;
          case '-':
            if (onZoomOut) {
              onZoomOut();
              event.preventDefault();
            }
            break;
          case '0':
            if (onFitView) {
              onFitView();
              event.preventDefault();
            }
            break;
          case 'z':
            if (onUndo && !event.shiftKey) {
              onUndo();
              event.preventDefault();
            } else if (onRedo && event.shiftKey) {
              onRedo();
              event.preventDefault();
            }
            break;
          case 'y':
            if (onRedo) {
              onRedo();
              event.preventDefault();
            }
            break;
          case 's':
            if (onSave) {
              onSave();
              event.preventDefault();
            }
            break;
          case 'c':
            if (onCopy && !event.shiftKey) {
              onCopy();
              // Don't prevent default to allow browser copy
            } else if (onToggleChat && event.shiftKey) {
              onToggleChat();
              event.preventDefault();
            }
            break;
          case 'v':
            if (onPaste) {
              onPaste();
              // Don't prevent default to allow browser paste
            }
            break;
          case 'x':
            if (onCut) {
              onCut();
              // Don't prevent default to allow browser cut
            }
            break;
          case 'a':
            if (onSelectAll) {
              onSelectAll();
              event.preventDefault();
            }
            break;
          case 'n':
            if (onAddNode) {
              onAddNode();
              event.preventDefault();
            }
            break;
          case 'g':
            if (onToggleGrid) {
              onToggleGrid();
              event.preventDefault();
            }
            break;
          case 'f':
            if (onToggleFullscreen && event.shiftKey) {
              onToggleFullscreen();
              event.preventDefault();
            }
            break;
        }
      } else if (event.key === 'Delete' || event.key === 'Backspace') {
        if (onDelete) {
          onDelete();
          // Don't prevent default for Backspace to allow navigation
          if (event.key === 'Delete') {
            event.preventDefault();
          }
        }
      } else if (event.key === 'Escape') {
        if (overlayOpen) {
          setOverlayOpen(false);
          event.preventDefault();
        } else if (onEscape) {
          onEscape();
          event.preventDefault();
        }
      } else if (event.key === '?' && event.shiftKey) {
        setOverlayOpen(true);
        event.preventDefault();
      } else if (event.key === 'F1') {
        setShortcutsDialogOpen(true);
        event.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    disabled,
    onZoomIn,
    onZoomOut,
    onFitView,
    onUndo,
    onRedo,
    onSave,
    onDelete,
    onCopy,
    onPaste,
    onCut,
    onSelectAll,
    onEscape,
    onAddNode,
    onToggleChat,
    onToggleGrid,
    onToggleFullscreen,
    overlayOpen,
    setOverlayOpen,
    setShortcutsDialogOpen,
  ]);

  // Format shortcut key for display
  const formatShortcutKey = (shortcut: KeyboardShortcut) => {
    const parts = [];
    if (shortcut.modifiers?.ctrl) parts.push('Ctrl');
    if (shortcut.modifiers?.shift) parts.push('Shift');
    if (shortcut.modifiers?.alt) parts.push('Alt');
    parts.push(shortcut.key);
    return parts.join(' + ');
  };

  // Group shortcuts by category
  const groupedShortcuts = shortcuts.reduce<Record<string, KeyboardShortcut[]>>((acc, shortcut) => {
    if (acc[shortcut.category] === undefined) {
      acc[shortcut.category] = [];
    }
    acc[shortcut.category].push(shortcut);
    return acc;
  }, {});

  return (
    <>
      {/* Keyboard Shortcuts Overlay */}
      <KeyboardShortcutsOverlay open={overlayOpen} onClose={() => setOverlayOpen(false)} />

      <Dialog
        open={shortcutsDialogOpen}
        onClose={() => setShortcutsDialogOpen(false)}
        maxWidth="md"
        fullWidth
        aria-labelledby="keyboard-shortcuts-dialog-title"
      >
        <DialogTitle id="keyboard-shortcuts-dialog-title">
          {t('shortcuts.title') || 'Keyboard Shortcuts'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={3}>
            {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
              <Grid item xs={12} md={6} key={category}>
                <Typography variant="h6" gutterBottom sx={{ textTransform: 'capitalize' }}>
                  {t(`shortcuts.category.${category}`) || category}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {shortcuts.map((shortcut, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        mb: 1,
                      }}
                    >
                      <Typography variant="body2">{shortcut.description}</Typography>
                      <Chip
                        label={formatShortcutKey(shortcut)}
                        size="small"
                        sx={{
                          fontFamily: 'monospace',
                          fontWeight: 'bold',
                          backgroundColor: theme.palette.mode === 'dark' ? '#333' : '#eee',
                        }}
                      />
                    </Box>
                  ))}
                </Box>
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShortcutsDialogOpen(false)} color="primary">
            {t('common.close') || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default KeyboardShortcutsHandler;
