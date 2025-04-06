import {
  WifiOff as OfflineIcon,
  Wifi as WifiIcon,
  SignalCellular4Bar as CellularIcon,
  SignalCellular0Bar as WeakSignalIcon,
  SignalCellular1Bar as LowSignalIcon,
  SignalCellular2Bar as MediumSignalIcon,
  SignalCellular3Bar as GoodSignalIcon,
  DataSaverOn as DataSaverIcon,
  Warning as WarningIcon,
  CheckCircle as ReliableIcon,
  AccessTime as TimeIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  // useTheme, // Unused for now
  IconButton,
  Tooltip,
  Alert,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import type { NetworkStatus } from '../../services/OfflineService';
import offlineService from '../../services/OfflineService';

interface NetworkInfoDialogProps {
  open: boolean;
  onClose: () => void;
}

export const NetworkInfoDialog: React.FC<NetworkInfoDialogProps> = ({ open, onClose }) => {
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>(
    offlineService.getNetworkStatus()
  );

  // Monitor online status
  useEffect(() => {
    const removeStatusListener = offlineService.addOnlineStatusListener(online => {
      setIsOnline(online);
    });

    // Monitor network status changes
    const removeNetworkStatusListener = offlineService.addNetworkStatusListener(status => {
      setNetworkStatus(status);
      setIsOnline(status.online);
    });

    return () => {
      removeStatusListener();
      removeNetworkStatusListener();
    };
  }, []);

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
        return networkStatus.type && networkStatus.type === 'wifi' ? (
          <WifiIcon />
        ) : (
          <CellularIcon />
        );
    }
  };

  // Get connection type label
  const getConnectionTypeLabel = () => {
    if (!isOnline) return 'Offline';

    const connectionType =
      !networkStatus.type || networkStatus.type === 'unknown' ? '' : networkStatus.type;
    const effectiveType =
      !networkStatus.effectiveType || networkStatus.effectiveType === 'unknown'
        ? ''
        : networkStatus.effectiveType;

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
        return networkStatus.type && networkStatus.type === 'wifi' ? (
          <WifiIcon />
        ) : (
          <CellularIcon />
        );
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

  // Format timestamp to readable time
  const formatLastChecked = () => {
    if (!networkStatus.lastChecked) return 'Unknown';

    const date = new Date(networkStatus.lastChecked);
    return date.toLocaleTimeString();
  };

  // Check if connection was checked recently (within last 2 minutes)
  const isRecentCheck = () => {
    if (!networkStatus.lastChecked) return false;

    const now = Date.now();
    const twoMinutesAgo = now - 2 * 60 * 1000;
    return networkStatus.lastChecked > twoMinutesAgo;
  };

  // Handle manual refresh of network status
  const handleRefresh = async () => {
    try {
      await offlineService.checkNetworkStatus();
    } catch (error) {
      console.error('Failed to check network status:', error);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Network Status</Typography>
          <Tooltip title="Refresh network status">
            <IconButton onClick={handleRefresh} size="small">
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </DialogTitle>
      <DialogContent>
        {/* Connection status summary */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Box sx={{ mr: 2 }}>{getConnectionQualityIcon()}</Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="h6">{isOnline ? 'Connected' : 'Offline'}</Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
              {isOnline && (
                <Chip
                  size="small"
                  label={getConnectionTypeLabel()}
                  color={getConnectionQualityColor()}
                />
              )}

              {networkStatus.isReliable !== undefined && (
                <Chip
                  size="small"
                  icon={
                    networkStatus.isReliable ? (
                      <ReliableIcon fontSize="small" />
                    ) : (
                      <WarningIcon fontSize="small" />
                    )
                  }
                  label={networkStatus.isReliable ? 'Reliable' : 'Unreliable'}
                  color={networkStatus.isReliable ? 'success' : 'warning'}
                />
              )}

              {networkStatus.isMetered && (
                <Chip
                  size="small"
                  icon={<DataSaverIcon fontSize="small" />}
                  label="Metered"
                  color="warning"
                />
              )}
            </Box>
          </Box>
        </Box>

        {/* Last checked time */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TimeIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />
          <Typography variant="body2" color="text.secondary">
            Last checked: {formatLastChecked()}
            {!isRecentCheck() && (
              <Typography component="span" color="warning.main" sx={{ ml: 1 }}>
                (outdated)
              </Typography>
            )}
          </Typography>
        </Box>

        {/* Warning for unreliable connection */}
        {isOnline && !networkStatus.isReliable && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your connection appears to be unreliable. Some features may not work properly.
          </Alert>
        )}

        <Divider sx={{ my: 2 }} />

        <List dense>
          <ListItem>
            <ListItemIcon>
              {networkStatus.type && networkStatus.type === 'wifi' ? (
                <WifiIcon fontSize="small" />
              ) : (
                <CellularIcon fontSize="small" />
              )}
            </ListItemIcon>
            <ListItemText
              primary="Connection Type"
              secondary={
                networkStatus.type && networkStatus.type !== 'unknown'
                  ? networkStatus.type.toUpperCase()
                  : 'Unknown'
              }
            />
          </ListItem>

          <ListItem>
            <ListItemIcon>{getSignalStrengthIcon()}</ListItemIcon>
            <ListItemText
              primary="Connection Quality"
              secondary={
                networkStatus.effectiveType && networkStatus.effectiveType !== 'unknown'
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
                secondary={
                  networkStatus.rtt < 50
                    ? 'Low latency'
                    : networkStatus.rtt < 100
                      ? 'Medium latency'
                      : 'High latency'
                }
              />
            </ListItem>
          )}

          {networkStatus.saveData !== undefined && (
            <ListItem>
              <ListItemIcon>
                <DataSaverIcon color={networkStatus.saveData ? 'warning' : 'success'} />
              </ListItemIcon>
              <ListItemText
                primary="Data Saver"
                secondary={
                  networkStatus.saveData
                    ? 'Data saving mode is enabled'
                    : 'Data saving mode is disabled'
                }
              />
            </ListItem>
          )}

          {/* Pending operations */}
          <ListItem>
            <ListItemIcon>
              <Chip
                size="small"
                label={offlineService.getPendingOperationsCount()}
                color={offlineService.getPendingOperationsCount() > 0 ? 'warning' : 'success'}
              />
            </ListItemIcon>
            <ListItemText
              primary="Pending Operations"
              secondary={
                offlineService.getPendingOperationsCount() > 0
                  ? 'Operations waiting to be synchronized'
                  : 'All operations synchronized'
              }
            />
          </ListItem>
        </List>
      </DialogContent>
      <DialogActions>
        {offlineService.getPendingOperationsCount() > 0 && isOnline && (
          <Button onClick={() => offlineService.processSyncQueue()} color="primary">
            Sync Now
          </Button>
        )}
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NetworkInfoDialog;
