import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
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
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../components/Layout/AppShell';
import { useI18n } from '../contexts/I18nContext';
import { projectTemplates, createProjectFromTemplate } from '../data/projectTemplates';
import projectService from '../services/ProjectService';
import type { Project } from '../types';
import { ProjectTemplate } from '../types/project';

// Sample template thumbnails
const templateImages = [
  '/templates/blank.png',
  '/templates/business-model-canvas.png',
  '/templates/swot-analysis.png',
  '/templates/mind-map.png',
  '/templates/kanban.png',
];

// Convert project templates to Project array
const sampleTemplates: Project[] = Object.values(projectTemplates).map((template, index) => ({
  id: `template-${Object.keys(projectTemplates)[index]}`,
  name: template.name || 'Unnamed Template',
  description: template.description || '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  version: 1,
  nodes: template.nodes || [],
  edges: template.edges || [],
  isTemplate: true,
  template: template.template,
}));

interface ProjectTemplatesPageProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export const ProjectTemplatesPage = ({ onThemeToggle, isDarkMode }: ProjectTemplatesPageProps) => {
  const theme = useTheme();
  const { t } = useI18n();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  // Use isMobile for responsive layout adjustments
  const [templates, setTemplates] = useState<Project[]>(sampleTemplates);
  const [selectedTemplate, setSelectedTemplate] = useState<Project | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [_error, setError] = useState<string | null>(null);

  const handleCreateFromTemplate = async (): Promise<void> => {
    if (!selectedTemplate || !newProjectName.trim()) return;

    try {
      setLoading(true);
      // Create a new project based on the template
      let newProject;

      if (selectedTemplate?.template) {
        // Use the template type if available
        newProject = createProjectFromTemplate(
          selectedTemplate.template,
          newProjectName,
          newProjectDescription || selectedTemplate.description || ''
        );

        // Save the project to the database
        newProject = await projectService.saveProject(newProject);
      } else {
        // Fallback to simple project creation
        newProject = await projectService.createProject(
          newProjectName,
          newProjectDescription || selectedTemplate?.description || ''
        );
      }

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
      title={t('project.templates')}
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
              {t('project.templates')}
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateNewTemplate}>
              {t('project.createTemplate')}
            </Button>
          </Box>

          <Divider sx={{ mb: 4 }} />

          <Grid container spacing={3} sx={{ width: '100%' }}>
            {templates.map((template, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={template.id}>
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
              onClick={() => void handleCreateFromTemplate()}
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
              Are you sure you want to delete the &quot;{selectedTemplate?.name}&quot; template?
              This action cannot be undone.
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
