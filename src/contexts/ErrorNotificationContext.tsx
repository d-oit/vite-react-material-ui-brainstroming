import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Alert, Snackbar } from '@mui/material';
import { useI18n } from './I18nContext';

interface ErrorNotificationContextType {
  showError: (message: string) => void;
  clearError: () => void;
  error: string | null;
}

const ErrorNotificationContext = createContext<ErrorNotificationContextType | undefined>(undefined);

interface ErrorNotificationProviderProps {
  children: ReactNode;
}

export const ErrorNotificationProvider: React.FC<ErrorNotificationProviderProps> = ({
  children,
}) => {
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const { t } = useI18n();

  const showError = (message: string) => {
    setError(message);
    setOpen(true);
  };

  const clearError = () => {
    setError(null);
    setOpen(false);
  };

  const handleClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <ErrorNotificationContext.Provider value={{ showError, clearError, error }}>
      {children}
      <Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
        <Alert onClose={handleClose} severity="error" sx={{ width: '100%' }}>
          {error || t('common.error')}
        </Alert>
      </Snackbar>
    </ErrorNotificationContext.Provider>
  );
};

export const useErrorNotification = (): ErrorNotificationContextType => {
  const context = useContext(ErrorNotificationContext);

  if (context === undefined) {
    throw new Error('useErrorNotification must be used within an ErrorNotificationProvider');
  }

  return context;
};
