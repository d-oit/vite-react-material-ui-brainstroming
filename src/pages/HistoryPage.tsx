import { Box, Typography, Paper, CircularProgress, Tabs, Tab, Divider } from '@mui/material';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { GitHistoryViewer } from '@/components/GitHistory/GitHistoryViewer';
import { MainLayout } from '@/components/Layout/MainLayout';
import { useProject } from '@/hooks/useProject';

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
      id={`history-tabpanel-${index}`}
      aria-labelledby={`history-tab-${index}`}
      style={{ height: 'calc(100% - 48px)' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 2, height: '100%' }}>{children}</Box>}
    </div>
  );
};

export const HistoryPage = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const [tabValue, setTabValue] = useState(0);

  const { project, loading, error } = useProject({ projectId });

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <MainLayout title="Project History">
        <Box
          sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}
        >
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !project) {
    return (
      <MainLayout title="Project History">
        <Paper sx={{ p: 3 }}>
          <Typography color="error" variant="h6">
            Error: {error || 'Project not found'}
          </Typography>
        </Paper>
      </MainLayout>
    );
  }

  return (
    <MainLayout title={`History: ${project.name}`}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          {project.name} - History
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Current Version: {project.version}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Box sx={{ height: 'calc(100vh - 200px)' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="history tabs">
            <Tab label="Git History" id="history-tab-0" aria-controls="history-tabpanel-0" />
            <Tab label="Version History" id="history-tab-1" aria-controls="history-tabpanel-1" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <GitHistoryViewer projectId={project.id} />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Version History
            </Typography>
            <Typography variant="body1" color="text.secondary">
              This feature will display the version history of the project, showing different
              versions and allowing you to compare or restore previous versions.
            </Typography>
          </Box>
        </TabPanel>
      </Box>
    </MainLayout>
  );
};
