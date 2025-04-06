import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Tooltip,
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

interface NetworkStatusIconProps {
  onClick?: () => void;
  showTooltip?: boolean;
}

export const NetworkStatusIcon: React.FC<NetworkStatusIconProps> = ({
  onClick,
  showTooltip = true,
}) => {
  const theme = useTheme();
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
        return networkStatus.type && networkStatus.type === 'wifi' ? <WifiIcon /> : <CellularIcon />;
    }
  };

  // Get connection type label
  const getConnectionTypeLabel = () => {
    if (!isOnline) return 'Offline';

    const connectionType = !networkStatus.type || networkStatus.type === 'unknown' ? '' : networkStatus.type;
    const effectiveType =
      !networkStatus.effectiveType || networkStatus.effectiveType === 'unknown' ? '' : networkStatus.effectiveType;

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

  const icon = (
    <IconButton
      color="inherit"
      onClick={onClick}
      size="small"
    >
      {getConnectionQualityIcon()}
    </IconButton>
  );

  if (showTooltip) {
    return (
      <Tooltip title={`Network: ${getConnectionTypeLabel()}`}>
        {icon}
      </Tooltip>
    );
  }

  return icon;
};

export default NetworkStatusIcon;
