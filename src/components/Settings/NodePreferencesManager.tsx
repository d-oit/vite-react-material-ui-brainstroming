import { TouchApp as TouchIcon, ColorLens as ColorLensIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Slider,
  FormControl,
  FormControlLabel,
  RadioGroup,
  Radio,
  Button,
  Divider,
  Alert,
  Snackbar,
  useTheme,
  Switch,
  Tooltip,
  useMediaQuery,
  TextField,
} from '@mui/material';
import { useState } from 'react';

import { useSettings } from '../../contexts/SettingsContext';
import type { NodePreferences } from '../../services/IndexedDBService';
import { NodeType } from '../../types';

// Node size preview component
const NodeSizePreview = ({
  size,
  width,
  fontSize,
  isSelected,
  onClick,
}: {
  size: string;
  width: number;
  fontSize: number;
  isSelected: boolean;
  onClick: () => void;
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        width: width,
        cursor: 'pointer',
        border: isSelected ? `2px solid ${theme.palette.primary.main}` : undefined,
        boxShadow: isSelected ? 3 : 1,
        transition: 'all 0.2s ease',
      }}
      onClick={onClick}
    >
      <Box
        sx={{
          height: 12,
          backgroundColor: theme.palette.primary.main,
        }}
      />
      <CardContent sx={{ p: 1.5 }}>
        <Typography
          variant="subtitle1"
          sx={{
            fontSize: `${fontSize}rem`,
            fontWeight: 'bold',
            mb: 1,
          }}
        >
          {size.charAt(0).toUpperCase() + size.slice(1)} Node
        </Typography>
        <Typography
          variant="body2"
          sx={{
            fontSize: `${fontSize * 0.9}rem`,
            color: theme.palette.text.secondary,
          }}
        >
          This is a preview of how your {size.toLowerCase()} node will look with the current
          settings.
        </Typography>
      </CardContent>
    </Card>
  );
};

// Main component
export const NodePreferencesManager = () => {
  const { settings, updateSettings, nodePreferences, updateNodePreferences } = useSettings();

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [localPreferences, setLocalPreferences] = useState<NodePreferences | null>(nodePreferences);
  const theme = useTheme();
  useMediaQuery(theme.breakpoints.down('sm'));
  const [touchOptimized, setTouchOptimized] = useState<boolean>(
    nodePreferences?.touchOptimized || false
  );

  if (!localPreferences) {
    return (
      <Alert severity="warning">
        Node preferences could not be loaded. Please refresh the page.
      </Alert>
    );
  }

  const handleSizeChange = (size: 'small' | 'medium' | 'large') => {
    updateSettings({ preferredNodeSize: size });
    setSnackbar({
      open: true,
      message: `Node size set to ${size}`,
      severity: 'success',
    });
  };

  const handleSizeConfigChange = (
    size: 'small' | 'medium' | 'large',
    property: 'width' | 'fontSize',
    value: number
  ) => {
    // Create a safe copy of the preferences
    const updatedPreferences = {
      ...localPreferences,
      nodeSizes: {
        ...localPreferences.nodeSizes,
      },
    };

    // Update the specific size and property in a type-safe way
    if (size === 'small') {
      updatedPreferences.nodeSizes.small = {
        ...localPreferences.nodeSizes.small,
      };
      if (property === 'width') updatedPreferences.nodeSizes.small.width = value;
      if (property === 'fontSize') updatedPreferences.nodeSizes.small.fontSize = value;
    } else if (size === 'medium') {
      updatedPreferences.nodeSizes.medium = {
        ...localPreferences.nodeSizes.medium,
      };
      if (property === 'width') updatedPreferences.nodeSizes.medium.width = value;
      if (property === 'fontSize') updatedPreferences.nodeSizes.medium.fontSize = value;
    } else if (size === 'large') {
      updatedPreferences.nodeSizes.large = {
        ...localPreferences.nodeSizes.large,
      };
      if (property === 'width') updatedPreferences.nodeSizes.large.width = value;
      if (property === 'fontSize') updatedPreferences.nodeSizes.large.fontSize = value;
    }

    setLocalPreferences(updatedPreferences);
  };

  const handleSavePreferences = async () => {
    try {
      // Include touch optimization setting
      const updatedPreferences = {
        ...localPreferences,
        touchOptimized,
      };

      await updateNodePreferences(updatedPreferences);
      setSnackbar({
        open: true,
        message: 'Node preferences saved',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to save node preferences:', error);
      setSnackbar({
        open: true,
        message: 'Failed to save node preferences',
        severity: 'error',
      });
    }
  };

  const handleTouchOptimizationChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTouchOptimized(event.target.checked);
  };

  const handleResetPreferences = () => {
    const defaultPreferences: NodePreferences = {
      defaultSize: 'medium',
      defaultColorScheme: 'default',
      nodeSizes: {
        small: { width: 150, fontSize: 0.8 },
        medium: { width: 200, fontSize: 1 },
        large: { width: 250, fontSize: 1.2 },
      },
      touchOptimized: false,
      customColors: {
        [NodeType.IDEA]: '#e3f2fd', // Light blue
        [NodeType.TASK]: '#e8f5e9', // Light green
        [NodeType.NOTE]: '#fff8e1', // Light yellow
        [NodeType.RESOURCE]: '#f3e5f5', // Light purple
      },
    };

    setTouchOptimized(false);

    setLocalPreferences(defaultPreferences);
    setSnackbar({
      open: true,
      message: 'Node preferences reset to defaults',
      severity: 'success',
    });
  };

  return (
    <Box>
      <Box sx={{ p: { xs: 0, sm: 1 } }}>
        <Typography variant="h6" gutterBottom>
          Node Size Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Customize the size of your nodes for different screen sizes.
        </Typography>
        
        <FormControlLabel
          control={
            <Switch
              checked={touchOptimized}
              onChange={(e) => setTouchOptimized(e.target.checked)}
            />
          }
          label="Touch-optimized mode (larger nodes for touch screens)"
        />
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={touchOptimized}
                onChange={handleTouchOptimizationChange}
                color="primary"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TouchIcon sx={{ mr: 0.5, fontSize: '1rem' }} />
                <Typography variant="body2">Touch-optimized nodes</Typography>
                <Tooltip title="Makes nodes easier to interact with on touch devices">
                  <Box sx={{ ml: 0.5, cursor: 'help', color: 'text.secondary', fontSize: '0.8rem' }}>
                    ⓘ
                  </Box>
                </Tooltip>
              </Box>
            }
          />
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Size Preview
        </Typography>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4 }}>
          {(['small', 'medium', 'large'] as const).map(size => (
            <Box key={size}>
              <NodeSizePreview
                size={size}
                width={
                  size === 'small'
                    ? localPreferences.nodeSizes.small.width
                    : size === 'medium'
                      ? localPreferences.nodeSizes.medium.width
                      : localPreferences.nodeSizes.large.width
                }
                fontSize={
                  size === 'small'
                    ? localPreferences.nodeSizes.small.fontSize
                    : size === 'medium'
                      ? localPreferences.nodeSizes.medium.fontSize
                      : localPreferences.nodeSizes.large.fontSize
                }
                isSelected={settings.preferredNodeSize === size}
                onClick={() => handleSizeChange(size)}
              />
            </Box>
          ))}
        </Box>

        <Typography variant="subtitle1" gutterBottom>
          Customize Sizes
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3,
            width: '100%',
          }}
        >
          {(['small', 'medium', 'large'] as const).map(size => (
            <Box key={size}>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {size.charAt(0).toUpperCase() + size.slice(1)}
                  </Typography>

                  <Typography variant="body2" gutterBottom>
                    Width:{' '}
                    {size === 'small'
                      ? localPreferences.nodeSizes.small.width
                      : size === 'medium'
                        ? localPreferences.nodeSizes.medium.width
                        : localPreferences.nodeSizes.large.width}
                    px
                  </Typography>
                  <Slider
                    value={
                      size === 'small'
                        ? localPreferences.nodeSizes.small.width
                        : size === 'medium'
                          ? localPreferences.nodeSizes.medium.width
                          : localPreferences.nodeSizes.large.width
                    }
                    min={100}
                    max={400}
                    step={10}
                    onChange={(_, value) => handleSizeConfigChange(size, 'width', value as number)}
                    valueLabelDisplay="auto"
                    sx={{ mb: 3 }}
                  />

                  <Typography variant="body2" gutterBottom>
                    Font Size:{' '}
                    {size === 'small'
                      ? localPreferences.nodeSizes.small.fontSize
                      : size === 'medium'
                        ? localPreferences.nodeSizes.medium.fontSize
                        : localPreferences.nodeSizes.large.fontSize}
                    rem
                  </Typography>
                  <Slider
                    value={
                      size === 'small'
                        ? localPreferences.nodeSizes.small.fontSize
                        : size === 'medium'
                          ? localPreferences.nodeSizes.medium.fontSize
                          : localPreferences.nodeSizes.large.fontSize
                    }
                    min={0.6}
                    max={1.6}
                    step={0.1}
                    onChange={(_, value) => handleSizeConfigChange(size, 'fontSize', value as number)}
                    valueLabelDisplay="auto"
                  />
                </CardContent>
              </Card>
            </Box>
          ))}
        </Box>

        <Divider sx={{ my: 4 }} />

        <Typography variant="h6" gutterBottom>
          Node Color Preferences
        </Typography>

        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Customize the colors for each node type. These colors will be used as the default background
          color for nodes of each type.
        </Typography>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
            width: '100%',
          }}
        >
          {Object.values(NodeType).map(nodeType => {
            const nodeTypeLabel = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
            const currentColor = localPreferences.customColors?.[nodeType] || '#e3f2fd';

            return (
              <Box key={nodeType}>
                <Card>
                  <CardContent>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <ColorLensIcon sx={{ mr: 1, color: currentColor }} />
                      <Typography variant="subtitle1">{nodeTypeLabel}</Typography>
                    </Box>

                    <Box
                      sx={{
                        width: '100%',
                        height: 40,
                        backgroundColor: currentColor,
                        borderRadius: 1,
                        border: '1px solid rgba(0,0,0,0.1)',
                        mb: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          boxShadow: 2,
                        },
                      }}
                      onClick={() => {
                        // Use native color picker
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = currentColor;
                        input.addEventListener('input', e => {
                          const newColor = (e.target as HTMLInputElement).value;
                          setLocalPreferences(prev => {
                            if (!prev) return prev;
                            return {
                              ...prev,
                              customColors: {
                                ...prev.customColors,
                                [nodeType]: newColor,
                              },
                            };
                          });
                        });
                        input.click();
                      }}
                    />

                    <TextField
                      fullWidth
                      size="small"
                      label="Color code"
                      value={currentColor}
                      onChange={e => {
                        const newColor = e.target.value;
                        setLocalPreferences(prev => {
                          if (!prev) return prev;
                          return {
                            ...prev,
                            customColors: {
                              ...prev.customColors,
                              [nodeType]: newColor,
                            },
                          };
                        });
                      }}
                    />
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Box>

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
    </Box>
  );
};

