import { Box, Button, Typography } from '@mui/material';
import type { ErrorInfo, ReactNode } from 'react';
import React, { Component } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { useBrainstormStore } from '../../store/brainstormStore';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class BrainstormErrorBoundaryClass extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Brainstorm error:', error, errorInfo);
  }

  private handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
          role="alert"
          aria-live="polite"
        >
          <Typography variant="h6" color="error">
            {this.state.error?.message || 'An error occurred in the brainstorm flow'}
          </Typography>
          <Button variant="contained" onClick={this.handleReset} aria-label="Reset brainstorm flow">
            Try Again
          </Button>
        </Box>
      );
    }

    return this.props.children;
  }
}

export const BrainstormErrorBoundary: React.FC<Props> = ({ children }) => {
  const { t } = useI18n();
  return <BrainstormErrorBoundaryClass>{children}</BrainstormErrorBoundaryClass>;
};
