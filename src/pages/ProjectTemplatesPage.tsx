import {
  Add as AddIcon,
  ContentCopy as DuplicateIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { AppShell } from '../components/Layout/AppShell';
import { useI18n } from '../contexts/I18nContext';
import projectService from '../services/ProjectService';
import type { Project } from '../types';

// Sample template thumbnails
const templateImages = [
  '/templates/blank.png',
  '/templates/business-model-canvas.png',
  '/templates/swot-analysis.png',
  '/templates/mind-map.png',
  '/templates/kanban.png',
];

// Sample templates
const sampleTemplates: Project[] = [
  {
    id: 'template-blank',
    name: 'Blank Canvas',
    description: 'Start with a clean slate for any type of brainstorming session.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: [],
    edges: [],
    isTemplate: true,
  },
  {
    id: 'template-business-model',
    name: 'Business Model Canvas',
    description: 'Visualize your business model with this structured template.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: [],
    edges: [],
    isTemplate: true,
  },
  {
    id: 'template-swot',
    name: 'SWOT Analysis',
    description: 'Analyze Strengths, Weaknesses, Opportunities, and Threats.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: [],
    edges: [],
    isTemplate: true,
  },
  {
    id: 'template-mind-map',
    name: 'Mind Map',
    description: 'Organize ideas around a central concept with this mind mapping template.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: [],
    edges: [],
    isTemplate: true,
  },
  {
    id: 'template-kanban',
    name: 'Kanban Board',
    description: 'Visualize your workflow with To Do, In Progress, and Done columns.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    version: 1,
    nodes: [],
    edges: [],
    isTemplate: true,
  },
];

interface ProjectTemplatesPageProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export const ProjectTemplatesPage = ({ onThemeToggle, isDarkMode }: ProjectTemplatesPageProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const [templates, setTemplates] = useState<Project[]>(sampleTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateFromTemplate = async () => {
    if (!selectedTemplate || !newProjectName.trim()) return;

    try {
      setLoading(true);
      // Create a new project based on the template
      const newProject = await projectService.createProject(
        newProjectName,
        newProjectDescription || selectedTemplate.description
      );

      // Navigate to the new project
      navigate(`/projects/${newProject.id}`);
    } catch (err) {
      console.error('Error creating project from template:', err);
      setError('Failed to create project from template');
    } finally {
      setLoading(false);
      setCreateDialogOpen(false);
      setNewProjectName('');
      setNewProjectDescription('');
      setSelectedTemplate(null);
    }
  };

  const handleUseTemplate = (template: Project) => {
    setSelectedTemplate(template);
    setNewProjectName(`${template.name} - ${new Date().toLocaleDateString()}`);
    setNewProjectDescription(template.description);
    setCreateDialogOpen(true);
  };

  const handleEditTemplate = (template: Project) => {
    setSelectedTemplate(template);
    setNewProjectName(template.name);
    setNewProjectDescription(template.description);
    setEditDialogOpen(true);
  };

  const handleDeleteTemplate = (template: Project) => {
    setSelectedTemplate(template);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteTemplate = () => {
    if (!selectedTemplate) return;

    // Remove the template from the list
    setTemplates(templates.filter(t => t.id !== selectedTemplate.id));
    setDeleteDialogOpen(false);
    setSelectedTemplate(null);
  };

  const confirmEditTemplate = () => {
    if (!selectedTemplate || !newProjectName.trim()) return;

    // Update the template
    const updatedTemplates = templates.map(t =>
      t.id === selectedTemplate.id
        ? {
            ...t,
            name: newProjectName,
            description: newProjectDescription,
            updatedAt: new Date().toISOString(),
          }
        : t
    );

    setTemplates(updatedTemplates);
    setEditDialogOpen(false);
    setSelectedTemplate(null);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  const handleCreateNewTemplate = () => {
    setSelectedTemplate(null);
    setNewProjectName('New Template');
    setNewProjectDescription('');
    setEditDialogOpen(true);
  };

  const confirmCreateNewTemplate = () => {
    if (!newProjectName.trim()) return;

    // Create a new template
    const newTemplate: Project = {
      id: `template-${Date.now()}`,
      name: newProjectName,
      description: newProjectDescription,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
      nodes: [],
      edges: [],
      isTemplate: true,
    };

    setTemplates([...templates, newTemplate]);
    setEditDialogOpen(false);
    setNewProjectName('');
    setNewProjectDescription('');
  };

  return (
    <AppShell
      title="Project Templates"
      onThemeToggle={onThemeToggle}
      isDarkMode={isDarkMode}
      onCreateNew={handleCreateNewTemplate}
    >
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box
            sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}
          >
            <Typography variant="h4" component="h1">
              Project Templates
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNewTemplate}>
              Create Template
            </Button>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3}>
            {templates.map((template, index) => (
              <Grid item xs={12} sm={6} md={4} key={template.id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 6,
                    },
                  }}
                >
                  <CardMedia
                    component="img"
                    height="140"
                    image={templateImages[index % templateImages.length] || '/templates/blank.png'}
                    alt={template.name}
                  />
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="div">
                      {template.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {template.description}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                    <Button
                      size="small"
                      variant="contained"
                      onClick={() => handleUseTemplate(template)}
                    >
                      Use Template
                    </Button>
                    <Box>
                      <IconButton
                        size="small"
                        onClick={() => handleEditTemplate(template)}
                        aria-label="Edit template"
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => handleDeleteTemplate(template)}
                        aria-label="Delete template"
                        color="error"
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Create Project from Template Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)}>
          <DialogTitle>Create Project from Template</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Create a new project based on the &quot;{selectedTemplate?.name}&quot; template.
            </DialogContentText>
            <TextField
              // autoFocus removed for accessibility
              // autoFocus
              margin="dense"
              label="Project Name"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Project Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newProjectDescription}
              onChange={e => setNewProjectDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={handleCreateFromTemplate}
              variant="contained"
              disabled={!newProjectName.trim() || loading}
            >
              Create Project
            </Button>
          </DialogActions>
        </Dialog>

        {/* Edit Template Dialog */}
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)}>
          <DialogTitle>{selectedTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
          <DialogContent>
            <TextField
              // autoFocus removed for accessibility
              // autoFocus
              margin="dense"
              label="Template Name"
              fullWidth
              variant="outlined"
              value={newProjectName}
              onChange={e => setNewProjectName(e.target.value)}
              sx={{ mt: 2 }}
            />
            <TextField
              margin="dense"
              label="Template Description"
              fullWidth
              multiline
              rows={3}
              variant="outlined"
              value={newProjectDescription}
              onChange={e => setNewProjectDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={selectedTemplate ? confirmEditTemplate : confirmCreateNewTemplate}
              variant="contained"
              disabled={!newProjectName.trim()}
            >
              {selectedTemplate ? 'Save Changes' : 'Create Template'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Template Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onClose={() => setDeleteDialogOpen(false)}>
          <DialogTitle>Delete Template</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the &quot;{selectedTemplate?.name}&quot; template? This action
              cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button onClick={confirmDeleteTemplate} color="error">
              Delete
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </AppShell>
  );
};

export default ProjectTemplatesPage;
