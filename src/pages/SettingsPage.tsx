import { useState, useEffect } from 'react';
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
  Container,
  useTheme,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useSettings } from '../contexts/SettingsContext';
import { useI18n } from '../contexts/I18nContext';
import { AppShell } from '../components/Layout/AppShell';
import { ThemeMode, UserPreferences } from '../types';

// Default user preferences
const defaultPreferences: UserPreferences = {
  themeMode: ThemeMode.SYSTEM,
  autoSave: true,
  autoBackup: false,
  fontSize: 14,
  language: 'en',
};

interface SettingsPageProps {
  onThemeToggle?: () => void;
  isDarkMode?: boolean;
}

interface AccordionState {
  appearance: boolean;
  behavior: boolean;
  api: boolean;
}

export const SettingsPage = ({ onThemeToggle, isDarkMode }: SettingsPageProps) => {
  const { settings, updateSettings } = useSettings();
  const [preferences, setPreferences] = useState<UserPreferences>(() => {
    // Use settings from the context
    return {
      themeMode: settings.themeMode,
      autoSave: settings.autoSave,
      autoBackup: settings.autoBackup,
      fontSize: settings.fontSize,
      language: settings.language,
    };
  });
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [s3Endpoint, setS3Endpoint] = useState(settings.awsBucketName || '');
  const [openRouterApiUrl, setOpenRouterApiUrl] = useState(settings.openRouterApiKey || '');
  
  // Accordion expanded state
  const [expanded, setExpanded] = useState<AccordionState>(() => {
    const savedState = localStorage.getItem('settings_accordion_state');
    return savedState ? JSON.parse(savedState) : { appearance: true, behavior: false, api: false };
  });

  // Save accordion state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('settings_accordion_state', JSON.stringify(expanded));
  }, [expanded]);

  const handleAccordionChange = (panel: keyof AccordionState) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded({
      ...expanded,
      [panel]: isExpanded,
    });
  };

  const handleThemeModeChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const newMode = event.target.value as ThemeMode;
    setPreferences({ ...preferences, themeMode: newMode });
    updateSettings({ themeMode: newMode });
  };

  const handleSwitchChange = (name: keyof Pick<UserPreferences, 'autoSave' | 'autoBackup'>) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const newValue = event.target.checked;
    setPreferences({ ...preferences, [name]: newValue });
    updateSettings({ [name]: newValue });
  };

  const handleFontSizeChange = (_event: Event, newValue: number | number[]) => {
    const fontSize = newValue as number;
    setPreferences({ ...preferences, fontSize });
    updateSettings({ fontSize });
  };

  const handleLanguageChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    const language = event.target.value as string;
    setPreferences({ ...preferences, language });
    updateSettings({ language });
  };

  const handleSaveSettings = () => {
    // Update all settings at once
    updateSettings({
      themeMode: preferences.themeMode,
      autoSave: preferences.autoSave,
      autoBackup: preferences.autoBackup,
      fontSize: preferences.fontSize,
      language: preferences.language,
      awsBucketName: s3Endpoint,
      openRouterApiKey: openRouterApiUrl,
    });

    // Show success message
    setSnackbarOpen(true);
  };

  const theme = useTheme();
  const { t } = useI18n();

  return (
    <AppShell
      title={t('settings.title')}
      onThemeToggle={onThemeToggle || (() => {})}
      isDarkMode={isDarkMode || theme.palette.mode === 'dark'}
    >
      <Container 
        maxWidth="md" 
        sx={{ 
          py: 4,
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
          },
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" component="h1">
            Settings
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Customize your brainstorming experience
          </Typography>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ mb: 4 }}>
          <Accordion 
            expanded={expanded.appearance} 
            onChange={handleAccordionChange('appearance')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Appearance</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="theme-mode-label">Theme Mode</InputLabel>
                <Select
                  labelId="theme-mode-label"
                  value={preferences.themeMode}
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
            </AccordionDetails>
          </Accordion>
          
          <Accordion 
            expanded={expanded.behavior} 
            onChange={handleAccordionChange('behavior')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">Behavior</Typography>
            </AccordionSummary>
            <AccordionDetails>
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
                
                <FormControlLabel
                  control={
                    <Switch
                      checked={preferences.skipDeleteConfirmation}
                      onChange={handleSwitchChange('skipDeleteConfirmation')}
                    />
                  }
                  label="Skip delete confirmation dialogs"
                />
              </FormGroup>
            </AccordionDetails>
          </Accordion>
          
          <Accordion 
            expanded={expanded.api} 
            onChange={handleAccordionChange('api')}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h6">API Configuration</Typography>
            </AccordionSummary>
            <AccordionDetails>
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
            </AccordionDetails>
          </Accordion>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSaveSettings}
          >
            Save Settings
          </Button>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity="success">
            Settings saved successfully!
          </Alert>
        </Snackbar>
      </Container>
    </AppShell>
  );
};


