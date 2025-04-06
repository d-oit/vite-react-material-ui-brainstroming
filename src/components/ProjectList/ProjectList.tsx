import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  MoreVert as MoreVertIcon,
  History as HistoryIcon,
  CloudUpload as CloudUploadIcon,
  Share as ShareIcon,
} from '@mui/icons-material';

import ProjectCreateForm from '../Project/ProjectCreateForm';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  Divider,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  CircularProgress,
  Alert,
  Chip,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import projectService from '../../services/ProjectService';
import type { Project } from '../../types';
import { ProjectTemplate } from '../../types/project';

interface ProjectListProps {
  onCreateProject?: (project: Project) => void;
  onRefresh?: () => void;
}

export const ProjectList: React.FC<ProjectListProps> = ({ onCreateProject, onRefresh }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState<boolean>(false);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'delete' | 'archive' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [newProjectName, setNewProjectName] = useState<string>('');
  const [newProjectDescription, setNewProjectDescription] = useState<string>('');
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [menuProjectId, setMenuProjectId] = useState<string | null>(null);

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
    loadProjects();
  }, []);

  const handleCreateProject = async (name: string, description: string, template: ProjectTemplate) => {
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

  const handleOpenProject = (id: string) => {
    navigate(`/brainstorm/${id}`);
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

  const openMenu = (event: React.MouseEvent<HTMLElement>, projectId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setMenuProjectId(projectId);
  };

  const closeMenu = () => {
    setMenuAnchorEl(null);
    setMenuProjectId(null);
  };

  const openConfirmDialog = (type: 'delete' | 'archive') => {
    setActionType(type);
    setSelectedProjectId(menuProjectId);
    setConfirmDialogOpen(true);
    closeMenu();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
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
        <Box sx={{ textAlign: 'center', p: 4, bgcolor: 'background.paper', borderRadius: 1 }}>
          <HistoryIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.7 }} />
          <Typography variant="h6" gutterBottom>
            No Projects Yet
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            Create your first brainstorming project to get started.
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Project
          </Button>
        </Box>
      ) : (
        <Grid container spacing={3}>
          {projects.map(project => (
            <Grid item xs={12} sm={6} md={4} key={project.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Typography
                      variant="h6"
                      component="h3"
                      gutterBottom
                      noWrap
                      sx={{ maxWidth: '80%' }}
                    >
                      {project.name}
                    </Typography>
                    <IconButton size="small" onClick={e => openMenu(e, project.id)}>
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    paragraph
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 3,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '4.5em',
                    }}
                  >
                    {project.description || 'No description'}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                    <Typography variant="caption" color="text.secondary">
                      Created: {formatDate(project.createdAt)}
                    </Typography>
                    <Chip
                      label={`v${project.version}`}
                      size="small"
                      variant="outlined"
                      color="primary"
                    />
                  </Box>
                </CardContent>
                <Divider />
                <CardActions>
                  <Button size="small" onClick={() => handleOpenProject(project.id)} fullWidth>
                    Open Project
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
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
            onSubmit={handleCreateProject}
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
            onClick={handleConfirmAction}
            color={actionType === 'delete' ? 'error' : 'primary'}
            autoFocus
          >
            {actionType === 'archive' ? 'Archive' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Project Actions Menu */}
      <Menu anchorEl={menuAnchorEl} open={Boolean(menuAnchorEl)} onClose={closeMenu}>
        <MenuItem
          onClick={() => {
            if (menuProjectId) handleOpenProject(menuProjectId);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Open</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => openConfirmDialog('archive')}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Archive</ListItemText>
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (menuProjectId) handleSyncToS3(menuProjectId);
            closeMenu();
          }}
        >
          <ListItemIcon>
            <CloudUploadIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Sync to S3</ListItemText>
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => openConfirmDialog('delete')}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ProjectList;
