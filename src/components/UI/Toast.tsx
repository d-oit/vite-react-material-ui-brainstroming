import type { AlertProps } from '@mui/material';
import { Snackbar, Alert } from '@mui/material';
import React, { useState, useEffect } from 'react';

interface ToastProps {
  open: boolean;
  message: string;
  severity?: AlertProps['severity'];
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({
  open,
  message,
  severity = 'success',
  duration = 3000,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(open);

  useEffect(() => {
    setIsOpen(open);
  }, [open]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setIsOpen(false);
    onClose();
  };

  return (
    <Snackbar
      open={isOpen}
      autoHideDuration={duration}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{
        '& .MuiAlert-root': {
          width: '100%',
          boxShadow: theme => theme.shadows[3],
        },
      }}
    >
      <Alert
        onClose={handleClose}
        severity={severity}
        variant="filled"
        sx={{
          width: '100%',
          opacity: 0.9,
          '&:hover': {
            opacity: 1,
          },
          transition: 'opacity 0.2s ease-in-out',
        }}
      >
        {message}
      </Alert>
    </Snackbar>
  );
};

export default Toast;
