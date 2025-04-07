import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import { Snackbar, Alert, Fade, CircularProgress, Box, Typography, useTheme } from '@mui/material';
import type { AlertProps } from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import React, { useState, useEffect } from 'react';

// Action feedback types
export type ActionFeedbackType = 'success' | 'error' | 'info' | 'warning' | 'loading';

interface ActionFeedbackProps {
  message: string;
  type: ActionFeedbackType;
  open: boolean;
  onClose?: () => void;
  autoHideDuration?: number;
  position?: {
    vertical: 'top' | 'bottom';
    horizontal: 'left' | 'center' | 'right';
  };
  showProgress?: boolean;
  progressValue?: number;
  variant?: AlertProps['variant'];
}

/**
 * ActionFeedback component for providing visual feedback for user actions
 */
const ActionFeedback: React.FC<ActionFeedbackProps> = ({
  message,
  type,
  open,
  onClose,
  autoHideDuration = 4000,
  position = { vertical: 'bottom', horizontal: 'center' },
  showProgress = false,
  progressValue = 0,
  variant = 'filled',
}) => {
  const theme = useTheme();
  const [progress, setProgress] = useState(progressValue);

  // Update progress when progressValue changes
  useEffect(() => {
    setProgress(progressValue);
  }, [progressValue]);

  // Auto-increment progress for loading type
  useEffect(() => {
    let timer: number;

    if (open && type === 'loading' && !progressValue && progress < 95) {
      timer = window.setTimeout(() => {
        // Slow down as we approach 100%
        const increment = progress < 30 ? 5 : progress < 60 ? 3 : progress < 80 ? 1 : 0.5;
        setProgress(prev => Math.min(prev + increment, 95));
      }, 300);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [open, type, progress, progressValue]);

  // Reset progress when closed
  useEffect(() => {
    if (!open) {
      const timer = window.setTimeout(() => {
        setProgress(0);
      }, 300);

      return () => {
        clearTimeout(timer);
      };
    }
  }, [open]);

  // Get icon based on type
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon />;
      case 'error':
        return <ErrorIcon />;
      case 'info':
        return <InfoIcon />;
      case 'warning':
        return <WarningIcon />;
      case 'loading':
        return <CircularProgress size={24} color="inherit" />;
      default:
        return null;
    }
  };

  // Get color based on type
  const getColor = (): AlertProps['severity'] => {
    switch (type) {
      case 'success':
        return 'success';
      case 'error':
        return 'error';
      case 'info':
      case 'loading':
        return 'info';
      case 'warning':
        return 'warning';
      default:
        return 'info';
    }
  };

  // Loading indicator component
  const LoadingIndicator = () => (
    <Box sx={{ width: '100%', mt: 1 }}>
      <Box
        sx={{
          height: 4,
          width: '100%',
          backgroundColor: theme.palette.grey[300],
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          component={motion.div}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
          sx={{
            height: '100%',
            backgroundColor: theme.palette.primary.main,
            borderRadius: 2,
            position: 'absolute',
            top: 0,
            left: 0,
          }}
        />
      </Box>
      {progress > 0 && (
        <Typography variant="caption" sx={{ mt: 0.5, display: 'block', textAlign: 'right' }}>
          {Math.round(progress)}%
        </Typography>
      )}
    </Box>
  );

  return (
    <Snackbar
      open={open}
      autoHideDuration={type !== 'loading' ? autoHideDuration : null}
      onClose={onClose}
      anchorOrigin={position}
      TransitionComponent={Fade}
    >
      <Alert
        severity={getColor()}
        variant={variant}
        icon={getIcon()}
        onClose={onClose}
        sx={{
          width: '100%',
          minWidth: 250,
          alignItems: 'flex-start',
        }}
      >
        <Box>
          {message}
          <AnimatePresence>
            {(type === 'loading' || showProgress) && (
              <Box
                component={motion.div}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <LoadingIndicator />
              </Box>
            )}
          </AnimatePresence>
        </Box>
      </Alert>
    </Snackbar>
  );
};

export default ActionFeedback;
