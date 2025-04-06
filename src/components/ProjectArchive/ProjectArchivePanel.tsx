import {
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemSecondaryAction,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import projectService from '../../services/ProjectService';
import type { Project } from '../../types';

interface ProjectArchivePanelProps {
  onRefresh?: () => void;
}

export const ProjectArchivePanel: React.FC<ProjectArchivePanelProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const [archivedProjects, setArchivedProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState<boolean>(false);
  const [actionType, setActionType] = useState<'unarchive' | 'delete' | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const loadArchivedProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      const projects = await projectService.getProjects(true);
      setArchivedProjects(projects.filter(p => p.isArchived));
    } catch (err) {
      console.error('Error loading archived projects:', err);
      setError('Failed to load archived projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArchivedProjects();
  }, []);

  const handleUnarchive = async (projectId: string) => {
    try {
      await projectService.archiveProject(projectId, false);
      setArchivedProjects(archivedProjects.filter(p => p.id !== projectId));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error unarchiving project:', err);
      setError('Failed to unarchive project');
    }
  };

  const handleDelete = async (projectId: string) => {
    try {
      await projectService.deleteProject(projectId);
      setArchivedProjects(archivedProjects.filter(p => p.id !== projectId));
      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Error deleting project:', err);
      setError('Failed to delete project');
    }
  };

  const handleView = (projectId: string) => {
    navigate(`/brainstorm/${projectId}`);
  };

  const openConfirmDialog = (type: 'unarchive' | 'delete', projectId: string) => {
    setActionType(type);
    setSelectedProjectId(projectId);
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    if (!selectedProjectId || !actionType) return;

    if (actionType === 'unarchive') {
      await handleUnarchive(selectedProjectId);
    } else if (actionType === 'delete') {
      await handleDelete(selectedProjectId);
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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  if (archivedProjects.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', m: 2 }}>
        <ArchiveIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1">No archived projects</Typography>
        <Typography variant="body2" color="text.secondary">
          Projects you archive will appear here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Archived Projects
      </Typography>
      <Divider />
      <List sx={{ width: '100%' }}>
        {archivedProjects.map(project => (
          <React.Fragment key={project.id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>
                <ArchiveIcon color="action" />
              </ListItemIcon>
              <ListItemText
                primary={project.name}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {project.description}
                    </Typography>
                    <br />
                    <Typography component="span" variant="caption" color="text.secondary">
                      Archived: {project.archivedAt ? formatDate(project.archivedAt) : 'Unknown'} |
                      Created: {formatDate(project.createdAt)} | Version: {project.version}
                    </Typography>
                  </React.Fragment>
                }
              />
              <ListItemSecondaryAction>
                <IconButton edge="end" onClick={() => handleView(project.id)} title="View">
                  <ViewIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => openConfirmDialog('unarchive', project.id)}
                  title="Unarchive"
                  sx={{ ml: 1 }}
                >
                  <UnarchiveIcon />
                </IconButton>
                <IconButton
                  edge="end"
                  onClick={() => openConfirmDialog('delete', project.id)}
                  title="Delete permanently"
                  color="error"
                  sx={{ ml: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </ListItemSecondaryAction>
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>
          {actionType === 'unarchive' ? 'Unarchive Project' : 'Delete Project Permanently'}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === 'unarchive'
              ? 'Are you sure you want to unarchive this project? It will be moved back to your active projects.'
              : 'Are you sure you want to permanently delete this project? This action cannot be undone.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleConfirmAction}
            color={actionType === 'delete' ? 'error' : 'primary'}
            autoFocus
          >
            {actionType === 'unarchive' ? 'Unarchive' : 'Delete Permanently'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectArchivePanel;
