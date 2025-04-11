import {
  Save as SaveIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Add as AddIcon,
  Edit as EditIcon,
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
  Fab,
  Tooltip,
  TextField,
} from '@mui/material';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';

import KeyboardShortcutsHandler from '../components/BrainstormFlow/KeyboardShortcutsHandler';
import { ChatInterface } from '../components/Chat/ChatInterface';
import HelpOverlay from '../components/Help/HelpOverlay';
import AppShell from '../components/Layout/AppShell';
import { ProjectBrainstormingSection } from '../components/Project/ProjectBrainstormingSection';
import ProjectSettingsSection from '../components/Project/ProjectSettingsSection';
import { useProject } from '../hooks/useProject';
import type { Node, Edge, Project } from '../types';
import type { NodeSuggestion } from '../types/chat';

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
  const [chatOpen, setChatOpen] = useState(false); // Chat closed by default
  const [_nodes, setNodes] = useState<Node[]>([]);
  const [_edges, setEdges] = useState<Edge[]>([]);
  const [tabValue, setTabValue] = useState(0);

  // State for editable fields
  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedDescription, setEditedDescription] = useState('');

  const { project, loading, error, isSaving, saveProject, createNewVersion } = useProject({
    projectId,
    autoSave: true,
  });

  useEffect(() => {
    if (project !== null && project !== undefined) {
      setNodes(project.nodes);
      setEdges(project.edges);
      setEditedName(project.name);
      setEditedDescription(project.description || '');
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

  // Function to save edited project details
  const handleSaveProjectDetails = async () => {
    if (project !== null && project !== undefined) {
      const updatedProject = {
        ...project,
        name: editedName,
        description: editedDescription,
      };

      // Save the project with updated details
      await saveProject(updatedProject);

      // Exit editing mode
      setIsEditingName(false);
      setIsEditingDescription(false);
    }
  };

  // Function to handle adding nodes from chat suggestions
  const handleAddNodesFromChat = useCallback(
    (suggestions: NodeSuggestion[]) => {
      if (!project) return;

      // Implementation would go here - for now just log the suggestions
      console.log('Adding nodes from chat suggestions:', suggestions);

      // In a real implementation, you would:
      // 1. Convert suggestions to actual nodes
      // 2. Add them to the current nodes array
      // 3. Update the project
    },
    [project]
  );

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
      <Box
        sx={{
          mb: 2,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: { xs: 'wrap', sm: 'nowrap' },
        }}
      >
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            flexGrow: 1,
            mr: 2,
            mb: { xs: 2, sm: 0 },
          }}
        >
          {isEditingName ? (
            <TextField
              fullWidth
              variant="outlined"
              size="small"
              value={editedName}
              onChange={e => setEditedName(e.target.value)}
              autoFocus
              onBlur={() => {
                if (editedName.trim() !== '') {
                  void handleSaveProjectDetails();
                } else {
                  setEditedName(project.name);
                  setIsEditingName(false);
                }
              }}
              onKeyDown={e => {
                if (e.key === 'Enter' && editedName.trim() !== '') {
                  void handleSaveProjectDetails();
                } else if (e.key === 'Escape') {
                  setEditedName(project.name);
                  setIsEditingName(false);
                }
              }}
              InputProps={{
                sx: { borderRadius: 1 },
              }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography variant="h5" component="h1" sx={{ wordBreak: 'break-word' }}>
                {project.name}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setIsEditingName(true)}
                sx={{ ml: 1, color: 'primary.main' }}
                aria-label="Edit project name"
              >
                <EditIcon fontSize="small" />
              </IconButton>
            </Box>
          )}
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
            size={isMobile ? 'small' : 'medium'}
          >
            {isSaving ? 'Saving...' : 'Save'}
          </Button>

          <Button
            variant="outlined"
            onClick={() => {
              void handleCreateNewVersion();
            }}
            disabled={isSaving}
            size={isMobile ? 'small' : 'medium'}
          >
            New Version
          </Button>

          <Button
            variant="contained"
            color="secondary"
            startIcon={<ChatIcon />}
            onClick={toggleChat}
            size={isMobile ? 'small' : 'medium'}
          >
            Assistant
          </Button>
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
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'medium' }}>
              Project Details
            </Typography>
            {isEditingDescription ? (
              <Button
                variant="contained"
                size="small"
                onClick={handleSaveProjectDetails}
                startIcon={<SaveIcon />}
                sx={{ boxShadow: theme => theme.shadows[2] }}
              >
                Save
              </Button>
            ) : (
              <Button
                variant="outlined"
                size="small"
                onClick={() => setIsEditingDescription(true)}
                startIcon={<EditIcon />}
                sx={{ borderColor: 'primary.main' }}
              >
                Edit Description
              </Button>
            )}
          </Box>

          {isEditingDescription ? (
            <TextField
              fullWidth
              multiline
              rows={4}
              variant="outlined"
              value={editedDescription}
              onChange={e => setEditedDescription(e.target.value)}
              placeholder="Enter project description"
              sx={{ mb: 2 }}
              InputProps={{
                sx: {
                  borderRadius: 1,
                  '&:focus-within': {
                    borderColor: 'primary.main',
                  },
                },
              }}
            />
          ) : (
            <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
              {project.description !== null &&
              project.description !== undefined &&
              project.description !== ''
                ? project.description
                : 'No description provided.'}
            </Typography>
          )}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: chatOpen ? { xs: '1fr', md: '1fr 350px' } : '1fr',
            gridTemplateRows: chatOpen && isMobile ? '1fr 300px' : '1fr',
            gap: 2,
            height: { xs: 'calc(100vh - 200px)', md: 'calc(100vh - 180px)' },
            position: 'relative',
            transition: 'all 0.3s ease',
            overflow: 'hidden',
          }}
        >
          {/* Main brainstorming area */}
          <Box
            sx={{
              gridColumn: '1',
              gridRow: '1',
              height: '100%',
              width: '100%',
              overflow: 'hidden',
              borderRadius: 1,
              boxShadow: theme => theme.shadows[1],
              border: '1px solid',
              borderColor: 'divider',
              bgcolor: 'background.paper',
            }}
          >
            <ProjectBrainstormingSection
              projectId={project.id}
              template={project.template}
              initialNodes={project.nodes}
              initialEdges={project.edges}
              syncSettings={project.syncSettings}
              readOnly={isSaving}
            />
          </Box>

          {/* Chat panel with responsive design */}
          {chatOpen && (
            <Box
              sx={{
                gridColumn: { xs: '1', md: '2' },
                gridRow: { xs: '2', md: '1' },
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderRadius: 1,
                overflow: 'hidden',
                border: '1px solid',
                borderColor: 'divider',
                boxShadow: theme => theme.shadows[1],
                bgcolor: 'background.paper',
              }}
            >
              {/* Chat header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 1.5,
                  borderBottom: 1,
                  borderColor: 'divider',
                  bgcolor: theme =>
                    theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                }}
              >
                <Typography variant="subtitle1" fontWeight="medium">
                  AI Assistant
                </Typography>
                <IconButton
                  size="small"
                  onClick={toggleChat}
                  aria-label="Close chat"
                  sx={{ color: 'text.secondary' }}
                >
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Chat content */}
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <ChatInterface
                  onAddNodes={handleAddNodesFromChat}
                  projectContext={{
                    projectId: project.id,
                    projectName: project.name,
                    projectDescription: project.description || '',
                    template: project.template,
                  }}
                />
              </Box>
            </Box>
          )}
        </Box>
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
