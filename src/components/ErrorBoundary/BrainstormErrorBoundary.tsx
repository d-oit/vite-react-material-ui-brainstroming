import { Alert, Button, Box } from '@mui/material';
import React from 'react';
import { ErrorBoundary } from 'react-error-boundary';

interface FallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <Box
      role="alert"
      sx={{
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      }}
    >
      <Alert severity="error">
        Something went wrong with the brainstorming component:
        {error.message}
      </Alert>
      <Button variant="contained" onClick={resetErrorBoundary} aria-label="Try again">
        Try again
      </Button>
    </Box>
  );
};

interface BrainstormErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

export const BrainstormErrorBoundary = ({ children, onReset }: BrainstormErrorBoundaryProps) => {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorFallback}
      onReset={onReset}
      onError={error => {
        // Log error to your error monitoring service
        console.error('Brainstorm component error:', error);
      }}
    >
      {children}
    </ErrorBoundary>
  );
};
