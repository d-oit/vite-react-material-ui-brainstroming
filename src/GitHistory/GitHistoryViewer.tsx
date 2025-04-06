import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
  Chip,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Commit as CommitIcon,
  Person as PersonIcon,
  Compare as CompareIcon,
} from '@mui/icons-material';
import { GitCommit } from '@/types';
import { getGitHistory, getGitCommitDetails, compareGitCommits } from '@/lib/gitService';

interface GitHistoryViewerProps {
  projectId: string;
}

export const GitHistoryViewer = ({ projectId }: GitHistoryViewerProps) => {
  const [commits, setCommits] = useState<GitCommit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCommit, setSelectedCommit] = useState<GitCommit | null>(null);
  const [compareCommit, setCompareCommit] = useState<GitCommit | null>(null);
  const [compareDialogOpen, setCompareDialogOpen] = useState(false);
  const [compareResult, setCompareResult] = useState<{
    added: string[];
    removed: string[];
    modified: string[];
  } | null>(null);
  const [compareLoading, setCompareLoading] = useState(false);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const history = await getGitHistory(projectId);
        setCommits(history);
        setError(null);
      } catch (err) {
        setError('Failed to load Git history');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [projectId]);

  const handleCommitClick = async (commit: GitCommit) => {
    setSelectedCommit(commit);
  };

  const handleCompareClick = (commit: GitCommit) => {
    if (selectedCommit && selectedCommit.hash !== commit.hash) {
      setCompareCommit(commit);
      setCompareDialogOpen(true);
      performComparison(selectedCommit.hash, commit.hash);
    }
  };

  const performComparison = async (baseHash: string, compareHash: string) => {
    try {
      setCompareLoading(true);
      const result = await compareGitCommits(baseHash, compareHash);
      setCompareResult(result);
    } catch (err) {
      console.error('Failed to compare commits:', err);
    } finally {
      setCompareLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', gap: 2, height: '100%' }}>
      <Paper sx={{ width: '40%', overflow: 'auto', height: '100%' }}>
        <Typography variant="h6" sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          Commit History
        </Typography>

        <List sx={{ width: '100%' }}>
          {commits.map(commit => (
            <Box key={commit.hash}>
              <ListItem
                alignItems="flex-start"
                button
                selected={selectedCommit?.hash === commit.hash}
                onClick={() => handleCommitClick(commit)}
              >
                <ListItemAvatar>
                  <Avatar>
                    <CommitIcon />
                  </Avatar>
                </ListItemAvatar>

                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <Typography variant="subtitle1" component="span">
                        {commit.message}
                      </Typography>
                      <Chip
                        label={commit.hash.substring(0, 7)}
                        size="small"
                        color="primary"
                        variant="outlined"
                      />
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography component="span" variant="body2" color="text.primary">
                        {commit.author}
                      </Typography>
                      {' — '}
                      {formatDate(commit.date)}
                    </>
                  }
                />
              </ListItem>
              <Divider variant="inset" component="li" />
            </Box>
          ))}
        </List>
      </Paper>

      <Paper sx={{ width: '60%', p: 2, height: '100%', overflow: 'auto' }}>
        {selectedCommit ? (
          <Box>
            <Typography variant="h6" gutterBottom>
              Commit Details
            </Typography>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Message</Typography>
              <Typography variant="body1">{selectedCommit.message}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Author</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon color="action" />
                <Typography variant="body1">{selectedCommit.author}</Typography>
              </Box>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Date</Typography>
              <Typography variant="body1">{formatDate(selectedCommit.date)}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Commit Hash</Typography>
              <Chip label={selectedCommit.hash} color="primary" />
            </Box>

            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1">Compare with another commit</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {commits
                  .filter(commit => commit.hash !== selectedCommit.hash)
                  .slice(0, 5)
                  .map(commit => (
                    <Chip
                      key={commit.hash}
                      label={`${commit.hash.substring(0, 7)} - ${commit.message.substring(0, 20)}...`}
                      onClick={() => handleCompareClick(commit)}
                      icon={<CompareIcon />}
                      clickable
                    />
                  ))}
              </Box>
            </Box>
          </Box>
        ) : (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}
          >
            <Typography variant="body1" color="text.secondary">
              Select a commit to view details
            </Typography>
          </Box>
        )}
      </Paper>

      <Dialog
        open={compareDialogOpen}
        onClose={() => setCompareDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Compare Commits
          <Typography variant="subtitle2" color="text.secondary">
            {selectedCommit?.hash.substring(0, 7)} vs {compareCommit?.hash.substring(0, 7)}
          </Typography>
        </DialogTitle>

        <DialogContent dividers>
          {compareLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : compareResult ? (
            <Box>
              <Typography variant="h6" gutterBottom>
                Changes
              </Typography>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="success.main" gutterBottom>
                  Added Files ({compareResult.added.length})
                </Typography>
                {compareResult.added.length > 0 ? (
                  <List dense>
                    {compareResult.added.map(file => (
                      <ListItem key={file}>
                        <ListItemText primary={file} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No files added
                  </Typography>
                )}
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" color="error.main" gutterBottom>
                  Removed Files ({compareResult.removed.length})
                </Typography>
                {compareResult.removed.length > 0 ? (
                  <List dense>
                    {compareResult.removed.map(file => (
                      <ListItem key={file}>
                        <ListItemText primary={file} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No files removed
                  </Typography>
                )}
              </Box>

              <Box>
                <Typography variant="subtitle1" color="info.main" gutterBottom>
                  Modified Files ({compareResult.modified.length})
                </Typography>
                {compareResult.modified.length > 0 ? (
                  <List dense>
                    {compareResult.modified.map(file => (
                      <ListItem key={file}>
                        <ListItemText primary={file} />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No files modified
                  </Typography>
                )}
              </Box>
            </Box>
          ) : (
            <Typography>No comparison data available</Typography>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setCompareDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
