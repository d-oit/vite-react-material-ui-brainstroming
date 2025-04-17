import { Dashboard as DashboardIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import { Box, Container, Paper, Tabs, Tab, Typography } from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import AppShell from '../components/Layout/AppShell';
import ProjectArchivePanel from '../components/ProjectArchive/ProjectArchivePanel';
import ProjectList from '../components/ProjectList/ProjectList';
import type { Project } from '../types';

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

interface ProjectDashboardProps {
  onThemeToggle: () => void;
  isDarkMode: boolean;
}

export const ProjectDashboard: React.FC<ProjectDashboardProps> = ({
  onThemeToggle,
  isDarkMode,
}) => {
  const _navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleCreateProject = (project: Project) => {
    // Optionally navigate to the new project
    // navigate(`/brainstorm/${project.id}`);
  };

  return (
    <AppShell title="Project Dashboard" onThemeToggle={onThemeToggle} isDarkMode={isDarkMode}>
      <Container 
        maxWidth="xl" 
        sx={{ 
          py: 2,
          px: { xs: 0.5, sm: 1 }, // Minimal horizontal padding
        }}
      >
        <Box sx={{ mb: 2 }}> {/* Reduced margin from 3 to 2 */}
          <Typography variant="h5" component="h1" gutterBottom>
            My Projects
          </Typography>
          <Typography variant="subtitle2" color="text.secondary">
            Manage your brainstorming projects and archives
          </Typography>
        </Box>

        <Paper sx={{ mb: 4, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              aria-label="project dashboard tabs"
              variant="fullWidth"
            >
              <Tab
                icon={<DashboardIcon />}
                label="Projects"
                id="project-tab-0"
                aria-controls="project-tabpanel-0"
              />
              <Tab
                icon={<ArchiveIcon />}
                label="Archive"
                id="project-tab-1"
                aria-controls="project-tabpanel-1"
              />
            </Tabs>
          </Box>

          <TabPanel value={tabValue} index={0}>
            <ProjectList
              key={`projects-${refreshKey}`}
              onCreateProject={handleCreateProject}
              onRefresh={handleRefresh}
            />
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <ProjectArchivePanel key={`archive-${refreshKey}`} onRefresh={handleRefresh} />
          </TabPanel>
        </Paper>
      </Container>
    </AppShell>
  );
};

export default ProjectDashboard;



