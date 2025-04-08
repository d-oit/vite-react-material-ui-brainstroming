import { Refresh as RefreshIcon } from '@mui/icons-material';
import { Alert, AlertTitle, Box, Button } from '@mui/material';

import { useNavigation } from '../../contexts/NavigationContext';
import type { NavigationError } from '../../types/navigation';

interface NavigationErrorDisplayProps {
  error: NavigationError;
}

const NavigationErrorDisplay = ({ error }: NavigationErrorDisplayProps) => {
  const { retryLoading } = useNavigation();

  const getErrorMessage = () => {
    switch (error.type) {
      case 'load':
        return 'Failed to load navigation items';
      case 'permission':
        return 'You do not have permission to access some navigation items';
      case 'network':
        return 'Network error while loading navigation';
      default:
        return 'An error occurred';
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Alert
        severity={error.severity}
        sx={{
          mb: 2,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <AlertTitle>{error.severity === 'error' ? 'Error' : 'Warning'}</AlertTitle>
        {getErrorMessage()}
        {error.retry && (
          <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              size="small"
              startIcon={<RefreshIcon />}
              onClick={() => void retryLoading()}
              variant="outlined"
              color={error.severity === 'error' ? 'error' : 'warning'}
            >
              Retry
            </Button>
          </Box>
        )}
      </Alert>
    </Box>
  );
};

export default NavigationErrorDisplay;
