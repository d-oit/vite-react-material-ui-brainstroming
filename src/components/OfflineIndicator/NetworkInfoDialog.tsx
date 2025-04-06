import React, { useState, useEffect } from 'react';
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
  useTheme,
} from '@mui/material';
import {
  WifiOff as OfflineIcon,
  Wifi as WifiIcon,
  SignalCellular4Bar as CellularIcon,
  SignalCellular0Bar as WeakSignalIcon,
  SignalCellular1Bar as LowSignalIcon,
  SignalCellular2Bar as MediumSignalIcon,
  SignalCellular3Bar as GoodSignalIcon,
} from '@mui/icons-material';
import offlineService, { NetworkStatus } from '../../services/OfflineService';

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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
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
                <Chip
                  size="small"
                  label={networkStatus.saveData ? 'Enabled' : 'Disabled'}
                  color={networkStatus.saveData ? 'warning' : 'success'}
                />
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
        </List>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default NetworkInfoDialog;
