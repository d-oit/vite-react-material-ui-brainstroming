import {
  Save as SaveIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  Paper,
  CircularProgress,
  Button,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  Tab,
  Tabs,
  Container,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import KeyboardShortcutsHandler from '../components/BrainstormFlow/KeyboardShortcutsHandler';
import { ChatInterface } from '../components/Chat/ChatInterface';
import HelpOverlay from '../components/Help/HelpOverlay';
import { AppShell } from '../components/Layout/AppShell';
import { ProjectBrainstormingSection } from '../components/Project/ProjectBrainstormingSection';
import ProjectSettingsSection from '../components/Project/ProjectSettingsSection';
import { useProject } from '../hooks/useProject';
import type { Node, Edge, Project } from '../types';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`project-tab-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ height: '100%' }}>{children}</Box>}
    </div>
  );
};

const ProjectDetailPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [_nodes, setNodes] = useState<Node[]>([]);
  const [_edges, setEdges] = useState<Edge[]>([]);
  const [tabValue, setTabValue] = useState(0);

  const { project, loading, error, isSaving, saveProject, createNewVersion } = useProject({
    projectId,
    autoSave: true,
  });

  useEffect(() => {
    if (project !== null && project !== undefined) {
      setNodes(project.nodes);
      setEdges(project.edges);
    }
  }, [project]);

  const handleSaveFlow = (updatedNodes: Node[], updatedEdges: Edge[]) => {
    if (project !== null && project !== undefined) {
      setNodes(updatedNodes);
      setEdges(updatedEdges);

      // Create updated project with new nodes and edges
      const _updatedProject = {
        ...project,
        nodes: updatedNodes,
        edges: updatedEdges,
        updatedAt: new Date().toISOString(),
      };

      // Save project
      void saveProject();
    }
  };

  const handleCreateNewVersion = async () => {
    if (project !== null && project !== undefined) {
      await createNewVersion();
    }
  };

  const toggleChat = () => {
    setChatOpen(prev => !prev);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <AppShell title="Project" onThemeToggle={() => {}} isDarkMode={theme.palette.mode === 'dark'}>
        <Container maxWidth="lg">
          <Box
            sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}
          >
            <CircularProgress />
          </Box>
        </Container>
      </AppShell>
    );
  }

  if (
    (error !== null && error !== undefined && error !== '') ||
    project === null ||
    project === undefined
  ) {
    return (
      <AppShell title="Project" onThemeToggle={() => {}} isDarkMode={theme.palette.mode === 'dark'}>
        <Container maxWidth="lg">
          <Paper sx={{ p: 3 }}>
            <Typography color="error" variant="h6">
              Error:{' '}
              {error !== null && error !== undefined && error !== '' ? error : 'Project not found'}
            </Typography>
          </Paper>
        </Container>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={project.name}
      onThemeToggle={() => {}}
      isDarkMode={theme.palette.mode === 'dark'}
    >
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
            onClick={() => {
              void saveProject();
            }}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              void handleCreateNewVersion();
            }}
            disabled={isSaving}
          >
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

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
          <Tab label="Overview" id="project-tab-0" />
          <Tab label="Brainstorm" id="project-tab-1" />
          <Tab label="Settings" id="project-tab-2" />
        </Tabs>
      </Box>

      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Project Details
          </Typography>
          <Typography variant="body1">
            {project.description !== null &&
            project.description !== undefined &&
            project.description !== ''
              ? project.description
              : 'No description provided.'}
          </Typography>
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {isMobile ? (
          <>
            <ProjectBrainstormingSection
              projectId={project.id}
              template={project.template}
              initialNodes={project.nodes}
              initialEdges={project.edges}
              syncSettings={project.syncSettings}
              readOnly={isSaving}
            />

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
          <Box sx={{ display: 'flex', height: 'calc(100vh - 300px)' }}>
            <Box sx={{ flex: chatOpen ? '0 0 70%' : '1 1 100%', pr: chatOpen ? 2 : 0 }}>
              <ProjectBrainstormingSection
                projectId={project.id}
                template={project.template}
                initialNodes={project.nodes}
                initialEdges={project.edges}
                syncSettings={project.syncSettings}
                readOnly={isSaving}
              />
            </Box>

            {chatOpen && (
              <Box sx={{ flex: '0 0 30%', position: 'relative' }}>
                <Box sx={{ height: '100%', position: 'relative' }}>
                  <IconButton
                    sx={{ position: 'absolute', top: 8, right: 8, zIndex: 1 }}
                    onClick={toggleChat}
                  >
                    <CloseIcon />
                  </IconButton>
                  <ChatInterface />
                </Box>
              </Box>
            )}
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <ProjectSettingsSection
          project={project}
          onSave={(updatedProject: Project) => {
            // Update the project in state
            if (project !== null && project !== undefined) {
              // Create a merged project with the updates
              const mergedProject = {
                ...project,
                ...updatedProject,
                updatedAt: new Date().toISOString(),
              };

              // Update local state
              setNodes(mergedProject.nodes);
              setEdges(mergedProject.edges);

              // Save project
              void saveProject();
            }
          }}
          isSaving={isSaving}
          error={error}
        />
      </TabPanel>

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
        {!chatOpen && !isMobile && tabValue === 1 && (
          <IconButton
            color="secondary"
            aria-label="chat"
            onClick={toggleChat}
            sx={{ bgcolor: 'background.paper' }}
          >
            <ChatIcon />
          </IconButton>
        )}

        <IconButton
          color="primary"
          aria-label="save"
          onClick={() => {
            void saveProject();
          }}
          disabled={isSaving}
          sx={{ bgcolor: 'background.paper' }}
        >
          <SaveIcon />
        </IconButton>
      </Box>

      {/* Keyboard shortcuts handler */}
      <KeyboardShortcutsHandler
        onSave={() => void saveProject()}
        onZoomIn={() => console.log('Zoom in')}
        onZoomOut={() => console.log('Zoom out')}
        onFitView={() => console.log('Fit view')}
        onUndo={() => console.log('Undo')}
        onRedo={() => console.log('Redo')}
        onDelete={() => console.log('Delete')}
        onAddNode={() => console.log('Add node')}
        onToggleChat={toggleChat}
        disabled={tabValue !== 1} // Only enable shortcuts in brainstorming tab
      />

      {/* Help overlay */}
      <HelpOverlay
        tours={[
          {
            id: 'brainstorming-tour',
            title: 'Brainstorming Canvas Tour',
            description: 'Learn how to use the brainstorming canvas to organize your ideas.',
            steps: [
              {
                target: '.react-flow__pane',
                title: 'Canvas',
                content:
                  'This is your brainstorming canvas. You can add nodes, connect them, and organize your ideas here.',
                placement: 'bottom',
              },
              {
                target: '.react-flow__node',
                title: 'Nodes',
                content:
                  'These are your idea nodes. Double-click to edit them directly, or use the edit button to open the editor.',
                placement: 'right',
              },
              {
                target: '.react-flow__handle',
                title: 'Handles',
                content:
                  'Drag from these handles to connect nodes and create relationships between ideas.',
                placement: 'bottom',
              },
            ],
          },
        ]}
        tips={[
          {
            id: 'keyboard-shortcuts',
            title: 'Use Keyboard Shortcuts',
            content: 'Press Shift+? to see all available keyboard shortcuts for faster workflow.',
            category: 'Productivity',
          },
          {
            id: 'direct-editing',
            title: 'Edit Nodes Directly',
            content: 'Double-click on any node to edit its content directly on the canvas.',
            category: 'Editing',
          },
          {
            id: 'chat-assistant',
            title: 'Use the AI Assistant',
            content:
              'The chat assistant can help generate ideas and provide suggestions for your brainstorming session.',
            category: 'AI Features',
          },
        ]}
      />
    </AppShell>
  );
};

export default ProjectDetailPage;
