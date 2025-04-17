import React from 'react';
import { Box, CircularProgress, Typography, Paper, Fade } from '@mui/material';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

type StatusType = 'loading' | 'error' | 'success' | 'idle';

interface StatusIndicatorProps {
  status: StatusType;
  message?: string;
  size?: 'small' | 'medium' | 'large';
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  showBackground?: boolean;
}

const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  message,
  size = 'medium',
  position = 'top-right',
  showBackground = true,
}) => {
  if (status === 'idle') return null;

  // Size mappings
  const sizeMap = {
    small: {
      icon: 16,
      padding: 1,
      fontSize: '0.75rem',
    },
    medium: {
      icon: 24,
      padding: 1.5,
      fontSize: '0.875rem',
    },
    large: {
      icon: 32,
      padding: 2,
      fontSize: '1rem',
    },
  };

  // Position mappings
  const positionMap = {
    'top-right': {
      top: 16,
      right: 16,
    },
    'top-left': {
      top: 16,
      left: 16,
    },
    'bottom-right': {
      bottom: 16,
      right: 16,
    },
    'bottom-left': {
      bottom: 16,
      left: 16,
    },
    'center': {
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    },
  };

  // Status icon and color
  const statusConfig = {
    loading: {
      icon: <CircularProgress size={sizeMap[size].icon} color="primary" />,
      color: 'primary.main',
    },
    error: {
      icon: <ErrorIcon sx={{ fontSize: sizeMap[size].icon, color: 'error.main' }} />,
      color: 'error.main',
    },
    success: {
      icon: <CheckCircleIcon sx={{ fontSize: sizeMap[size].icon, color: 'success.main' }} />,
      color: 'success.main',
    },
  };

  return (
    <Fade in={status !== 'idle'} timeout={300}>
      <Box
        sx={{
          position: 'absolute',
          zIndex: 1000,
          ...positionMap[position],
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease-in-out',
        }}
      >
        {showBackground ? (
          <Paper
            elevation={3}
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: sizeMap[size].padding,
              borderRadius: 2,
              backgroundColor: 'background.paper',
              opacity: 0.9,
              '&:hover': {
                opacity: 1,
              },
            }}
          >
            {statusConfig[status].icon}
            {message && (
              <Typography
                variant="body2"
                sx={{
                  ml: 1,
                  fontSize: sizeMap[size].fontSize,
                  color: statusConfig[status].color,
                }}
              >
                {message}
              </Typography>
            )}
          </Paper>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {statusConfig[status].icon}
            {message && (
              <Typography
                variant="body2"
                sx={{
                  ml: 1,
                  fontSize: sizeMap[size].fontSize,
                  color: statusConfig[status].color,
                }}
              >
                {message}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Fade>
  );
};

export default StatusIndicator;
