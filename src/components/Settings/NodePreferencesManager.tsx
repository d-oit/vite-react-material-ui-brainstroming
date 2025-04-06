import { useState } from 'react';
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
} from '@mui/material';
import { useSettings } from '../../contexts/SettingsContext';
import { NodeType } from '../../types';
import { NodePreferences } from '../../services/IndexedDBService';

// Node size preview component
const NodeSizePreview = ({
  size,
  width,
  fontSize,
  color,
  isSelected,
  onClick,
}: {
  size: string;
  width: number;
  fontSize: number;
  color: string;
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
          This is a preview of how your {size.toLowerCase()} node will look with the current settings.
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
    const updatedPreferences = {
      ...localPreferences,
      nodeSizes: {
        ...localPreferences.nodeSizes,
        [size]: {
          ...localPreferences.nodeSizes[size],
          [property]: value,
        },
      },
    };
    
    setLocalPreferences(updatedPreferences);
  };
  
  const handleSavePreferences = async () => {
    try {
      await updateNodePreferences(localPreferences);
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
  
  const handleResetPreferences = () => {
    const defaultPreferences: NodePreferences = {
      defaultSize: 'medium',
      defaultColorScheme: 'default',
      nodeSizes: {
        small: { width: 150, fontSize: 0.8 },
        medium: { width: 200, fontSize: 1 },
        large: { width: 250, fontSize: 1.2 },
      },
    };
    
    setLocalPreferences(defaultPreferences);
    setSnackbar({
      open: true,
      message: 'Node preferences reset to defaults',
      severity: 'success',
    });
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Node Size Preferences</Typography>
        <Box>
          <Button
            variant="outlined"
            color="secondary"
            onClick={handleResetPreferences}
            sx={{ mr: 1 }}
          >
            Reset to Defaults
          </Button>
          <Button
            variant="contained"
            onClick={handleSavePreferences}
          >
            Save Changes
          </Button>
        </Box>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Typography variant="subtitle1" gutterBottom>
        Default Node Size
      </Typography>
      
      <FormControl component="fieldset" sx={{ mb: 3 }}>
        <RadioGroup
          row
          value={settings.preferredNodeSize}
          onChange={(e) => handleSizeChange(e.target.value as 'small' | 'medium' | 'large')}
        >
          <FormControlLabel value="small" control={<Radio />} label="Small" />
          <FormControlLabel value="medium" control={<Radio />} label="Medium" />
          <FormControlLabel value="large" control={<Radio />} label="Large" />
        </RadioGroup>
      </FormControl>
      
      <Typography variant="subtitle1" gutterBottom>
        Size Preview
      </Typography>
      
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <Grid item key={size}>
            <NodeSizePreview
              size={size}
              width={localPreferences.nodeSizes[size].width}
              fontSize={localPreferences.nodeSizes[size].fontSize}
              color="#e3f2fd"
              isSelected={settings.preferredNodeSize === size}
              onClick={() => handleSizeChange(size)}
            />
          </Grid>
        ))}
      </Grid>
      
      <Typography variant="subtitle1" gutterBottom>
        Customize Sizes
      </Typography>
      
      <Grid container spacing={3}>
        {(['small', 'medium', 'large'] as const).map((size) => (
          <Grid item xs={12} md={4} key={size}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {size.charAt(0).toUpperCase() + size.slice(1)}
                </Typography>
                
                <Typography variant="body2" gutterBottom>
                  Width: {localPreferences.nodeSizes[size].width}px
                </Typography>
                <Slider
                  value={localPreferences.nodeSizes[size].width}
                  min={100}
                  max={400}
                  step={10}
                  onChange={(_, value) => handleSizeConfigChange(size, 'width', value as number)}
                  valueLabelDisplay="auto"
                  sx={{ mb: 3 }}
                />
                
                <Typography variant="body2" gutterBottom>
                  Font Size: {localPreferences.nodeSizes[size].fontSize}rem
                </Typography>
                <Slider
                  value={localPreferences.nodeSizes[size].fontSize}
                  min={0.6}
                  max={1.6}
                  step={0.1}
                  onChange={(_, value) => handleSizeConfigChange(size, 'fontSize', value as number)}
                  valueLabelDisplay="auto"
                />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      
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
