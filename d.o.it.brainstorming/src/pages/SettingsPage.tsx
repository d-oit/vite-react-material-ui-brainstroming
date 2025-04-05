import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  Switch,
  Select,
  MenuItem,
  InputLabel,
  Slider,
  Button,
  Alert,
  Snackbar,
  TextField,
} from '@mui/material';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useThemeMode } from '@/hooks/useThemeMode';
import { ThemeMode, UserPreferences } from '@/types';

// Default user preferences
const defaultPreferences: UserPreferences = {
  themeMode: ThemeMode.SYSTEM,
  autoSave: true,
  autoBackup: false,
  fontSize: 14,
  language: 'en',
};

export const SettingsPage = () => {
  const { themeMode, setThemeMode } = useThemeMode();
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // In a real app, you would load this from localStorage or a backend
    return defaultPreferences;
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [s3Endpoint, setS3Endpoint] = useState(import.meta.env.VITE_S3_ENDPOINT || '');
  const [openRouterApiUrl, setOpenRouterApiUrl] = useState(import.meta.env.VITE_OPENROUTER_API_URL || '');

  const handleThemeModeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newMode = event.target.value as ThemeMode;
    setThemeMode(newMode);
    setPreferences({ ...preferences, themeMode: newMode });
  };

  const handleSwitchChange = (name: keyof Pick<UserPreferences, 'autoSave' | 'autoBackup'>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setPreferences({ ...preferences, [name]: event.target.checked });
  };

  const handleFontSizeChange = (_event: Event, newValue: number | number[]) => {
    setPreferences({ ...preferences, fontSize: newValue as number });
  };

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setPreferences({ ...preferences, language: event.target.value as string });
  };

  const handleSaveSettings = () => {
    // In a real app, you would save this to localStorage or a backend
    console.log('Saving settings:', preferences);
    console.log('S3 Endpoint:', s3Endpoint);
    console.log('OpenRouter API URL:', openRouterApiUrl);
    
    // Show success message
    setSnackbarOpen(true);
  };

  return (
    <MainLayout title="Settings">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Customize your brainstorming experience
        </Typography>
      </Box>
      
      <Divider sx={{ mb: 3 }} />
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Appearance
          </Typography>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="theme-mode-label">Theme Mode</InputLabel>
            <Select
              labelId="theme-mode-label"
              value={themeMode}
              label="Theme Mode"
              onChange={handleThemeModeChange}
            >
              <MenuItem value={ThemeMode.LIGHT}>Light</MenuItem>
              <MenuItem value={ThemeMode.DARK}>Dark</MenuItem>
              <MenuItem value={ThemeMode.SYSTEM}>System</MenuItem>
            </Select>
          </FormControl>
          
          <Box sx={{ mb: 2 }}>
            <Typography id="font-size-slider" gutterBottom>
              Font Size: {preferences.fontSize}px
            </Typography>
            <Slider
              value={preferences.fontSize}
              onChange={handleFontSizeChange}
              aria-labelledby="font-size-slider"
              valueLabelDisplay="auto"
              step={1}
              marks
              min={12}
              max={20}
            />
          </Box>
          
          <FormControl fullWidth>
            <InputLabel id="language-label">Language</InputLabel>
            <Select
              labelId="language-label"
              value={preferences.language}
              label="Language"
              onChange={handleLanguageChange}
            >
              <MenuItem value="en">English</MenuItem>
              <MenuItem value="de">German</MenuItem>
              <MenuItem value="fr">French</MenuItem>
              <MenuItem value="es">Spanish</MenuItem>
            </Select>
          </FormControl>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Behavior
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoSave}
                  onChange={handleSwitchChange('autoSave')}
                />
              }
              label="Auto-save projects (every 5 seconds)"
            />
            
            <FormControlLabel
              control={
                <Switch
                  checked={preferences.autoBackup}
                  onChange={handleSwitchChange('autoBackup')}
                />
              }
              label="Auto-backup to cloud"
            />
          </FormGroup>
        </Paper>
        
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            API Configuration
          </Typography>
          
          <TextField
            fullWidth
            label="AWS S3 Endpoint"
            value={s3Endpoint}
            onChange={(e) => setS3Endpoint(e.target.value)}
            margin="normal"
            helperText="Used for project backups and sync"
          />
          
          <TextField
            fullWidth
            label="OpenRouter API URL"
            value={openRouterApiUrl}
            onChange={(e) => setOpenRouterApiUrl(e.target.value)}
            margin="normal"
            helperText="Used for the AI assistant"
          />
        </Paper>
        
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>
      </Box>
      
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: '100%' }}
        >
          Settings saved successfully!
        </Alert>
      </Snackbar>
    </MainLayout>
  );
};
