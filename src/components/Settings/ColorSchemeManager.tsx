import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Check as CheckIcon,
  ContentCopy as DuplicateIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  Stack,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
// import { styled } from '@mui/material/styles';

import { useSettings } from '../../contexts/SettingsContext';
import type { ColorScheme } from '../../services/IndexedDBService';
import { NodeType } from '../../types';

// Color picker component
const ColorPicker = ({ color, onChange }: { color: string; onChange: (color: string) => void }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box
        sx={{
          width: 36,
          height: 36,
          borderRadius: 1,
          bgcolor: color,
          border: '1px solid rgba(0, 0, 0, 0.2)',
          cursor: 'pointer',
        }}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'color';
          input.value = color;
          input.addEventListener('input', e => {
            onChange((e.target as HTMLInputElement).value);
          });
          input.click();
        }}
      />
      <TextField
        size="small"
        value={color}
        onChange={e => onChange(e.target.value)}
        sx={{ width: 100 }}
      />
    </Box>
  );
};

// Color scheme card component
const ColorSchemeCard = ({
  scheme,
  isActive,
  onActivate,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  scheme: ColorScheme;
  isActive: boolean;
  onActivate: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        position: 'relative',
        border: isActive ? `2px solid ${theme.palette.primary.main}` : undefined,
        boxShadow: isActive ? 3 : 1,
      }}
    >
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: -10,
            right: -10,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.primary.contrastText,
            borderRadius: '50%',
            width: 24,
            height: 24,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <CheckIcon fontSize="small" />
        </Box>
      )}
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {scheme.name}
        </Typography>

        {scheme.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {scheme.description}
          </Typography>
        )}

        <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
          Node Colors
        </Typography>
        <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2 }}>
          {Object.entries(scheme.colors)
            .filter(([type]) => Object.values(NodeType).includes(type as NodeType))
            .map(([type, color]) => (
              <Box key={type} sx={{ width: '50%', p: 0.5 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box
                    sx={{
                      width: 24,
                      height: 24,
                      borderRadius: 1,
                      bgcolor: color,
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                    }}
                  />
                  <Typography variant="body2">
                    {type.charAt(0).toUpperCase() + type.slice(1)}
                  </Typography>
                </Box>
              </Box>
            ))}
        </Stack>

        {/* Theme Colors */}
        {(scheme.colors.primary || scheme.colors.secondary || scheme.colors.background) && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 1, mb: 0.5 }}>
              Theme Colors
            </Typography>
            <Stack direction="row" flexWrap="wrap" spacing={1} sx={{ mb: 2 }}>
              {Object.entries(scheme.colors)
                .filter(([type]) => !Object.values(NodeType).includes(type as NodeType))
                .map(([type, color]) => (
                  <Box key={type} sx={{ width: '50%', p: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: 1,
                          bgcolor: color,
                          border: '1px solid rgba(0, 0, 0, 0.2)',
                        }}
                      />
                      <Typography variant="body2">
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Typography>
                    </Box>
                  </Box>
                ))}
            </Stack>
          </>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant={isActive ? 'contained' : 'outlined'}
            size="small"
            onClick={onActivate}
            disabled={isActive}
          >
            {isActive ? 'Active' : 'Activate'}
          </Button>

          <Box>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={onEdit}>
                <EditIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Duplicate">
              <IconButton size="small" onClick={onDuplicate}>
                <DuplicateIcon fontSize="small" />
              </IconButton>
            </Tooltip>

            <Tooltip title="Delete">
              <span>
                <IconButton size="small" onClick={onDelete} disabled={scheme.isDefault || isActive}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// Edit color scheme dialog
const EditColorSchemeDialog = ({
  open,
  scheme,
  onClose,
  onSave,
}: {
  open: boolean;
  scheme: ColorScheme | null;
  onClose: () => void;
  onSave: (scheme: ColorScheme) => void;
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [colors, setColors] = useState<Record<string, string>>({
    [NodeType.IDEA]: '#e3f2fd',
    [NodeType.TASK]: '#e8f5e9',
    [NodeType.NOTE]: '#fff8e1',
    [NodeType.RESOURCE]: '#f3e5f5',
    primary: '#1976d2',
    secondary: '#dc004e',
    background: '#ffffff',
    text: '#000000',
    accent: '#f50057',
  } as Record<string, string>);

  // Initialize form when dialog opens
  useEffect(() => {
    if (scheme) {
      setName(scheme.name);
      setDescription(scheme.description || '');

      // Ensure all required color properties exist
      const defaultColors = {
        [NodeType.IDEA]: '#e3f2fd',
        [NodeType.TASK]: '#e8f5e9',
        [NodeType.NOTE]: '#fff8e1',
        [NodeType.RESOURCE]: '#f3e5f5',
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
        accent: '#f50057',
      } as Record<string, string>;

      setColors({
        ...defaultColors,
        ...scheme.colors,
      } as Record<string, string>);
    } else {
      setName('');
      setDescription('');
      setColors({
        [NodeType.IDEA]: '#e3f2fd',
        [NodeType.TASK]: '#e8f5e9',
        [NodeType.NOTE]: '#fff8e1',
        [NodeType.RESOURCE]: '#f3e5f5',
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
        accent: '#f50057',
      } as Record<string, string>);
    }
  }, [scheme]);

  const handleSave = () => {
    const newScheme: ColorScheme = {
      id: scheme?.id ?? crypto.randomUUID(),
      name,
      description,
      colors,
      isCustom: true,
      isDefault: scheme?.isDefault ?? false,
      createdAt: scheme?.createdAt ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    onSave(newScheme);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{scheme?.id ? `Edit ${scheme.name}` : 'Create Color Scheme'}</DialogTitle>

      <DialogContent>
        <TextField
          label="Scheme Name"
          value={name}
          onChange={e => setName(e.target.value)}
          fullWidth
          margin="normal"
          required
        />

        <TextField
          label="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          fullWidth
          margin="normal"
          multiline
          rows={2}
        />

        <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>
          Node Colors
        </Typography>

        <Stack direction="row" flexWrap="wrap" spacing={2}>
          {Object.entries(colors)
            .filter(([type]) => Object.values(NodeType).includes(type as NodeType))
            .map(([type, color]) => (
              <Box key={type} sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ width: 80 }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}:
                  </Typography>
                  <ColorPicker
                    color={color}
                    onChange={newColor => {
                      setColors(prev => ({
                        ...prev,
                        [type]: newColor,
                      }));
                    }}
                  />
                </Box>
              </Box>
            ))}
        </Stack>

        <Typography variant="subtitle1" sx={{ mt: 3, mb: 1 }}>
          Theme Colors
        </Typography>

        <Stack direction="row" flexWrap="wrap" spacing={2}>
          {Object.entries(colors)
            .filter(([type]) => !Object.values(NodeType).includes(type as NodeType))
            .map(([type, color]) => (
              <Box key={type} sx={{ width: { xs: '100%', sm: '50%' }, p: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ width: 80 }}>
                    {type.charAt(0).toUpperCase() + type.slice(1)}:
                  </Typography>
                  <ColorPicker
                    color={color}
                    onChange={newColor => {
                      setColors(prev => ({
                        ...prev,
                        [type]: newColor,
                      }));
                    }}
                  />
                </Box>
              </Box>
            ))}
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" disabled={!name.trim()}>
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Delete confirmation dialog
const DeleteConfirmationDialog = ({
  open,
  schemeName,
  onClose,
  onConfirm,
}: {
  open: boolean;
  schemeName: string;
  onClose: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Delete Color Scheme</DialogTitle>
      <DialogContent>
        <Typography>
          Are you sure you want to delete the color scheme &quot;{schemeName}&quot;? This action
          cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} color="error">
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Main component
export const ColorSchemeManager = () => {
  const {
    settings,
    updateSettings,
    colorSchemes,
    updateColorScheme,
    createColorScheme,
    deleteColorScheme,
  } = useSettings();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [currentScheme, setCurrentScheme] = useState<ColorScheme | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleActivate = (schemeId: string) => {
    updateSettings({ activeColorSchemeId: schemeId });
    setSnackbar({
      open: true,
      message: 'Color scheme activated',
      severity: 'success',
    });
  };

  const handleEdit = (scheme: ColorScheme) => {
    setCurrentScheme(scheme);
    setEditDialogOpen(true);
  };

  const handleCreate = () => {
    // Create a new scheme with default values
    const newScheme: ColorScheme = {
      id: crypto.randomUUID(),
      name: 'New Scheme',
      description: 'Custom color scheme',
      colors: {
        [NodeType.IDEA]: '#e3f2fd',
        [NodeType.TASK]: '#e8f5e9',
        [NodeType.NOTE]: '#fff8e1',
        [NodeType.RESOURCE]: '#f3e5f5',
        primary: '#1976d2',
        secondary: '#dc004e',
        background: '#ffffff',
        text: '#000000',
        accent: '#f50057',
      },
      isDefault: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentScheme(newScheme);
    setEditDialogOpen(true);
  };

  const handleDuplicate = (scheme: ColorScheme) => {
    const duplicatedScheme: ColorScheme = {
      ...scheme,
      id: crypto.randomUUID(),
      name: `${scheme.name} (Copy)`,
      description: scheme.description ? `${scheme.description} (Copy)` : 'Duplicated color scheme',
      isDefault: false,
      isCustom: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCurrentScheme(duplicatedScheme);
    setEditDialogOpen(true);
  };

  const handleDelete = (scheme: ColorScheme) => {
    setCurrentScheme(scheme);
    setDeleteDialogOpen(true);
  };

  const handleSaveScheme = async (scheme: ColorScheme) => {
    try {
      if (colorSchemes.some(s => s.id === scheme.id)) {
        // Update existing scheme
        await updateColorScheme(scheme);
        setSnackbar({
          open: true,
          message: 'Color scheme updated',
          severity: 'success',
        });
      } else {
        // Create new scheme
        await createColorScheme(scheme.id, {
          idea: scheme.colors.idea,
          task: scheme.colors.task,
          note: scheme.colors.note,
          resource: scheme.colors.resource,
        });
        setSnackbar({
          open: true,
          message: 'Color scheme created',
          severity: 'success',
        });
      }

      setEditDialogOpen(false);
    } catch (error) {
      console.error('Failed to save color scheme:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save color scheme',
        severity: 'error',
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!currentScheme) return;

    try {
      await deleteColorScheme(currentScheme.id);
      setSnackbar({
        open: true,
        message: 'Color scheme deleted',
        severity: 'success',
      });
      setDeleteDialogOpen(false);
    } catch (error) {
      console.error('Failed to delete color scheme:', error);
      setSnackbar({
        open: true,
        message: 'Failed to delete color scheme',
        severity: 'error',
      });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Color Schemes</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customize the appearance of your nodes by creating and editing color schemes.
        </Typography>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={handleCreate}>
          New Scheme
        </Button>
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
          gap: 2,
          width: '100%',
          justifyContent: 'center',
          maxWidth: '1200px',
          mx: 'auto' // This centers the grid container itself
        }}
      >
        {colorSchemes.map(scheme => (
          <Box key={scheme.id}>
            <ColorSchemeCard
              scheme={scheme}
              isActive={settings.activeColorSchemeId === scheme.id}
              onActivate={() => handleActivate(scheme.id)}
              onEdit={() => handleEdit(scheme)}
              onDelete={() => handleDelete(scheme)}
              onDuplicate={() => handleDuplicate(scheme)}
            />
          </Box>
        ))}
      </Box>

      {/* Edit Dialog */}
      <EditColorSchemeDialog
        open={editDialogOpen}
        scheme={currentScheme}
        onClose={() => setEditDialogOpen(false)}
        onSave={async scheme => {
          await handleSaveScheme(scheme);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        schemeName={currentScheme?.name || ''}
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={async () => {
          await handleConfirmDelete();
        }}
      />

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};


