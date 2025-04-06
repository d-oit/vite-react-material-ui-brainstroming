import { useState, useRef } from 'react';
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
} from '@mui/material';
import {
  FileDownload as DownloadIcon,
  FileUpload as UploadIcon,
} from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';

export const SettingsExportImport = () => {
  const { exportSettings, importSettings } = useSettings();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info';
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
    } catch (error) {
      console.error('Failed to export settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to export settings',
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
    reader.onload = (e) => {
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
  
  const processImport = async (content: string) => {
    try {
      setLoading(true);
      const success = await importSettings(content);
      
      if (success) {
        setSnackbar({
          open: true,
          message: 'Settings imported successfully',
          severity: 'success',
        });
      } else {
        setSnackbar({
          open: true,
          message: 'Failed to import settings: Invalid format',
          severity: 'error',
        });
      }
    } catch (error) {
      console.error('Failed to import settings:', error);
      setSnackbar({
        open: true,
        message: 'Failed to import settings: ' + (error instanceof Error ? error.message : 'Unknown error'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
      setConfirmDialog({ ...confirmDialog, open: false });
    }
  };
  
  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        Export and Import Settings
      </Typography>
      
      <Divider sx={{ mb: 3 }} />
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="subtitle1" gutterBottom>
            Export Settings
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            Export all your settings, color schemes, and node preferences to a JSON file.
            You can use this file to backup your settings or transfer them to another device.
          </Typography>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={loading}
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
            Import settings from a previously exported JSON file.
            This will replace your current settings, color schemes, and node preferences.
          </Typography>
          <Button
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={handleImportClick}
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : 'Import Settings'}
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".json"
            onChange={handleFileSelected}
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
