import { Save as SaveIcon, Chat as ChatIcon, Close as CloseIcon } from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  Divider,
  Grid,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Fab,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { BrainstormFlow } from '@/components/BrainstormFlow/BrainstormFlow';
import { ChatInterface } from '@/components/Chat/ChatInterface';
import { AppShell } from '@/components/Layout/AppShell';
import { useProject } from '@/hooks/useProject';
import type { Node, Edge } from '@/types';

export const BrainstormPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  const { project, loading, error, isSaving, saveProject, createNewVersion } = useProject({
    projectId,
    autoSave: true,
  });

  useEffect(() => {
    if (project) {
      setNodes(project.nodes);
      setEdges(project.edges);
    }
  }, [project]);

  const handleSaveFlow = (updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (project) {
      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Update project with new nodes and edges
      project.nodes = updatedNodes;
      project.edges = updatedEdges;

      // Save project
      saveProject();
    }
  };

  const handleCreateNewVersion = async () => {
    if (project) {
      await createNewVersion();
    }
  };

  const toggleChat = () => {
    setChatOpen(prev => !prev);
  };

  if (loading) {
    return (
      <AppShell title="Brainstorming" onThemeToggle={() => {}} isDarkMode={theme.palette.mode === 'dark'}>
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}
        >
          <CircularProgress />
        </Box>
      </AppShell>
    );
  }

  if (error || !project) {
    return (
      <AppShell title="Brainstorming" onThemeToggle={() => {}} isDarkMode={theme.palette.mode === 'dark'}>
        <Paper sx={{ p: 3 }}>
          <Typography color="error" variant="h6">
            Error: {error || 'Project not found'}
          </Typography>
        </Paper>
      </AppShell>
    );
  }

  return (
    <AppShell title={`Brainstorming: ${project.name}`} onThemeToggle={() => {}} isDarkMode={theme.palette.mode === 'dark'}>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h5" component="h1">
            {project.name}
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Version {project.version}
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<SaveIcon />}
            onClick={() => saveProject()}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button variant="outlined" onClick={handleCreateNewVersion} disabled={isSaving}>
            New Version
          </Button>

          {isMobile && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<ChatIcon />}
              onClick={toggleChat}
            >
              Assistant
            </Button>
          )}
        </Box>
      </Box>

      <Divider sx={{ mb: 2 }} />

      {isMobile ? (
        <>
          <Box sx={{ height: 'calc(100vh - 200px)' }}>
            <BrainstormFlow initialNodes={nodes} initialEdges={edges} onSave={handleSaveFlow} />
          </Box>

          <Drawer
            anchor="right"
            open={chatOpen}
            onClose={toggleChat}
            sx={{
              '& .MuiDrawer-paper': {
                width: '80%',
                maxWidth: 400,
              },
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
              <IconButton onClick={toggleChat}>
                <CloseIcon />
              </IconButton>
            </Box>

            <Box sx={{ height: 'calc(100% - 48px)' }}>
              <ChatInterface />
            </Box>
          </Drawer>
        </>
      ) : (
        <Grid container spacing={2} sx={{ height: 'calc(100vh - 200px)' }}>
          <Grid xs={chatOpen ? 8 : 12}>
            <BrainstormFlow initialNodes={nodes} initialEdges={edges} onSave={handleSaveFlow} />
          </Grid>

          {chatOpen && (
            <Grid xs={4}>
              <Box sx={{ height: '100%', position: 'relative' }}>
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                  onClick={toggleChat}
                >
                  <CloseIcon />
                </IconButton>
                <ChatInterface />
              </Box>
            </Grid>
          )}
        </Grid>
      )}

      {/* Floating action buttons - stacked vertically with proper spacing */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          zIndex: 1000,
        }}
      >
        {!chatOpen && !isMobile && (
          <Fab color="secondary" aria-label="chat" onClick={toggleChat} size="medium">
            <ChatIcon />
          </Fab>
        )}

        <Fab
          color="primary"
          aria-label="save"
          onClick={() => saveProject()}
          disabled={isSaving}
          size="medium"
        >
          <SaveIcon />
        </Fab>
      </Box>
    </AppShell>
  );
};
