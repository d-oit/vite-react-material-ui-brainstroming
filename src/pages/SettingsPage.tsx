import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Typography,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
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

import LanguageSelector from '../components/I18n/LanguageSelector';
import AppShell from '../components/Layout/AppShell';
import { ColorSchemeManager } from '../components/Settings/ColorSchemeManager';
import { LogViewer } from '../components/Settings/LogViewer';
import { NodePreferencesManager } from '../components/Settings/NodePreferencesManager';
import { SettingsExportImport } from '../components/Settings/SettingsExportImport';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { ThemeMode } from '../types';
import type { UserPreferences } from '../types';
import {
  validateApiEndpoint as _validateApiEndpoint,
  validateS3Endpoint,
  sanitizeUrl,
  validateOpenRouterApiKey,
  validateAwsCredentials,
} from '../utils/urlValidation';

// Default user preferences
interface ExtendedUserPreferences extends UserPreferences {
  themeMode: ThemeMode;
  fontSize: number;
  language: string;
  skipDeleteConfirmation?: boolean;
}

const _defaultPreferences: ExtendedUserPreferences = {
  themeMode: ThemeMode.SYSTEM,
  autoSave: true,
  autoBackup: false,
  fontSize: 14,
  language: 'en',
  skipDeleteConfirmation: false,
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

const SettingsPage = ({ onThemeToggle, isDarkMode }: SettingsPageProps) => {
  // Get application version from environment
  const appVersion = import.meta.env.VITE_PROJECT_VERSION || '0.1.0';
  const { settings, updateSettings } = useSettings();
  const [preferences, setPreferences] = useState<ExtendedUserPreferences>(() => {
    // Use settings from the context
    return {
      themeMode: settings.themeMode,
      autoSave: settings.autoSave,
      autoBackup: settings.autoBackup,
      fontSize: settings.fontSize,
      language: settings.language,
      skipDeleteConfirmation: settings.skipDeleteConfirmation || false,
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

  // AWS credentials
  const [awsAccessKeyId, setAwsAccessKeyId] = useState(settings.awsAccessKeyId || '');
  const [awsAccessKeyIdError, setAwsAccessKeyIdError] = useState('');
  const [awsSecretAccessKey, setAwsSecretAccessKey] = useState(settings.awsSecretAccessKey || '');
  const [awsSecretAccessKeyError, setAwsSecretAccessKeyError] = useState('');
  const [awsRegion, setAwsRegion] = useState(settings.awsRegion || 'us-east-1');

  // OpenRouter API
  const [openRouterApiKey, setOpenRouterApiKey] = useState(settings.openRouterApiKey || '');
  const [openRouterApiKeyError, setOpenRouterApiKeyError] = useState('');
  const [openRouterModel, setOpenRouterModel] = useState(
    settings.openRouterModel || 'anthropic/claude-3-opus'
  );

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

  const handleThemeModeChange = (event: SelectChangeEvent<ThemeMode>) => {
    const newMode = event.target.value as ThemeMode;
    setPreferences({ ...preferences, themeMode: newMode });
    updateSettings({ themeMode: newMode });
  };

  const handleSwitchChange =
    (
      name: keyof Pick<
        ExtendedUserPreferences,
        'autoSave' | 'autoBackup' | 'skipDeleteConfirmation'
      >
    ) =>
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

  const handleLanguageChange = (event: SelectChangeEvent<string>) => {
    const language = event.target.value;
    setPreferences({ ...preferences, language });
    updateSettings({ language });
  };

  // Validate S3 endpoint when it changes
  const validateS3 = (url: string) => {
    const result = validateS3Endpoint(url, false); // Require HTTPS in production
    setS3EndpointError(result.isValid ? '' : result.message);
    setS3EndpointWarning(result.isValid && result.message ? result.message : '');
    return result.isValid;
  };

  // Validate AWS credentials
  const validateAws = (accessKeyId: string, secretAccessKey: string) => {
    const result = validateAwsCredentials(accessKeyId, secretAccessKey);
    setAwsAccessKeyIdError(
      result.isValid ? '' : result.message.includes('access key ID') ? result.message : ''
    );
    setAwsSecretAccessKeyError(
      result.isValid ? '' : result.message.includes('secret access key') ? result.message : ''
    );
    return result.isValid;
  };

  // Validate OpenRouter API key when it changes
  const validateOpenRouterApiKeyFn = (apiKey: string) => {
    const result = validateOpenRouterApiKey(apiKey);
    setOpenRouterApiKeyError(result.isValid ? '' : result.message);
    return result.isValid;
  };

  // Handle S3 endpoint change
  const handleS3EndpointChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setS3Endpoint(value);
    validateS3(value);
  };

  // Handle AWS access key ID change
  const handleAwsAccessKeyIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAwsAccessKeyId(value);
    validateAws(value, awsSecretAccessKey);
  };

  // Handle AWS secret access key change
  const handleAwsSecretAccessKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAwsSecretAccessKey(value);
    validateAws(awsAccessKeyId, value);
  };

  // Handle AWS region change
  const handleAwsRegionChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setAwsRegion(value);
  };

  // Handle OpenRouter API key change
  const handleOpenRouterApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setOpenRouterApiKey(value);
    validateOpenRouterApiKeyFn(value);
  };

  // Handle OpenRouter model change
  const handleOpenRouterModelChange = (event: SelectChangeEvent<string>) => {
    const value = event.target.value;
    setOpenRouterModel(value);
  };

  const handleSaveSettings = () => {
    // Validate all inputs before saving
    const isS3Valid = validateS3(s3Endpoint);
    const isAwsValid = validateAws(awsAccessKeyId, awsSecretAccessKey);
    const isOpenRouterApiKeyValid = validateOpenRouterApiKeyFn(openRouterApiKey);

    // Check for validation errors
    if (!isOpenRouterApiKeyValid) {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please fix the OpenRouter API key errors before saving.');
      setSnackbarOpen(true);
      return;
    }

    if (!isAwsValid && awsAccessKeyId.trim() !== '') {
      setSnackbarSeverity('error');
      setSnackbarMessage('Please fix the AWS credentials errors before saving.');
      setSnackbarOpen(true);
      return;
    }

    // S3 is optional, so we can save even if it's invalid, but we'll sanitize it
    const sanitizedS3Endpoint = isS3Valid ? sanitizeUrl(s3Endpoint) : '';

    // Sanitize inputs for security
    const sanitizedAwsAccessKeyId = awsAccessKeyId.trim();
    const sanitizedAwsSecretAccessKey = awsSecretAccessKey.trim();
    const sanitizedOpenRouterApiKey = openRouterApiKey.trim();

    // Update all settings at once
    updateSettings({
      themeMode: preferences.themeMode,
      autoSave: preferences.autoSave,
      autoBackup: preferences.autoBackup,
      fontSize: preferences.fontSize,
      language: preferences.language,
      awsBucketName: sanitizedS3Endpoint,
      awsAccessKeyId: sanitizedAwsAccessKeyId,
      awsSecretAccessKey: sanitizedAwsSecretAccessKey,
      awsRegion: awsRegion,
      openRouterApiKey: sanitizedOpenRouterApiKey,
      openRouterModel: openRouterModel,
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
        maxWidth="xl"
        sx={{
          py: 2,
          px: { xs: 0.5, sm: 1 },
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
                    <LanguageSelector
                      variant="select"
                      showFlags={true}
                      showNativeNames={true}
                      fullWidth={true}
                    />
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
                  <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
                    AWS S3 Configuration (Optional)
                  </Typography>
                  <TextField
                    fullWidth
                    label="S3 Endpoint URL"
                    value={s3Endpoint}
                    onChange={handleS3EndpointChange}
                    margin="normal"
                    helperText={
                      s3EndpointError ||
                      s3EndpointWarning ||
                      'HTTPS URL for S3 bucket (e.g., https://s3.amazonaws.com/your-bucket)'
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

                  <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                    <TextField
                      fullWidth
                      label="AWS Access Key ID"
                      value={awsAccessKeyId}
                      onChange={handleAwsAccessKeyIdChange}
                      margin="normal"
                      helperText={awsAccessKeyIdError || 'Your AWS access key ID'}
                      error={!!awsAccessKeyIdError}
                    />

                    <TextField
                      fullWidth
                      label="AWS Secret Access Key"
                      value={awsSecretAccessKey}
                      onChange={handleAwsSecretAccessKeyChange}
                      margin="normal"
                      type="password"
                      helperText={awsSecretAccessKeyError || 'Your AWS secret access key'}
                      error={!!awsSecretAccessKeyError}
                    />
                  </Box>

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="aws-region-label">AWS Region</InputLabel>
                    <Select
                      labelId="aws-region-label"
                      value={awsRegion}
                      label="AWS Region"
                      onChange={handleAwsRegionChange}
                    >
                      <MenuItem value="us-east-1">US East (N. Virginia)</MenuItem>
                      <MenuItem value="us-east-2">US East (Ohio)</MenuItem>
                      <MenuItem value="us-west-1">US West (N. California)</MenuItem>
                      <MenuItem value="us-west-2">US West (Oregon)</MenuItem>
                      <MenuItem value="eu-west-1">EU (Ireland)</MenuItem>
                      <MenuItem value="eu-central-1">EU (Frankfurt)</MenuItem>
                      <MenuItem value="ap-northeast-1">Asia Pacific (Tokyo)</MenuItem>
                      <MenuItem value="ap-southeast-1">Asia Pacific (Singapore)</MenuItem>
                    </Select>
                  </FormControl>

                  <Divider sx={{ my: 3 }} />

                  <Typography variant="subtitle1" gutterBottom>
                    OpenRouter API Configuration
                  </Typography>
                  <TextField
                    fullWidth
                    label="OpenRouter API Key"
                    value={openRouterApiKey}
                    onChange={handleOpenRouterApiKeyChange}
                    margin="normal"
                    helperText={openRouterApiKeyError || 'Your OpenRouter API key for AI assistant'}
                    error={!!openRouterApiKeyError}
                    required
                  />

                  <FormControl fullWidth margin="normal">
                    <InputLabel id="openrouter-model-label">AI Model</InputLabel>
                    <Select
                      labelId="openrouter-model-label"
                      value={openRouterModel}
                      label="AI Model"
                      onChange={handleOpenRouterModelChange}
                    >
                      <MenuItem value="anthropic/claude-3-opus">
                        Claude 3 Opus (Best quality)
                      </MenuItem>
                      <MenuItem value="anthropic/claude-3-sonnet">
                        Claude 3 Sonnet (Balanced)
                      </MenuItem>
                      <MenuItem value="anthropic/claude-3-haiku">Claude 3 Haiku (Fast)</MenuItem>
                      <MenuItem value="openai/gpt-4o">GPT-4o</MenuItem>
                      <MenuItem value="openai/gpt-4-turbo">GPT-4 Turbo</MenuItem>
                      <MenuItem value="openai/gpt-3.5-turbo">GPT-3.5 Turbo (Economical)</MenuItem>
                    </Select>
                    <FormHelperText>
                      Select the AI model to use for chat and node generation
                    </FormHelperText>
                  </FormControl>
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

        {/* Application Version Information */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', opacity: 0.7 }}>
          <Typography variant="caption" color="text.secondary">
            Application Version: v{appVersion}
          </Typography>
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

export default SettingsPage;
