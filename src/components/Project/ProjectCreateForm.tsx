import { Info as InfoIcon, Close as CloseIcon } from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
import {
  Box,
  Button,
  // FormControl, // Unused
  // FormHelperText, // Unused
  Grid,
  // InputLabel, // Unused
  // MenuItem, // Unused
  Paper,
  // Select, // Unused
  TextField,
  Typography,
  Divider,
  Card,
  // CardMedia, // Unused
  CardContent,
  CircularProgress,
  useTheme,
  Tooltip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { useState, useEffect } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { projectTemplates } from '../../data/projectTemplates';
import { ProjectTemplate } from '../../types/project';

interface ProjectCreateFormProps {
  onSubmit: (name: string, description: string, template: ProjectTemplate) => void;
  onCancel: () => void;
  loading?: boolean;
}

export const ProjectCreateForm = ({
  onSubmit,
  onCancel,
  loading = false,
}: ProjectCreateFormProps) => {
  const { t } = useI18n();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [template, setTemplate] = useState<ProjectTemplate>(ProjectTemplate.CUSTOM);
  const [nameError, setNameError] = useState('');
  const [templateInfoOpen, setTemplateInfoOpen] = useState(false);
  const [selectedTemplateInfo, setSelectedTemplateInfo] = useState<ProjectTemplate | null>(null);

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

  // Unused handler
  // const handleTemplateChange = (event: SelectChangeEvent<string>) => {
  //   setTemplate(event.target.value as ProjectTemplate);
  // };

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

  const openTemplateInfo = (templateType: ProjectTemplate) => {
    setSelectedTemplateInfo(templateType);
    setTemplateInfoOpen(true);
  };

  const closeTemplateInfo = () => {
    setTemplateInfoOpen(false);
  };

  // Auto-generate a project name based on template if name is empty
  useEffect(() => {
    if (name === '' && template !== ProjectTemplate.CUSTOM) {
      const templateName = projectTemplates[template]?.name || '';
      if (templateName) {
        setName(`${templateName} - ${new Date().toLocaleDateString()}`);
      }
    }
  }, [template, name]);

  return (
    <>
      <Paper sx={{ p: 3, maxWidth: 600, mx: 'auto', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" component="h2">
            {t('common.create')} {t('dashboard.newProject')}
          </Typography>
          <IconButton onClick={onCancel} size="small" aria-label="close">
            <CloseIcon />
          </IconButton>
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={3} sx={{ width: '100%' }}>
            <Grid size={12}>
              <TextField
                required
                fullWidth
                id="project-name"
                label={t('project.name')}
                name="name"
                value={name}
                onChange={handleNameChange}
                error={!!nameError}
                helperText={nameError || t('project.nameHelper')}
                disabled={loading}
                // Removed autoFocus for accessibility
                InputProps={{
                  sx: { borderRadius: 1.5 },
                }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth
                id="project-description"
                label={t('project.description')}
                name="description"
                value={description}
                onChange={handleDescriptionChange}
                multiline
                rows={3}
                disabled={loading}
                placeholder={t('project.descriptionPlaceholder')}
                InputProps={{
                  sx: { borderRadius: 1.5 },
                }}
              />
            </Grid>

            <Grid size={12}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mt: 1 }}>
                {t('project.selectTemplate')}
              </Typography>

              <Grid container spacing={2} sx={{ width: '100%' }}>
                {Object.values(ProjectTemplate).map(templateType => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={templateType}>
                    <Card
                      sx={{
                        cursor: 'pointer',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        borderRadius: 2,
                        border:
                          template === templateType
                            ? `2px solid ${theme.palette.primary.main}`
                            : '1px solid rgba(0,0,0,0.12)',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => setTemplate(templateType)}
                    >
                      <CardContent sx={{ flexGrow: 1, p: 2 }}>
                        <Box
                          sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                          }}
                        >
                          <Typography
                            variant="subtitle1"
                            component="div"
                            sx={{ fontWeight: 'bold' }}
                          >
                            {projectTemplates[templateType]?.name || templateType}
                          </Typography>
                          <Tooltip title={t('project.moreInfo')}>
                            <IconButton
                              size="small"
                              onClick={e => {
                                e.stopPropagation();
                                openTemplateInfo(templateType);
                              }}
                            >
                              <InfoIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 1, fontSize: '0.8rem' }}
                        >
                          {getTemplateDescription(templateType)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Grid>

            <Grid size={12}>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                <Button onClick={onCancel} disabled={loading} sx={{ borderRadius: 1.5 }}>
                  {t('common.cancel')}
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading || name.trim() === ''}
                  sx={{
                    borderRadius: 1.5,
                    minWidth: 100,
                  }}
                >
                  {loading ? (
                    <>
                      <CircularProgress size={20} color="inherit" sx={{ mr: 1 }} />
                      {t('common.creating')}
                    </>
                  ) : (
                    t('common.create')
                  )}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Template Info Dialog */}
      <Dialog open={templateInfoOpen} onClose={closeTemplateInfo} maxWidth="sm" fullWidth>
        {selectedTemplateInfo && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {projectTemplates[selectedTemplateInfo]?.name || selectedTemplateInfo}
                <IconButton onClick={closeTemplateInfo} size="small">
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" paragraph>
                {projectTemplates[selectedTemplateInfo]?.description}
              </Typography>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'medium', mt: 2 }}>
                {t('project.templateIncludes')}:
              </Typography>
              <ul>
                {projectTemplates[selectedTemplateInfo]?.features?.map((feature, index) => (
                  <li key={index}>
                    <Typography variant="body2">{feature}</Typography>
                  </li>
                ))}
              </ul>
            </DialogContent>
            <DialogActions>
              <Button onClick={closeTemplateInfo}>{t('common.close')}</Button>
              <Button
                variant="contained"
                color="primary"
                onClick={() => {
                  setTemplate(selectedTemplateInfo);
                  closeTemplateInfo();
                }}
              >
                {t('project.useTemplate')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </>
  );
};

export default ProjectCreateForm;
