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
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Sync as SyncIcon,
  CloudDone as CloudDoneIcon,
  Wifi as WifiIcon,
  SignalCellular4Bar as CellularIcon,
  SignalCellular0Bar as WeakSignalIcon,
  SignalCellular1Bar as LowSignalIcon,
  SignalCellular2Bar as MediumSignalIcon,
  SignalCellular3Bar as GoodSignalIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import offlineService, { NetworkStatus } from '../../services/OfflineService';

interface OfflineIndicatorProps {
  position?: 'top-right' | 'bottom-right' | 'bottom-left' | 'top-left';
  showSnackbar?: boolean;
}

export const OfflineIndicator = ({
  position = 'bottom-right',
  showSnackbar = true,
}: OfflineIndicatorProps) => {
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    offlineService.getNetworkStatus()
  );
  const [pendingOperations, setPendingOperations] = useState(
    offlineService.getPendingOperationsCount()
  );
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [networkInfoDialogOpen, setNetworkInfoDialogOpen] = useState(false);
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

    // Monitor network status changes
    const removeNetworkStatusListener = offlineService.addNetworkStatusListener(status => {
      setNetworkStatus(status);
      setIsOnline(status.online);
    });

    // Check pending operations periodically
    const intervalId = setInterval(() => {
      setPendingOperations(offlineService.getPendingOperationsCount());
    }, 2000);

    return () => {
      removeStatusListener();
      removeNetworkStatusListener();
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

  // Get connection quality icon
  const getConnectionQualityIcon = () => {
    if (!isOnline) return <OfflineIcon />;

    switch (networkStatus.effectiveType) {
      case '4g':
        return <GoodSignalIcon />;
      case '3g':
        return <MediumSignalIcon />;
      case '2g':
        return <LowSignalIcon />;
      case 'slow-2g':
        return <WeakSignalIcon />;
      default:
        return networkStatus.type === 'wifi' ? <WifiIcon /> : <CellularIcon />;
    }
  };

  // Get connection type label
  const getConnectionTypeLabel = () => {
    if (!isOnline) return 'Offline';

    const connectionType = networkStatus.type === 'unknown' ? '' : networkStatus.type;
    const effectiveType =
      networkStatus.effectiveType === 'unknown' ? '' : networkStatus.effectiveType;

    if (connectionType && effectiveType) {
      return `${connectionType.toUpperCase()} (${effectiveType.toUpperCase()})`;
    } else if (connectionType) {
      return connectionType.toUpperCase();
    } else if (effectiveType) {
      return effectiveType.toUpperCase();
    } else {
      return 'Connected';
    }
  };

  // Get signal strength icon based on network status
  const getSignalStrengthIcon = () => {
    if (!isOnline) return <OfflineIcon />;

    const signalStrength = networkStatus.signalStrength || 0;

    switch (signalStrength) {
      case 1:
        return <WeakSignalIcon />;
      case 2:
        return <LowSignalIcon />;
      case 3:
        return <MediumSignalIcon />;
      case 4:
        return <GoodSignalIcon />;
      default:
        return networkStatus.type === 'wifi' ? <WifiIcon /> : <CellularIcon />;
    }
  };

  // Get connection speed label
  const getConnectionSpeedLabel = () => {
    if (!isOnline) return 'No connection';
    if (!networkStatus.downlink) return 'Unknown speed';

    const downlink = networkStatus.downlink;

    if (downlink < 0.5) return 'Very slow connection';
    if (downlink < 1) return 'Slow connection';
    if (downlink < 5) return 'Medium speed connection';
    if (downlink < 20) return 'Fast connection';
    return 'Very fast connection';
  };

  // Get connection quality color
  const getConnectionQualityColor = () => {
    if (!isOnline) return 'warning';

    switch (networkStatus.effectiveType) {
      case '4g':
        return 'success';
      case '3g':
        return 'info';
      case '2g':
        return 'warning';
      case 'slow-2g':
        return 'error';
      default:
        return 'primary';
    }
  };

  // Always show the indicator for better UX
  // if (isOnline && pendingOperations === 0) {
  //   return null;
  // }

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
        {/* Network status indicator */}
        <Tooltip title={`Network: ${getConnectionTypeLabel()}`}>
          <IconButton
            color={getConnectionQualityColor()}
            onClick={() => setNetworkInfoDialogOpen(true)}
            sx={{
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[3],
              '&:hover': {
                backgroundColor: theme.palette.background.default,
              },
            }}
          >
            {getConnectionQualityIcon()}
          </IconButton>
        </Tooltip>

        {/* Sync indicator */}
        {pendingOperations > 0 && (
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
            disabled={syncInProgress || !isOnline}
            startIcon={syncInProgress ? <CircularProgress size={20} /> : <SyncIcon />}
          >
            {syncInProgress ? 'Synchronizing...' : 'Sync Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Network Info Dialog */}
      <Dialog open={networkInfoDialogOpen} onClose={() => setNetworkInfoDialogOpen(false)}>
        <DialogTitle>Network Status</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Box sx={{ mr: 2 }}>{getConnectionQualityIcon()}</Box>
            <Box>
              <Typography variant="h6">{isOnline ? 'Connected' : 'Offline'}</Typography>
              {isOnline && (
                <Chip
                  size="small"
                  label={getConnectionTypeLabel()}
                  color={getConnectionQualityColor()}
                  sx={{ mt: 0.5 }}
                />
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <List dense>
            <ListItem>
              <ListItemIcon>
                {networkStatus.type === 'wifi' ? (
                  <WifiIcon fontSize="small" />
                ) : (
                  <CellularIcon fontSize="small" />
                )}
              </ListItemIcon>
              <ListItemText
                primary="Connection Type"
                secondary={
                  networkStatus.type !== 'unknown' ? networkStatus.type.toUpperCase() : 'Unknown'
                }
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>{getSignalStrengthIcon()}</ListItemIcon>
              <ListItemText
                primary="Connection Quality"
                secondary={
                  networkStatus.effectiveType !== 'unknown'
                    ? networkStatus.effectiveType.toUpperCase()
                    : 'Unknown'
                }
              />
            </ListItem>

            {networkStatus.downlink && (
              <ListItem>
                <ListItemIcon>
                  <Chip
                    size="small"
                    label={`${networkStatus.downlink.toFixed(1)} Mbps`}
                    color={networkStatus.downlink < 1 ? 'warning' : 'success'}
                  />
                </ListItemIcon>
                <ListItemText primary="Download Speed" secondary={getConnectionSpeedLabel()} />
              </ListItem>
            )}

            {networkStatus.rtt && (
              <ListItem>
                <ListItemIcon>
                  <Chip
                    size="small"
                    label={`${networkStatus.rtt} ms`}
                    color={networkStatus.rtt > 100 ? 'warning' : 'success'}
                  />
                </ListItemIcon>
                <ListItemText
                  primary="Latency (RTT)"
                  secondary={networkStatus.rtt > 100 ? 'High latency' : 'Good latency'}
                />
              </ListItem>
            )}

            {networkStatus.saveData && (
              <ListItem>
                <ListItemIcon>
                  <InfoIcon color="warning" fontSize="small" />
                </ListItemIcon>
                <ListItemText
                  primary="Data Saver"
                  secondary="Data saver mode is enabled on your device"
                />
              </ListItem>
            )}

            <ListItem>
              <ListItemIcon>
                <InfoIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Offline Mode"
                secondary={offlineService.isOfflineModeEnabled() ? 'Enabled' : 'Disabled'}
              />
            </ListItem>

            <ListItem>
              <ListItemIcon>
                <SyncIcon fontSize="small" color={pendingOperations > 0 ? 'warning' : 'success'} />
              </ListItemIcon>
              <ListItemText primary="Pending Operations" secondary={pendingOperations} />
            </ListItem>
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNetworkInfoDialogOpen(false)}>Close</Button>
          {pendingOperations > 0 && isOnline && (
            <Button
              onClick={() => {
                setNetworkInfoDialogOpen(false);
                setSyncDialogOpen(true);
              }}
              variant="outlined"
              startIcon={<SyncIcon />}
            >
              Manage Sync
            </Button>
          )}
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
