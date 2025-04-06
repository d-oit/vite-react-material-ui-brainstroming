import { Dashboard as DashboardIcon, FolderOpen as ProjectsIcon } from '@mui/icons-material';
import { Box, Typography, Button, Container, Stack } from '@mui/material';
import { Link } from 'react-router-dom';

import { AppShell } from '../components/Layout/AppShell';
import { useI18n } from '../contexts/I18nContext';

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
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button
              variant="contained"
              color="primary"
              size="large"
              component={Link}
              to="/projects"
              startIcon={<ProjectsIcon />}
            >
              My Projects
            </Button>
            <Button
              variant="outlined"
              color="primary"
              size="large"
              component={Link}
              to="/brainstorm"
              startIcon={<DashboardIcon />}
            >
              Quick Brainstorm
            </Button>
          </Stack>
        </Box>
      </Container>
    </AppShell>
  );
};
