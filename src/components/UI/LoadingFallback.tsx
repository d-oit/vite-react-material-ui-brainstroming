import { Box, CircularProgress, Typography } from '@mui/material';

import { useI18n } from '../../contexts/I18nContext';

/**
 * Loading fallback component for lazy-loaded routes
 * Displays a centered loading spinner with a message
 */
export default function LoadingFallback() {
  const { t } = useI18n();

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        width: '100%',
        gap: 2,
      }}
    >
      <CircularProgress size={60} thickness={4} />
      <Typography variant="h6" color="text.secondary">
        {t('common.loading') || 'Loading...'}
      </Typography>
    </Box>
  );
}
