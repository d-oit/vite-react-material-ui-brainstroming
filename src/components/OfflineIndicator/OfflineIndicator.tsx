import { useState, useEffect } from 'react';
import {
  Box,
  Snackbar,
  Alert,
  Badge,
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  useTheme,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Sync as SyncIcon,
  CloudDone as CloudDoneIcon,
} from '@mui/icons-material';
import offlineService from '../../services/OfflineService';

interface OfflineIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  showSnackbar?: boolean;
}

export const OfflineIndicator = ({
  position = 'bottom-right',
  showSnackbar = true,
}: OfflineIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
  const [pendingOperations, setPendingOperations] = useState(
    offlineService.getPendingOperationsCount()
  );
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [syncInProgress, setSyncInProgress] = useState(false);
  const theme = useTheme();

  // Position styles
  const getPositionStyles = () => {
    switch (position) {
      case 'top-right':
        return { top: 16, right: 16 };
      case 'bottom-left':
        return { bottom: 16, left: 16 };
      case 'top-left':
        return { top: 16, left: 16 };
      case 'bottom-right':
      default:
        return { bottom: 16, right: 16 };
    }
  };

  // Monitor online status and pending operations
  useEffect(() => {
    const removeStatusListener = offlineService.addOnlineStatusListener(online => {
      setIsOnline(online);

      // Show snackbar when status changes
      if (showSnackbar) {
        setSnackbarMessage(online ? 'You are back online' : 'You are offline');
        setSnackbarOpen(true);
      }
    });

    // Check pending operations periodically
    const intervalId = setInterval(() => {
      setPendingOperations(offlineService.getPendingOperationsCount());
    }, 2000);

    return () => {
      removeStatusListener();
      clearInterval(intervalId);
    };
  }, [showSnackbar]);

  // Handle sync button click
  const handleSyncClick = async () => {
    if (pendingOperations === 0 || !isOnline) return;

    setSyncInProgress(true);
    try {
      await offlineService.processSyncQueue();
      setPendingOperations(offlineService.getPendingOperationsCount());
      setSnackbarMessage('Synchronization completed');
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Sync error:', error);
      setSnackbarMessage('Synchronization failed');
      setSnackbarOpen(true);
    } finally {
      setSyncInProgress(false);
      setSyncDialogOpen(false);
    }
  };

  // Render nothing if online and no pending operations
  if (isOnline && pendingOperations === 0) {
    return null;
  }

  return (
    <>
      <Box
        sx={{
          position: 'fixed',
          ...getPositionStyles(),
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 1,
        }}
      >
        {!isOnline && (
          <Tooltip title="You are offline">
            <IconButton
              color="warning"
              sx={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                '&:hover': {
                  backgroundColor: theme.palette.background.default,
                },
              }}
            >
              <OfflineIcon />
            </IconButton>
          </Tooltip>
        )}

        {isOnline && pendingOperations > 0 && (
          <Tooltip title={`${pendingOperations} operations pending synchronization`}>
            <IconButton
              color="info"
              onClick={() => setSyncDialogOpen(true)}
              sx={{
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.shadows[3],
                '&:hover': {
                  backgroundColor: theme.palette.background.default,
                },
              }}
            >
              <Badge badgeContent={pendingOperations} color="error">
                <SyncIcon />
              </Badge>
            </IconButton>
          </Tooltip>
        )}
      </Box>

      {/* Sync Dialog */}
      <Dialog open={syncDialogOpen} onClose={() => setSyncDialogOpen(false)}>
        <DialogTitle>Pending Synchronization</DialogTitle>
        <DialogContent>
          <Typography>
            You have {pendingOperations} operation{pendingOperations !== 1 ? 's' : ''} waiting to be
            synchronized.
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            These operations will be automatically synchronized in the background, but you can also
            synchronize them manually.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSyncDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSyncClick}
            variant="contained"
            disabled={syncInProgress}
            startIcon={syncInProgress ? <CircularProgress size={20} /> : <SyncIcon />}
          >
            {syncInProgress ? 'Synchronizing...' : 'Sync Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Status Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity={isOnline ? 'success' : 'warning'}
          icon={isOnline ? <CloudDoneIcon /> : <OfflineIcon />}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default OfflineIndicator;
