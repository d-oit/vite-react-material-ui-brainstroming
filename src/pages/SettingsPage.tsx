import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import {
  Box,
  Typography,
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
  Tab,
  Tabs,
  Tooltip,
} from '@mui/material';
import { useState, useEffect } from 'react';

import { AppShell } from '../components/Layout/AppShell';
import { ColorSchemeManager } from '../components/Settings/ColorSchemeManager';
import { LogViewer } from '../components/Settings/LogViewer';
import { NodePreferencesManager } from '../components/Settings/NodePreferencesManager';
import { SettingsExportImport } from '../components/Settings/SettingsExportImport';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { ThemeMode } from '../types';
import type { UserPreferences } from '../types';
import { validateApiEndpoint, validateS3Endpoint, sanitizeUrl } from '../utils/urlValidation';

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
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
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning'>(
    'success'
  );

  // API configuration with validation
  const [s3Endpoint, setS3Endpoint] = useState(settings.awsBucketName || '');
  const [s3EndpointError, setS3EndpointError] = useState('');
  const [s3EndpointWarning, setS3EndpointWarning] = useState('');

  const [openRouterApiUrl, setOpenRouterApiUrl] = useState(settings.openRouterApiKey || '');
  const [openRouterApiUrlError, setOpenRouterApiUrlError] = useState('');

  const [tabValue, setTabValue] = useState(0);

  // Accordion expanded state
  const [expanded, setExpanded] = useState<AccordionState>(() => {
    const savedState = localStorage.getItem('settings_accordion_state');
    return savedState ? JSON.parse(savedState) : { appearance: true, behavior: false, api: false };
  });

  // Save accordion state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('settings_accordion_state', JSON.stringify(expanded));
  }, [expanded]);

  const handleAccordionChange =
    (panel: keyof AccordionState) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
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

  const handleSwitchChange =
    (name: keyof Pick<UserPreferences, 'autoSave' | 'autoBackup'>) =>
    (event: React.ChangeEvent<HTMLInputElement>) => {
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

  // Validate S3 endpoint when it changes
  const validateS3 = (url: string) => {
    const result = validateS3Endpoint(url);
    setS3EndpointError(result.isValid ? '' : result.message);
    setS3EndpointWarning(result.isValid && result.message ? result.message : '');
    return result.isValid;
  };

  // Validate OpenRouter API URL when it changes
  const validateOpenRouterApi = (url: string) => {
    const result = validateApiEndpoint(url);
    setOpenRouterApiUrlError(result.isValid ? '' : result.message);
    return result.isValid;
  };

  // Handle S3 endpoint change
  const handleS3EndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setS3Endpoint(value);
    validateS3(value);
  };

  // Handle OpenRouter API URL change
  const handleOpenRouterApiUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOpenRouterApiUrl(value);
    validateOpenRouterApi(value);
  };

  const handleSaveSettings = () => {
    // Validate URLs before saving
    const isS3Valid = validateS3(s3Endpoint);
    const isOpenRouterValid = validateOpenRouterApi(openRouterApiUrl);

    if (!isOpenRouterValid) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please fix the OpenRouter API URL errors before saving.');
      setSnackbarOpen(true);
      return;
    }

    // S3 is optional, so we can save even if it's invalid, but we'll sanitize it
    const sanitizedS3Endpoint = isS3Valid ? sanitizeUrl(s3Endpoint) : '';

    // Update all settings at once
    updateSettings({
      themeMode: preferences.themeMode,
      autoSave: preferences.autoSave,
      autoBackup: preferences.autoBackup,
      fontSize: preferences.fontSize,
      language: preferences.language,
      awsBucketName: sanitizedS3Endpoint,
      openRouterApiKey: sanitizeUrl(openRouterApiUrl),
    });

    // Show success message
    setSnackbarSeverity('success');
    setSnackbarMessage('Settings saved successfully!');
    setSnackbarOpen(true);
  };

  const theme = useTheme();
  const { t } = useI18n();

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <AppShell
      title={t('settings.title')}
      onThemeToggle={onThemeToggle || (() => {})}
      isDarkMode={isDarkMode || theme.palette.mode === 'dark'}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 4,
          height: '100%',
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor:
              theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
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

        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="settings tabs"
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab label="General" id="settings-tab-0" aria-controls="settings-tabpanel-0" />
              <Tab
                label="Node Appearance"
                id="settings-tab-1"
                aria-controls="settings-tabpanel-1"
              />
              <Tab label="Node Size" id="settings-tab-2" aria-controls="settings-tabpanel-2" />
              <Tab label="Export/Import" id="settings-tab-3" aria-controls="settings-tabpanel-3" />
              <Tab label="Logs" id="settings-tab-4" aria-controls="settings-tabpanel-4" />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
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
                    onChange={handleS3EndpointChange}
                    margin="normal"
                    helperText={
                      s3EndpointError ||
                      s3EndpointWarning ||
                      'Used for project backups and sync (optional)'
                    }
                    error={!!s3EndpointError}
                    InputProps={{
                      endAdornment: s3EndpointWarning ? (
                        <Tooltip title={s3EndpointWarning}>
                          <InfoIcon color="warning" fontSize="small" />
                        </Tooltip>
                      ) : null,
                    }}
                  />

                  <TextField
                    fullWidth
                    label="OpenRouter API URL"
                    value={openRouterApiUrl}
                    onChange={handleOpenRouterApiUrlChange}
                    margin="normal"
                    helperText={openRouterApiUrlError || 'Used for the AI assistant'}
                    error={!!openRouterApiUrlError}
                    required
                  />
                </AccordionDetails>
              </Accordion>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button variant="contained" color="primary" onClick={handleSaveSettings}>
                Save Settings
              </Button>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ColorSchemeManager />
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <NodePreferencesManager />
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <SettingsExportImport />
          </TabPanel>

          <TabPanel value={tabValue} index={4}>
            <LogViewer />
          </TabPanel>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Container>
    </AppShell>
  );
};
