import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Save as SaveIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { BrainstormFlow } from '../components/BrainstormFlow/BrainstormFlow';
import { ChatPanel } from '../components/Chat/ChatPanel';
import { GitHistoryPanel } from '../components/GitHistory/GitHistoryPanel';
import { useI18n } from '../contexts/I18nContext';
import { useSettings } from '../contexts/SettingsContext';
import { Node, Edge, Project } from '../types';
import projectService from '../services/ProjectService';

// Sample data for demonstration
const sampleNodes: Node[] = [
  {
    id: 'node-1',
    type: 'idea',
    position: { x: 250, y: 100 },
    data: {
      label: 'Main Idea',
      content: 'This is the central concept of our brainstorming session.',
      tags: ['important', 'core'],
    },
  },
  {
    id: 'node-2',
    type: 'task',
    position: { x: 100, y: 250 },
    data: {
      label: 'Research',
      content: 'Gather information about the topic.',
      tags: ['todo'],
    },
  },
  {
    id: 'node-3',
    type: 'note',
    position: { x: 400, y: 250 },
    data: {
      label: 'Considerations',
      content: 'Remember to think about the user experience.',
      tags: ['ux'],
    },
  },
];

const sampleEdges: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
  },
  {
    id: 'edge-1-3',
    source: 'node-1',
    target: 'node-3',
    type: 'smoothstep',
  },
];

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <Box
      role="tabpanel"
      hidden={value !== index}
      id={`sidebar-tabpanel-${index}`}
      aria-labelledby={`sidebar-tab-${index}`}
      sx={{ height: '100%' }}
      {...other}
    >
      {value === index && (
        <Box sx={{ height: '100%' }}>{children}</Box>
      )}
    </Box>
  );
}

export const SimpleBrainstormPage = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const { settings } = useSettings();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [sidebarTab, setSidebarTab] = useState(0);
  const [nodes, setNodes] = useState<Node[]>(sampleNodes);
  const [edges, setEdges] = useState<Edge[]>(sampleEdges);
  const [project, setProject] = useState<Project>({
    id: crypto.randomUUID(),
    name: 'Sample Brainstorming Project',
    description: 'A sample project for demonstration',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: '1.0.0',
    nodes: sampleNodes,
    edges: sampleEdges,
  });

  // Auto-save project if enabled
  useEffect(() => {
    if (settings.autoSave) {
      const autoSaveTimer = setTimeout(() => {
        handleSaveProject();
      }, 5000);

      return () => clearTimeout(autoSaveTimer);
    }
  }, [nodes, edges, settings.autoSave]);

  const handleSaveFlow = (updatedNodes: Node[], updatedEdges: Edge[]) => {
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    setProject(prev => ({
      ...prev,
      nodes: updatedNodes,
      edges: updatedEdges,
      updatedAt: new Date().toISOString(),
    }));
  };

  const handleSaveProject = () => {
    try {
      const updatedProject = projectService.updateProject({
        ...project,
        nodes,
        edges,
        updatedAt: new Date().toISOString(),
      });
      setProject(updatedProject);
      console.log('Project saved:', updatedProject);
    } catch (error) {
      console.error('Error saving project:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSidebarTab(newValue);
  };

  const handleProjectUpdate = (updatedProject: Project) => {
    setProject(updatedProject);
    setNodes(updatedProject.nodes);
    setEdges(updatedProject.edges);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 'calc(100vh - 64px)' }}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h1">
              {project.name}
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              {t('brainstorm.version')}: {project.version}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={handleSaveProject}
            >
              {t('common.save')}
            </Button>

            {isMobile && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ChatIcon />}
                onClick={toggleSidebar}
              >
                {t('chat.title')}
              </Button>
            )}
          </Box>
        </Box>

        <Paper
          elevation={3}
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
            height: '600px', // Fixed height for React Flow
          }}
        >
          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1, height: '600px' }}>
                <BrainstormFlow
                  initialNodes={nodes}
                  initialEdges={edges}
                  onSave={handleSaveFlow}
                />
              </Box>

              <Drawer
                anchor="right"
                open={sidebarOpen}
                onClose={toggleSidebar}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: '80%',
                    maxWidth: 400,
                  },
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                  <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs
                      value={sidebarTab}
                      onChange={handleTabChange}
                      variant="fullWidth"
                    >
                      <Tab icon={<ChatIcon />} label={t('chat.title')} />
                      <Tab icon={<HistoryIcon />} label={t('gitHistory.title')} />
                    </Tabs>
                  </Box>

                  <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                    <TabPanel value={sidebarTab} index={0}>
                      <ChatPanel projectId={project.id} projectContext={project} />
                    </TabPanel>
                    <TabPanel value={sidebarTab} index={1}>
                      <GitHistoryPanel project={project} onProjectUpdate={handleProjectUpdate} />
                    </TabPanel>
                  </Box>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', height: '600px' }}>
              <Box sx={{ flex: sidebarOpen ? 8 : 12, height: '600px' }}>
                <BrainstormFlow
                  initialNodes={nodes}
                  initialEdges={edges}
                  onSave={handleSaveFlow}
                />
              </Box>

              {sidebarOpen && (
                <Box sx={{ flex: 4, height: '600px', borderLeft: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                      <Tabs
                        value={sidebarTab}
                        onChange={handleTabChange}
                        variant="fullWidth"
                      >
                        <Tab icon={<ChatIcon />} label={t('chat.title')} />
                        <Tab icon={<HistoryIcon />} label={t('gitHistory.title')} />
                      </Tabs>
                    </Box>

                    <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                      <TabPanel value={sidebarTab} index={0}>
                        <ChatPanel projectId={project.id} projectContext={project} />
                      </TabPanel>
                      <TabPanel value={sidebarTab} index={1}>
                        <GitHistoryPanel project={project} onProjectUpdate={handleProjectUpdate} />
                      </TabPanel>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {!sidebarOpen && !isMobile && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ChatIcon />}
            onClick={toggleSidebar}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            {t('chat.title')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
