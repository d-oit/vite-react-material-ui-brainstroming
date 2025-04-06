import {
  Create as CreateIcon,
  Update as UpdateIcon,
  Delete as DeleteIcon,
  Archive as ArchiveIcon,
  Unarchive as UnarchiveIcon,
  Visibility as ViewIcon,
  Share as ShareIcon,
  CloudUpload as ExportIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Paper,
  CircularProgress,
  Alert,
  Chip,
  Tooltip,
} from '@mui/material';
import React, { useState, useEffect } from 'react';

import projectService from '../../services/ProjectService';
import type { ProjectHistoryEntry } from '../../types';

interface ProjectHistoryPanelProps {
  projectId: string;
  limit?: number;
}

export const ProjectHistoryPanel: React.FC<ProjectHistoryPanelProps> = ({
  projectId,
  limit = 50,
}) => {
  const [history, setHistory] = useState<ProjectHistoryEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const historyEntries = await projectService.getProjectHistory(projectId, limit);
        setHistory(historyEntries);
      } catch (err) {
        console.error('Error loading project history:', err);
        setError('Failed to load project history');
      } finally {
        setLoading(false);
      }
    };

    loadHistory();
  }, [projectId, limit]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'create':
        return <CreateIcon color="primary" />;
      case 'update':
        return <UpdateIcon color="info" />;
      case 'archive':
        return <ArchiveIcon color="warning" />;
      case 'unarchive':
        return <UnarchiveIcon color="success" />;
      case 'delete':
        return <DeleteIcon color="error" />;
      case 'view':
        return <ViewIcon color="action" />;
      case 'export':
        return <ExportIcon color="secondary" />;
      case 'share':
        return <ShareIcon color="info" />;
      default:
        return <HistoryIcon />;
    }
  };

  const getActionText = (entry: ProjectHistoryEntry) => {
    switch (entry.action) {
      case 'create':
        return 'Project created';
      case 'update':
        return entry.details?.commitMessage
          ? `Updated: ${entry.details.commitMessage}`
          : 'Project updated';
      case 'archive':
        return 'Project archived';
      case 'unarchive':
        return 'Project unarchived';
      case 'delete':
        return 'Project deleted';
      case 'view':
        return 'Project viewed';
      case 'export':
        return `Exported to ${entry.details?.destination || 'external storage'}`;
      case 'share':
        return `Shared with ${entry.details?.recipient || 'someone'}`;
      default:
        return 'Action performed';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  if (history.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: 'center', m: 2 }}>
        <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="body1">No history available</Typography>
        <Typography variant="body2" color="text.secondary">
          Actions performed on this project will be recorded here.
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      <Typography variant="h6" sx={{ p: 2, pb: 1 }}>
        Project History
      </Typography>
      <Divider />
      <List sx={{ width: '100%' }}>
        {history.map(entry => (
          <React.Fragment key={entry.id}>
            <ListItem alignItems="flex-start">
              <ListItemIcon>{getActionIcon(entry.action)}</ListItemIcon>
              <ListItemText
                primary={getActionText(entry)}
                secondary={
                  <React.Fragment>
                    <Typography component="span" variant="body2" color="text.primary">
                      {formatDate(entry.timestamp)}
                    </Typography>
                    {entry.details?.version && (
                      <Tooltip title="Version">
                        <Chip
                          label={`v${entry.details.version}`}
                          size="small"
                          sx={{ ml: 1 }}
                          variant="outlined"
                        />
                      </Tooltip>
                    )}
                  </React.Fragment>
                }
              />
            </ListItem>
            <Divider variant="inset" component="li" />
          </React.Fragment>
        ))}
      </List>
    </Box>
  );
};

export default ProjectHistoryPanel;
