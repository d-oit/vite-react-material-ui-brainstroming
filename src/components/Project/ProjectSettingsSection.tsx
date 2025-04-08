import {
  // Save as SaveIcon, // Unused
  CloudUpload as CloudUploadIcon,
  CloudDownload as CloudDownloadIcon,
  Download as DownloadIcon,
  Upload as UploadIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Paper,
  Typography,
  FormControlLabel,
  Switch,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  // Divider, // Unused
  Alert,
  CircularProgress,
  Grid,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';

import { useErrorNotification } from '../../contexts/ErrorNotificationContext';
import { uploadProject, downloadProject } from '../../lib/s3Service';
import loggerService from '../../services/LoggerService';
import type { Project, SyncSettings } from '../../types';

interface ProjectSettingsSectionProps {
  project: Project;
  onSave: (project: Project) => void;
  isSaving?: boolean;
  error?: string | null;
}

export const ProjectSettingsSection = ({
  project,
  onSave,
  isSaving = false,
  error = null,
}: ProjectSettingsSectionProps) => {
  const { showError } = useErrorNotification();
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    enableS3Sync: false,
    syncFrequency: 'manual',
    intervalMinutes: 30,
  });
  const [isS3Available, setIsS3Available] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState<boolean>(false);
  const [importLoading, setImportLoading] = useState<boolean>(false);

  // Initialize sync settings from project
  useEffect(() => {
    if (
      project &&
      typeof project === 'object' &&
      project.syncSettings &&
      typeof project.syncSettings === 'object'
    ) {
      setSyncSettings(project.syncSettings);
      const lastSyncedAt = project.syncSettings.lastSyncedAt;
      if (typeof lastSyncedAt === 'string' && lastSyncedAt.length > 0) {
        setLastSyncTime(lastSyncedAt);
      }
    }

    // Check if S3 is configured
    const checkS3Config = async () => {
      try {
        // Check if AWS credentials are configured in .env
        const isConfigured = process.env.VITE_AWS_S3_BUCKET && process.env.VITE_AWS_REGION;
        setIsS3Available(!!isConfigured);
      } catch (err) {
        void loggerService.error(
          'Failed to check S3 configuration',
          err instanceof Error ? err : new Error(String(err))
        );
        setIsS3Available(false);
      }
    };

    void checkS3Config();
  }, [project]);

  // Handle sync settings change
  const handleSyncSettingsChange = useCallback(
    (settings: Partial<SyncSettings>) => {
      const updatedSettings = { ...syncSettings, ...settings };
      setSyncSettings(updatedSettings);

      // Update project with new sync settings
      const updatedProject = {
        ...project,
        syncSettings: updatedSettings,
      };

      onSave(updatedProject);
    },
    [syncSettings, project, onSave]
  );

  // Handle S3 sync toggle
  const handleS3SyncToggle = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      handleSyncSettingsChange({ enableS3Sync: event.target.checked });
    },
    [handleSyncSettingsChange]
  );

  // Handle sync frequency change
  const handleSyncFrequencyChange = useCallback(
    (event: SelectChangeEvent<string>) => {
      handleSyncSettingsChange({
        syncFrequency: event.target.value as 'manual' | 'onSave' | 'interval',
      });
    },
    [handleSyncSettingsChange]
  );

  // Handle interval minutes change
  const handleIntervalMinutesChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseInt(event.target.value, 10);
      if (typeof value === 'number' && !Number.isNaN(value) && value > 0) {
        handleSyncSettingsChange({ intervalMinutes: value });
      }
    },
    [handleSyncSettingsChange]
  );

  // Handle manual sync
  const handleManualSync = useCallback(async () => {
    if (!isS3Available) {
      showError('S3 is not configured. Please check your environment variables.');
      return;
    }

    setIsSyncing(true);
    try {
      await uploadProject(project);
      const now = new Date().toISOString();
      setLastSyncTime(now);
      handleSyncSettingsChange({ lastSyncedAt: now });
      void loggerService.info('Project synced to S3', { projectId: project.id });
    } catch (err) {
      const errorMessage = 'Failed to sync project to S3';
      void loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      showError(errorMessage);
    } finally {
      setIsSyncing(false);
    }
  }, [project, isS3Available, showError, handleSyncSettingsChange]);

  // Handle export to file
  const handleExportToFile = useCallback(() => {
    setExportLoading(true);
    try {
      // Create a JSON string from the project
      const projectJson = JSON.stringify(project, null, 2);

      // Create a blob and download link
      const blob = new Blob([projectJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);

      void loggerService.info('Project exported to file', { projectId: project.id });
    } catch (err) {
      const errorMessage = 'Failed to export project';
      void loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      showError(errorMessage);
    } finally {
      setExportLoading(false);
    }
  }, [project, showError]);

  // Handle import from file
  const handleImportFromFile = useCallback(() => {
    setImportLoading(true);
    try {
      // Create a file input element
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json';

      input.onchange = event => {
        const file = (event.target as HTMLInputElement).files?.[0];
        if (!file) {
          setImportLoading(false);
          return;
        }

        const reader = new FileReader();
        reader.onload = e => {
          try {
            const content = e.target?.result as string;
            const importedProject = JSON.parse(content) as Project;

            // Validate the imported project
            if (!importedProject.id || !importedProject.name) {
              throw new Error('Invalid project file');
            }

            // Update the current project with imported data
            // but keep the current project ID and metadata
            const updatedProject = {
              ...project,
              name: importedProject.name,
              description: importedProject.description,
              nodes: importedProject.nodes || [],
              edges: importedProject.edges || [],
              updatedAt: new Date().toISOString(),
            };

            onSave(updatedProject);
            void loggerService.info('Project imported from file', { projectId: project.id });
          } catch (err) {
            const errorMessage = 'Failed to import project: Invalid file format';
            void loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
            showError(errorMessage);
          } finally {
            setImportLoading(false);
          }
        };

        reader.onerror = () => {
          showError('Failed to read file');
          setImportLoading(false);
        };

        reader.readAsText(file);
      };

      // Trigger the file input click
      input.click();
    } catch (err) {
      const errorMessage = 'Failed to import project';
      void loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      showError(errorMessage);
      setImportLoading(false);
    }
  }, [project, onSave, showError]);

  // Handle import from S3
  const handleImportFromS3 = useCallback(async () => {
    if (!isS3Available) {
      showError('S3 is not configured. Please check your environment variables.');
      return;
    }

    setImportLoading(true);
    try {
      const importedProject = await downloadProject(project.id);
      if (
        importedProject &&
        typeof importedProject === 'object' &&
        'name' in importedProject &&
        'description' in importedProject
      ) {
        // Update the current project with imported data
        const updatedProject = {
          ...project,
          name: importedProject.name,
          description: importedProject.description,
          nodes: importedProject.nodes || [],
          edges: importedProject.edges || [],
          updatedAt: new Date().toISOString(),
          syncSettings: {
            ...syncSettings,
            lastSyncedAt: new Date().toISOString(),
          },
        };

        onSave(updatedProject);
        setLastSyncTime(updatedProject.syncSettings.lastSyncedAt);
        void loggerService.info('Project imported from S3', { projectId: project.id });
      }
    } catch (err) {
      const errorMessage = 'Failed to import project from S3';
      void loggerService.error(errorMessage, err instanceof Error ? err : new Error(String(err)));
      showError(errorMessage);
    } finally {
      setImportLoading(false);
    }
  }, [project, syncSettings, isS3Available, showError, onSave]);

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ py: 2 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          S3 Synchronization
        </Typography>

        {!isS3Available && (
          <Alert severity="info" sx={{ mb: 2 }}>
            S3 integration is not configured. To enable S3 synchronization, please set the required
            environment variables.
          </Alert>
        )}

        <FormControlLabel
          control={
            <Switch
              checked={syncSettings.enableS3Sync}
              onChange={handleS3SyncToggle}
              disabled={!isS3Available || isSaving}
            />
          }
          label="Enable S3 Synchronization"
        />

        {syncSettings.enableS3Sync && (
          <Box sx={{ mt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel id="sync-frequency-label">Sync Frequency</InputLabel>
              <Select
                labelId="sync-frequency-label"
                value={syncSettings.syncFrequency}
                label="Sync Frequency"
                onChange={handleSyncFrequencyChange}
                disabled={isSaving}
              >
                <MenuItem value="manual">Manual</MenuItem>
                <MenuItem value="onSave">On Save</MenuItem>
                <MenuItem value="interval">Interval</MenuItem>
              </Select>
            </FormControl>

            {syncSettings.syncFrequency === 'interval' && (
              <TextField
                label="Interval (minutes)"
                type="number"
                value={
                  typeof syncSettings.intervalMinutes === 'number'
                    ? syncSettings.intervalMinutes
                    : 30
                }
                onChange={handleIntervalMinutesChange}
                fullWidth
                sx={{ mb: 2 }}
                disabled={isSaving}
                InputProps={{ inputProps: { min: 1 } }}
              />
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Button
                variant="contained"
                startIcon={isSyncing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={() => void handleManualSync()}
                disabled={isSyncing || isSaving || !isS3Available}
                sx={{ mr: 2 }}
              >
                {isSyncing ? 'Syncing...' : 'Sync Now'}
              </Button>

              {lastSyncTime && (
                <Typography variant="body2" color="text.secondary">
                  Last synced: {new Date(lastSyncTime).toLocaleString()}
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Import/Export
        </Typography>

        <Grid container spacing={2}>
          <Grid lg={6} md={6} sm={12} xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Local File
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
              <Button
                variant="outlined"
                startIcon={exportLoading ? <CircularProgress size={20} /> : <DownloadIcon />}
                onClick={() => void handleExportToFile()}
                disabled={exportLoading || isSaving}
              >
                Export to File
              </Button>
              <Button
                variant="outlined"
                startIcon={importLoading ? <CircularProgress size={20} /> : <UploadIcon />}
                onClick={() => void handleImportFromFile()}
                disabled={importLoading || isSaving}
              >
                Import from File
              </Button>
            </Box>
          </Grid>

          <Grid lg={6} md={6} sm={12} xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              S3 Storage
            </Typography>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={isSyncing ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                onClick={() => void handleManualSync()}
                disabled={isSyncing || isSaving || !isS3Available}
              >
                Export to S3
              </Button>
              <Button
                variant="outlined"
                startIcon={importLoading ? <CircularProgress size={20} /> : <CloudDownloadIcon />}
                onClick={() => void handleImportFromS3()}
                disabled={importLoading || isSaving || !isS3Available}
              >
                Import from S3
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default ProjectSettingsSection;
