import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Chip,
  Tooltip,
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
  WifiOff as OfflineIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import offlineService from '../../services/OfflineService';
import loggerService from '../../services/LoggerService';

export const SettingsExportImport = () => {
  const { exportSettings, importSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  }>({
    open: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const [loading, setLoading] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } | null>(null);

  // Monitor online status
  useEffect(() => {
    const removeStatusListener = offlineService.addOnlineStatusListener(online => {
      setIsOnline(online);
    });

    return () => {
      removeStatusListener();
    };
  }, []);

  const handleExport = async () => {
    try {
      setLoading(true);
      const settingsJson = await exportSettings();

      // Create a blob and download it
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `d.o.it.brainstorming-settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSnackbar({
        open: true,
        message: 'Settings exported successfully',
        severity: 'success',
      });

      // Log the export
      loggerService.info('Settings exported successfully');
    } catch (error) {
      console.error('Failed to export settings:', error);
      loggerService.error(
        'Failed to export settings',
        error instanceof Error ? error : new Error(String(error))
      );

      setSnackbar({
        open: true,
        message:
          'Failed to export settings: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = e => {
      const content = e.target?.result as string;

      // Show confirmation dialog
      setConfirmDialog({
        open: true,
        title: 'Import Settings',
        message: 'This will replace your current settings. Are you sure you want to continue?',
        onConfirm: () => processImport(content),
      });
    };

    reader.readAsText(file);

    // Reset the input so the same file can be selected again
    event.target.value = '';
  };

  // Validate settings JSON before import
  const validateSettingsJson = (
    content: string
  ): {
    isValid: boolean;
    warnings: string[];
    errors: string[];
  } => {
    const warnings: string[] = [];
    const errors: string[] = [];
    let isValid = true;

    try {
      // Try to parse the JSON
      const data = JSON.parse(content);

      // Check if it's a valid settings object
      if (!data) {
        errors.push('Empty data');
        isValid = false;
      }

      // Check for required fields in settings format
      if (isValid) {
        // If it's the new format with metadata
        if (data.metadata) {
          if (!data.settings) {
            errors.push('Missing settings data');
            isValid = false;
          }

          // Check version compatibility
          if (data.metadata.version && data.metadata.version !== '1.0.0') {
            warnings.push(`Settings version mismatch: ${data.metadata.version}`);
          }
        }
        // If it's a direct settings object (legacy format)
        else if (!data.themeMode) {
          warnings.push('Legacy format detected, some settings may not be imported correctly');
        }
      }

      return { isValid, warnings, errors };
    } catch (error) {
      errors.push('Invalid JSON format');
      return { isValid: false, warnings, errors };
    }
  };

  const processImport = async (content: string) => {
    try {
      setLoading(true);

      // Validate the settings JSON
      const validation = validateSettingsJson(content);
      setValidationResult(validation);

      if (!validation.isValid) {
        setSnackbar({
          open: true,
          message: `Failed to import settings: ${validation.errors.join(', ')}`,
          severity: 'error',
        });
        return;
      }

      // If there are warnings, log them
      if (validation.warnings.length > 0) {
        loggerService.warn(`Settings import warnings: ${validation.warnings.join(', ')}`);
      }

      const success = await importSettings(content);

      if (success) {
        setSnackbar({
          open: true,
          message:
            'Settings imported successfully' +
            (validation.warnings.length > 0 ? ' (with warnings)' : ''),
          severity: validation.warnings.length > 0 ? 'warning' : 'success',
        });
        loggerService.info('Settings imported successfully');
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to import settings: Invalid format',
          severity: 'error',
        });
        loggerService.error('Failed to import settings: Invalid format');
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      loggerService.error(
        'Failed to import settings',
        error instanceof Error ? error : new Error(String(error))
      );

      setSnackbar({
        open: true,
        message:
          'Failed to import settings: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          Export and Import Settings
        </Typography>

        {!isOnline && (
          <Tooltip title="You are currently offline. Some functionality may be limited.">
            <Chip
              icon={<OfflineIcon />}
              label="Offline"
              color="warning"
              size="small"
              sx={{ ml: 2 }}
            />
          </Tooltip>
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      {validationResult && validationResult.warnings.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography variant="body2">
            <strong>Warning:</strong> {validationResult.warnings.join(', ')}
          </Typography>
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Export Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export all your settings, color schemes, and node preferences to a JSON file. You can
            use this file to backup your settings or transfer them to another device.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
            aria-label="Export settings to JSON file"
          >
            {loading ? <CircularProgress size={24} /> : 'Export Settings'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Import Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Import settings from a previously exported JSON file. This will replace your current
            settings, color schemes, and node preferences.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
            disabled={loading}
            aria-label="Import settings from JSON file"
          >
            {loading ? <CircularProgress size={24} /> : 'Import Settings'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            className="visually-hidden"
            accept=".json"
            onChange={handleFileSelected}
            aria-label="File input for importing settings"
            title="Select a settings JSON file to import"
          />
        </CardContent>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ ...confirmDialog, open: false })}
      >
        <DialogTitle>{confirmDialog.title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{confirmDialog.message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ ...confirmDialog, open: false })}>
            Cancel
          </Button>
          <Button onClick={confirmDialog.onConfirm} variant="contained" color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
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
