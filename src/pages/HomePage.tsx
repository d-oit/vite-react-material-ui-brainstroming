import { Dashboard as DashboardIcon, FolderOpen as ProjectsIcon } from '@mui/icons-material';
import { Box, Typography, Button, Container, Stack, CircularProgress } from '@mui/material';
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { AppShell } from '../components/Layout/AppShell';
import { useI18n } from '../contexts/I18nContext';
import projectService from '../services/ProjectService';
import { ProjectTemplate } from '../types/project';

interface HomePageProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

const HomePage = ({ onThemeToggle, isDarkMode }: HomePageProps) => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [isCreating, setIsCreating] = useState(false);

  const handleQuickBrainstorm = async () => {
    try {
      setIsCreating(true);

      // Check if a Quick Brainstorm project already exists
      const projects = await projectService.getProjects();
      const quickBrainstormProject = projects.find(p => p.name.startsWith('Quick Brainstorm'));

      if (quickBrainstormProject) {
        // If it exists, navigate to it
        navigate(`/projects/${quickBrainstormProject.id}`);
      } else {
        // If not, create a new one
        const projectName = `Quick Brainstorm - ${new Date().toLocaleString()}`;
        const project = await projectService.createProject(
          projectName,
          'A quick brainstorming session',
          ProjectTemplate.CUSTOM
        );
        navigate(`/projects/${project.id}`);
      }
    } catch (error) {
      console.error('Error handling quick brainstorm project:', error);
    } finally {
      setIsCreating(false);
    }
  };

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
              onClick={handleQuickBrainstorm}
              startIcon={<DashboardIcon />}
              disabled={isCreating}
              data-quick-brainstorm
            >
              {isCreating ? (
                <>
                  <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                  Creating...
                </>
              ) : (
                'Quick Brainstorm'
              )}
            </Button>
          </Stack>
        </Box>
      </Container>
    </AppShell>
  );
};

export default HomePage;
