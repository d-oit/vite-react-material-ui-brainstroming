import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Commit as CommitIcon,
  History as HistoryIcon,
  Restore as RestoreIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { useI18n } from '../../contexts/I18nContext';
import { Project } from '../../types';
import gitService from '../../services/GitService';
import projectService from '../../services/ProjectService';

interface GitHistoryPanelProps {
  project: Project;
  onProjectUpdate: (project: Project) => void;
}

export const GitHistoryPanel = ({ project, onProjectUpdate }: GitHistoryPanelProps) => {
  const { t } = useI18n();
  const [commits, setCommits] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [commitDialogOpen, setCommitDialogOpen] = useState(false);
  const [commitMessage, setCommitMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Load commits on mount and when project changes
  useEffect(() => {
    if (project?.id) {
      loadCommits();
    }
  }, [project?.id]);

  const loadCommits = () => {
    setLoading(true);
    try {
      const projectCommits = gitService.getCommits(project.id);
      setCommits(projectCommits);
    } catch (error) {
      console.error('Error loading commits:', error);
      setError(t('gitHistory.errorLoadingCommits'));
    } finally {
      setLoading(false);
    }
  };

  const handleCommit = async () => {
    if (!commitMessage.trim()) {
      setError(t('gitHistory.commitMessageRequired'));
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updatedProject = await projectService.saveProjectWithCommit(project, commitMessage);
      onProjectUpdate(updatedProject);
      setCommitDialogOpen(false);
      setCommitMessage('');
      setSuccess(t('gitHistory.commitSuccessful'));
      loadCommits();
    } catch (error) {
      console.error('Error creating commit:', error);
      setError(t('gitHistory.errorCreatingCommit'));
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = (commitId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const projectSnapshot = gitService.checkout(project.id, commitId);

      if (projectSnapshot) {
        onProjectUpdate(projectSnapshot);
        setSuccess(t('gitHistory.checkoutSuccessful'));
      } else {
        setError(t('gitHistory.errorCheckingOut'));
      }
    } catch (error) {
      console.error('Error checking out commit:', error);
      setError(t('gitHistory.errorCheckingOut'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Box>
          <Typography variant="h6">{t('gitHistory.title')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('gitHistory.currentVersion')}: {project.version}
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="primary"
          startIcon={<SaveIcon />}
          onClick={() => setCommitDialogOpen(true)}
        >
          {t('gitHistory.commit')}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ m: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Box sx={{ flexGrow: 1, overflow: 'auto', p: 2 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : commits.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <HistoryIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
            <Typography variant="body1">{t('gitHistory.noCommits')}</Typography>
            <Typography variant="body2" color="text.secondary">
              {t('gitHistory.createFirstCommit')}
            </Typography>
          </Paper>
        ) : (
          <List>
            {commits.map((commit, index) => (
              <Box key={commit.id}>
                <ListItem
                  disablePadding
                  secondaryAction={
                    <Button
                      size="small"
                      startIcon={<RestoreIcon />}
                      onClick={() => handleCheckout(commit.id)}
                      disabled={commit.id === gitService.getCurrentCommit(project.id)?.id}
                    >
                      {t('gitHistory.checkout')}
                    </Button>
                  }
                >
                  <ListItemButton
                    selected={commit.id === gitService.getCurrentCommit(project.id)?.id}
                  >
                    <ListItemIcon>
                      <CommitIcon />
                    </ListItemIcon>
                    <ListItemText
                      primary={commit.message}
                      secondary={
                        <>
                          <Typography component="span" variant="body2" color="text.primary">
                            {commit.version}
                          </Typography>
                          {' — '}
                          {new Date(commit.timestamp).toLocaleString()}
                        </>
                      }
                    />
                  </ListItemButton>
                </ListItem>
                {index < commits.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Box>

      <Dialog open={commitDialogOpen} onClose={() => setCommitDialogOpen(false)}>
        <DialogTitle>{t('gitHistory.createCommit')}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label={t('gitHistory.commitMessage')}
            fullWidth
            value={commitMessage}
            onChange={e => setCommitMessage(e.target.value)}
            disabled={loading}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCommitDialogOpen(false)} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            onClick={handleCommit}
            variant="contained"
            disabled={loading || !commitMessage.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : <SaveIcon />}
          >
            {t('gitHistory.commit')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
