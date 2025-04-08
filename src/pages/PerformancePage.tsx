import { Box, Typography, Container, Paper, Alert } from '@mui/material';
import React from 'react';

import AppShell from '../components/Layout/AppShell';
import PerformanceDashboard from '../components/Performance/PerformanceDashboard';
import { useI18n } from '../contexts/I18nContext';

interface PerformancePageProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

/**
 * Performance Dashboard Page
 *
 * This page displays performance metrics and tools for monitoring application performance.
 */
const PerformancePage: React.FC<PerformancePageProps> = ({ onThemeToggle, isDarkMode }) => {
  const { t } = useI18n();

  return (
    <AppShell
      title={t('performance.title') || 'Performance Dashboard'}
      onThemeToggle={onThemeToggle}
      isDarkMode={isDarkMode}
    >
      <Container maxWidth="xl">
        <Box sx={{ my: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            {t('performance.title') || 'Performance Dashboard'}
          </Typography>

          <Typography variant="body1" color="text.secondary" paragraph>
            {t('performance.description') ||
              'Monitor application performance metrics and identify areas for optimization.'}
          </Typography>

          <Paper elevation={0} sx={{ p: 2, mb: 3, bgcolor: 'background.paper' }}>
            <Alert severity="info">
              {t('performance.info') ||
                'This dashboard displays real-time performance metrics collected during your session. Use it to identify performance bottlenecks and optimize your application.'}
            </Alert>
          </Paper>

          <Box sx={{ height: 'calc(100vh - 250px)', minHeight: '500px' }}>
            <PerformanceDashboard />
          </Box>
        </Box>
      </Container>
    </AppShell>
  );
};

export default PerformancePage;
