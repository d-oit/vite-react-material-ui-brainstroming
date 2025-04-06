import { Dashboard as DashboardIcon, Archive as ArchiveIcon } from '@mui/icons-material';
import { Box, Container, Paper, Tabs, Tab, Typography, Divider } from '@mui/material';
import React, { useState } from 'react';

import { AppShell } from '../components/Layout/AppShell';
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
      style={{ height: 'calc(100% - 48px)', overflow: 'auto' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3, height: '100%' }}>{children}</Box>}
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
      <Container maxWidth="lg" sx={{ height: 'calc(100vh - 64px)', py: 4 }}>
        <Paper sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
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
