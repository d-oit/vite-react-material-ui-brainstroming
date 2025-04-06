import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
  SelectChangeEvent,
} from '@mui/material';
import { useState } from 'react';

import { projectTemplates } from '../../data/projectTemplates';
import { ProjectTemplate } from '../../types/project';

interface ProjectCreateFormProps {
  onSubmit: (name: string, description: string, template: ProjectTemplate) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ProjectCreateForm = ({ onSubmit, onCancel, loading = false }: ProjectCreateFormProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>(ProjectTemplate.CUSTOM);
  const [nameError, setNameError] = useState('');

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setName(value);
    if (value.trim() === '') {
      setNameError('Project name is required');
    } else {
      setNameError('');
    }
  };

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(event.target.value);
  };

  const handleTemplateChange = (event: SelectChangeEvent<string>) => {
    setTemplate(event.target.value as ProjectTemplate);
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (name.trim() === '') {
      setNameError('Project name is required');
      return;
    }

    onSubmit(name, description, template);
  };

  const getTemplateDescription = (templateType: ProjectTemplate): string => {
    return projectTemplates[templateType]?.description || '';
  };

  return (
    <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h5" component="h2" gutterBottom>
        Create New Project
      </Typography>

      <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              required
              fullWidth
              id="project-name"
              label="Project Name"
              name="name"
              value={name}
              onChange={handleNameChange}
              error={!!nameError}
              helperText={nameError}
              disabled={loading}
              autoFocus
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              fullWidth
              id="project-description"
              label="Description"
              name="description"
              value={description}
              onChange={handleDescriptionChange}
              multiline
              rows={3}
              disabled={loading}
            />
          </Grid>

          <Grid item xs={12}>
            <FormControl fullWidth disabled={loading}>
              <InputLabel id="template-label">Template</InputLabel>
              <Select
                labelId="template-label"
                id="template"
                value={template}
                label="Template"
                onChange={handleTemplateChange}
              >
                {Object.values(ProjectTemplate).map((templateType) => (
                  <MenuItem key={templateType} value={templateType}>
                    {projectTemplates[templateType]?.name || templateType}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>
                {getTemplateDescription(template)}
              </FormHelperText>
            </FormControl>
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
              <Button onClick={onCancel} disabled={loading}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading || name.trim() === ''}
              >
                {loading ? 'Creating...' : 'Create'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default ProjectCreateForm;
