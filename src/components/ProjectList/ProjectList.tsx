import { Add as AddIcon, History as HistoryIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  useTheme,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { useI18n } from '../../contexts/I18nContext';
import projectService from '../../services/ProjectService';
import type { Project } from '../../types';
import type { ProjectTemplate } from '../../types/project';
import ProjectCard from '../Project/ProjectCard';
import ProjectCreateForm from '../Project/ProjectCreateForm';

interface ProjectListProps {
  onCreateProject?: (project: Project) => void;
  onRefresh?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onCreateProject, onRefresh }) => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'delete' | 'archive' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const loadedProjects = await projectService.getProjects(false);
      setProjects(loadedProjects);
    } catch (err) {
      console.error('Error loading projects:', err);
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, []);

  const handleCreateProject = async (
    name: string,
    description: string,
    template: ProjectTemplate
  ) => {
    try {
      setLoading(true);
      const newProject = await projectService.createProject(name, description, template);

      setProjects([newProject, ...projects]);
      setCreateDialogOpen(false);

      if (onCreateProject) {
        onCreateProject(newProject);
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error creating project:', err);
      setError('Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  // This function is used by the ProjectCard component
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleOpenProject = (id: string) => {
    navigate(`/projects/${id}`);
  };

  const handleArchiveProject = async (id: string) => {
    try {
      await projectService.archiveProject(id, true);
      setProjects(projects.filter(p => p.id !== id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error archiving project:', err);
      setError('Failed to archive project');
    }
  };

  const handleDeleteProject = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      setProjects(projects.filter(p => p.id !== id));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleSyncToS3 = async (id: string) => {
    try {
      const success = await projectService.syncToS3(id);
      if (!success) {
        setError('Failed to sync project to S3');
      }
    } catch (err) {
      console.error('Error syncing project to S3:', err);
      setError('Failed to sync project to S3');
    }
  };

  const openConfirmDialog = (type: 'delete' | 'archive', projectId: string) => {
    setActionType(type);
    setSelectedProjectId(projectId);
    setConfirmDialogOpen(true);
  };

  const handlePinProject = async (projectId: string, isPinned: boolean) => {
    try {
      // Update the project in the database
      await projectService.updateProject(projectId, { isPinned });

      // Update the local state
      setProjects(projects.map(p => (p.id === projectId ? { ...p, isPinned } : p)));

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error pinning/unpinning project:', err);
      setError('Failed to update project');
    }
  };

  const handleConfirmAction = async () => {
    if (!selectedProjectId || !actionType) return;

    if (actionType === 'archive') {
      await handleArchiveProject(selectedProjectId);
    } else if (actionType === 'delete') {
      await handleDeleteProject(selectedProjectId);
    }

    setConfirmDialogOpen(false);
    setSelectedProjectId(null);
    setActionType(null);
  };

  if (loading && projects.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" component="h2">
          My Projects
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
        >
          New Project
        </Button>
      </Box>

      {projects.length === 0 ? (
        <Box
          sx={{
            textAlign: 'center',
            p: 4,
            bgcolor: theme.palette.background.paper,
            borderRadius: 2,
            boxShadow: theme.shadows[1],
          }}
        >
          <HistoryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" gutterBottom>
            {t('project.noProjects')}
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            {t('project.createFirstProject')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
            sx={{
              mt: 2,
              borderRadius: 2,
              px: 3,
              py: 1,
              fontWeight: 500,
            }}
          >
            {t('project.createProject')}
          </Button>
        </Box>
      ) : (
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)' },
            gap: 3,
            width: '100%',
          }}
        >
          {projects.map(project => (
            <Box key={project.id}>
              <ProjectCard
                project={project}
                onDelete={id => openConfirmDialog('delete', id)}
                onArchive={id => openConfirmDialog('archive', id)}
                onSync={id => void handleSyncToS3(id)}
                onPin={(id, isPinned) => void handlePinProject(id, isPinned)}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Create Project Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogContent>
          <ProjectCreateForm
            onSubmit={async (data) => { await handleCreateProject(data); }}
            onCancel={() => setCreateDialogOpen(false)}
            loading={loading}
          />
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>{actionType === 'archive' ? 'Archive Project' : 'Delete Project'}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'archive'
              ? 'Are you sure you want to archive this project? It will be moved to the archive and can be restored later.'
              : 'Are you sure you want to delete this project? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={() => void handleConfirmAction()}
            color={actionType === 'delete' ? 'error' : 'primary'}
            // Removed autoFocus for accessibility
          >
            {actionType === 'archive' ? 'Archive' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectList;
