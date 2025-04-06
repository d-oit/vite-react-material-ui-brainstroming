import { Box, Typography, Button, Container } from '@mui/material';
import { Link } from 'react-router-dom';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useI18n } from '../contexts/I18nContext';
import { AppShell } from '../components/Layout/AppShell';

interface HomePageProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export const HomePage = ({ onThemeToggle, isDarkMode }: HomePageProps) => {
  const { t } = useI18n();

  return (
    <AppShell title={t('app.title')} onThemeToggle={onThemeToggle} isDarkMode={isDarkMode}>
      <Container maxWidth="md">
        <Box sx={{ my: 4, textAlign: 'center' }}>
          <Typography variant="h2" component="h1" gutterBottom>
            {t('app.title')}
          </Typography>
          <Typography variant="h5" component="p" color="text.secondary" gutterBottom>
            {t('app.tagline')}
          </Typography>
          <Typography variant="body1" paragraph>
            Welcome to the d.o.it.brainstorming app!
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/brainstorm"
              startIcon={<DashboardIcon />}
            >
              Start Brainstorming
            </Button>
          </Box>
        </Box>
      </Container>
    </AppShell>
  );
};
