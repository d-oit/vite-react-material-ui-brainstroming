import {
  WifiOff as OfflineIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Sync as SyncIcon,
  Add as AddIcon,
  Storage as StorageIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  Button,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
} from '@mui/material';
import React from 'react';

import offlineService from '../../services/OfflineService';

interface OfflineFallbackProps {
  onRetry?: () => void;
  message?: string;
  showActions?: boolean;
}

/**
 * A fallback UI component to display when the application is offline
 */
export const OfflineFallback: React.FC<OfflineFallbackProps> = ({
  onRetry,
  message = 'You are currently offline',
  showActions = true,
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        textAlign: 'center',
        height: '100%',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          borderRadius: 2,
          maxWidth: 600,
          width: '100%',
          backgroundColor:
            theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 3,
          }}
        >
          <OfflineIcon
            sx={{
              fontSize: 64,
              color: theme.palette.warning.main,
              mb: 2,
            }}
          />
          <Typography variant="h5" gutterBottom>
            {message}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Don&apos;t worry - d.o.it.brainstorming works offline, and you can still access your
            previously loaded projects.
          </Typography>
        </Box>

        {showActions && (
          <>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1" gutterBottom>
              While offline, you can still:
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EditIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Edit existing brainstorming projects" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <AddIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Create new nodes and connections" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SaveIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Save changes locally" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <StorageIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Create new projects (they'll sync when you're back online)" />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <SyncIcon color="primary" />
                </ListItemIcon>
                <ListItemText primary="Changes will automatically sync when you're back online" />
              </ListItem>
            </List>
          </>
        )}

        {onRetry && (
          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={onRetry}
              startIcon={<SyncIcon />}
              disabled={!offlineService.getOnlineStatus()}
            >
              Try Again
            </Button>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default OfflineFallback;
