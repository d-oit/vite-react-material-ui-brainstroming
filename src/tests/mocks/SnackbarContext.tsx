import React, { createContext, useContext, ReactNode } from 'react';

interface SnackbarContextType {
  showSnackbar: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
  closeSnackbar: () => void;
}

const SnackbarContext = createContext<SnackbarContextType | undefined>(undefined);

export const useSnackbar = (): SnackbarContextType => {
  const context = useContext(SnackbarContext);
  if (!context) {
    throw new Error('useSnackbar must be used within a SnackbarProvider');
  }
  return context;
};

export const SnackbarProvider = ({ children }: { children: ReactNode }) => {
  const showSnackbar = (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => {
    console.log(`[MOCK SNACKBAR] ${severity || 'info'}: ${message}`);
  };

  const closeSnackbar = () => {
    console.log('[MOCK SNACKBAR] Closed');
  };

  return (
    <SnackbarContext.Provider value={{ showSnackbar, closeSnackbar }}>
      {children}
    </SnackbarContext.Provider>
  );
};
