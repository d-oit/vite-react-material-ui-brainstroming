import React, { createContext, useContext, useState, ReactNode } from 'react';
import { AlertProps } from '@mui/material';
import Toast from '../components/UI/Toast';

interface ToastContextType {
  showToast: (message: string, severity?: AlertProps['severity'], duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertProps['severity']>('success');
  const [duration, setDuration] = useState(3000);

  const showToast = (
    message: string,
    severity: AlertProps['severity'] = 'success',
    duration: number = 3000
  ) => {
    setMessage(message);
    setSeverity(severity);
    setDuration(duration);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <Toast
        open={open}
        message={message}
        severity={severity}
        duration={duration}
        onClose={handleClose}
      />
    </ToastContext.Provider>
  );
};
