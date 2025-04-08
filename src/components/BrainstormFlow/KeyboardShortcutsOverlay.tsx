import { Close as CloseIcon, Keyboard as KeyboardIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  useTheme,
  Fade,
  Backdrop,
  Grid,
  Divider,
} from '@mui/material';
import React, { useEffect, useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';

interface ShortcutCategory {
  category: string;
  items: {
    action: string;
    shortcut: string;
  }[];
}

interface KeyboardShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Overlay that displays keyboard shortcuts when Shift+? is pressed
 * Appears as a semi-transparent overlay on top of the canvas
 */
const KeyboardShortcutsOverlay: React.FC<KeyboardShortcutsOverlayProps> = ({ open, onClose }) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [shortcuts, setShortcuts] = useState<ShortcutCategory[]>([]);

  // Define all keyboard shortcuts
  useEffect(() => {
    setShortcuts([
      {
        category: t('shortcuts.category.navigation') || 'Navigation',
        items: [
          {
            action: t('shortcuts.zoomIn') || 'Zoom In',
            shortcut: 'Ctrl + =',
          },
          {
            action: t('shortcuts.zoomOut') || 'Zoom Out',
            shortcut: 'Ctrl + -',
          },
          {
            action: t('shortcuts.fitView') || 'Fit View',
            shortcut: 'Ctrl + 0',
          },
          {
            action: t('shortcuts.toggleGrid') || 'Toggle Grid',
            shortcut: 'Ctrl + G',
          },
        ],
      },
      {
        category: t('shortcuts.category.editing') || 'Editing',
        items: [
          {
            action: t('shortcuts.addNode') || 'Add Node',
            shortcut: 'Ctrl + N',
          },
          {
            action: t('shortcuts.delete') || 'Delete Selected',
            shortcut: 'Delete',
          },
          {
            action: t('shortcuts.copy') || 'Copy Selected',
            shortcut: 'Ctrl + C',
          },
          {
            action: t('shortcuts.paste') || 'Paste',
            shortcut: 'Ctrl + V',
          },
        ],
      },
      {
        category: t('shortcuts.category.history') || 'History',
        items: [
          {
            action: t('shortcuts.undo') || 'Undo',
            shortcut: 'Ctrl + Z',
          },
          {
            action: t('shortcuts.redo') || 'Redo',
            shortcut: 'Ctrl + Y',
          },
          {
            action: t('shortcuts.save') || 'Save',
            shortcut: 'Ctrl + S',
          },
        ],
      },
      {
        category: t('shortcuts.category.help') || 'Help',
        items: [
          {
            action: t('shortcuts.help') || 'Help',
            shortcut: 'F1',
          },
          {
            action: t('shortcuts.showShortcuts') || 'Show Shortcuts',
            shortcut: 'Shift + ?',
          },
        ],
      },
    ]);
  }, [t]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onClose]);

  return (
    <Backdrop
      sx={{
        color: '#fff',
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(3px)',
      }}
      open={open}
      onClick={onClose}
    >
      <Fade in={open}>
        <Paper
          elevation={6}
          sx={{
            maxWidth: '800px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'auto',
            p: 3,
            position: 'relative',
            backgroundColor:
            theme.palette.mode === 'dark'
              ? 'rgba(30, 30, 30, 0.95)'
              : 'rgba(255, 255, 255, 0.95)',
          }}
          onClick={e => e.stopPropagation()}
        >
          <IconButton
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
            }}
            onClick={onClose}
            aria-label={t('common.close') || 'Close'}
          >
            <CloseIcon />
          </IconButton>

          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <KeyboardIcon sx={{ mr: 1 }} />
            <Typography variant="h5" component="h2">
              {t('shortcuts.title') || 'Keyboard Shortcuts'}
            </Typography>
          </Box>

          <Divider sx={{ mb: 3 }} />

          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' }, gap: 3 }}>
            {shortcuts.map(category => (
              <Box key={category.category}>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 'bold' }}>
                  {category.category}
                </Typography>
                <Box sx={{ mb: 3 }}>
                  {category.items.map(item => (
                    <Box
                      key={item.action}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        py: 1,
                        borderBottom: `1px solid ${theme.palette.divider}`,
                      }}
                    >
                      <Typography variant="body1">{item.action}</Typography>
                      <Typography
                        component="code"
                        sx={{
                          backgroundColor: theme.palette.action.hover,
                          padding: theme.spacing(0.5, 1),
                          borderRadius: 1,
                          fontFamily: 'monospace',
                          fontSize: '0.875rem',
                        }}
                      >
                        {item.shortcut}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 3, textAlign: 'center', opacity: 0.7 }}>
            <Typography variant="body2">
              {t('shortcuts.tip') || 'Tip: Press Escape to close this overlay'}
            </Typography>
          </Box>
        </Paper>
      </Fade>
    </Backdrop>
  );
};

export default KeyboardShortcutsOverlay;
