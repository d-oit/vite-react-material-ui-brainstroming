import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Add as AddIcon,
  BubbleChart as BrainstormIcon,
  History as HistoryIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import { MainLayout } from '@/components/Layout/MainLayout';
import { Project } from '@/types';

// Mock projects data (in a real app, this would come from a backend or local storage)
const mockProjects: Project[] = [
  {
    id: '1',
    name: 'Product Roadmap',
    description: 'Planning the next 6 months of product development',
    createdAt: '2023-03-15T10:00:00Z',
    updatedAt: '2023-03-20T14:30:00Z',
    version: '1.2.0',
    nodes: [],
    edges: [],
  },
  {
    id: '2',
    name: 'Marketing Campaign',
    description: 'Q2 marketing initiatives and content strategy',
    createdAt: '2023-02-10T09:15:00Z',
    updatedAt: '2023-03-18T11:45:00Z',
    version: '2.0.1',
    nodes: [],
    edges: [],
  },
  {
    id: '3',
    name: 'App Redesign',
    description: 'UI/UX improvements for the mobile application',
    createdAt: '2023-01-05T16:20:00Z',
    updatedAt: '2023-03-10T13:10:00Z',
    version: '3.1.0',
    nodes: [],
    edges: [],
  },
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  useEffect(() => {
    // Simulate loading projects from API or local storage
    const loadProjects = () => {
      setTimeout(() => {
        setProjects(mockProjects);
        setLoading(false);
      }, 1000);
    };

    loadProjects();
  }, []);

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;

    const newProject: Project = {
      id: `${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: '0.1.0',
      nodes: [],
      edges: [],
    };

    setProjects([newProject, ...projects]);
    setCreateDialogOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleDeleteProject = (id: string) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <MainLayout title="Dashboard">
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1">
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

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : projects.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <BrainstormIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2, opacity: 0.7 }} />
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
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {projects.map(project => (
              <Grid item xs={12} sm={6} md={4} key={project.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="h6" component="h2" gutterBottom>
                        {project.name}
                      </Typography>
                      <Box>
                        <IconButton size="small" onClick={() => navigate(`/projects/edit/${project.id}`)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteProject(project.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <Typography variant="body2" color="text.secondary" paragraph>
                      {project.description}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                      <Typography variant="caption" color="text.secondary">
                        Created: {formatDate(project.createdAt)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        v{project.version}
                      </Typography>
                    </Box>
                  </CardContent>
                  <Divider />
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<BrainstormIcon />}
                      onClick={() => navigate(`/brainstorm/${project.id}`)}
                    >
                      Open
                    </Button>
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => navigate(`/history/${project.id}`)}
                    >
                      History
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
        <DialogTitle>Create New Project</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Project Name"
            fullWidth
            value={newProjectName}
            onChange={e => setNewProjectName(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            value={newProjectDescription}
            onChange={e => setNewProjectDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleCreateProject}
            variant="contained"
            color="primary"
            disabled={!newProjectName.trim()}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </MainLayout>
  );
};
