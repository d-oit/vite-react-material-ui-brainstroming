import {
  Box,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
} from '@mui/material';
import { useState, useEffect } from 'react';

interface Commit {
  hash: string;
  message: string;
  author: string;
  date: string;
}

interface GitHistoryViewerProps {
  projectId?: string;
}

export default function GitHistoryViewer({ projectId }: GitHistoryViewerProps) {
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading git history
    const loadHistory = async () => {
      setLoading(true);

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data
      const mockCommits: Commit[] = [
        {
          hash: 'abc1234',
          message: 'Initial commit',
          author: 'User',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          hash: 'def5678',
          message: 'Add new features',
          author: 'User',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          hash: 'ghi9012',
          message: 'Fix bugs',
          author: 'User',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          hash: 'jkl3456',
          message: 'Update documentation',
          author: 'User',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ];

      setCommits(mockCommits);
      setLoading(false);
    };

    void loadHistory();
  }, [projectId]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Typography variant="h6" gutterBottom>
          Git History {projectId ? `for Project ${projectId}` : ''}
        </Typography>

        {loading ? (
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexGrow: 1 }}
          >
            <CircularProgress />
          </Box>
        ) : (
          <List sx={{ overflow: 'auto' }}>
            {commits.map((commit, index) => (
              <Box key={commit.hash}>
                <ListItem alignItems="flex-start">
                  <ListItemText
                    primary={commit.message}
                    secondary={
                      <>
                        <Typography component="span" variant="body2" color="text.primary">
                          {commit.hash.substring(0, 7)}
                        </Typography>
                        {` — ${commit.author} • ${formatDate(commit.date)}`}
                      </>
                    }
                  />
                </ListItem>
                {index < commits.length - 1 && <Divider />}
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
