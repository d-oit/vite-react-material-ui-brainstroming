import { Box, Paper, Tab, Tabs } from '@mui/material';
import React, { useCallback, useState } from 'react';

import { useActionFeedback } from '../../contexts/ActionFeedbackContext';
import { useI18n } from '../../contexts/I18nContext';

import ComprehensiveBrainstorm from './ComprehensiveBrainstorm';
import LLMChatPanel from './LLMChatPanel';
import QuickBrainstorm from './QuickBrainstorm';
import type { BrainstormingProps, BrainstormSession, BrainstormNode } from './types';

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
      id={`brainstorm-tabpanel-${index}`}
      aria-labelledby={`brainstorm-tab-${index}`}
      {...other}
      sx={{ height: 'calc(100% - 48px)', overflow: 'auto' }}
    >
      {value === index && children}
    </Box>
  );
}

export default function BrainstormingSuite({ projectId, onSave, onClose }: BrainstormingProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [session, setSession] = useState<BrainstormSession | null>(null);
  const { t } = useI18n();
  const { showNotification } = useActionFeedback();

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleSave = useCallback(
    async (updatedSession: BrainstormSession) => {
      try {
        await onSave?.(updatedSession);
        setSession(updatedSession);
        showNotification({ message: t('brainstorming.saved'), severity: 'success' });
      } catch (error) {
        console.error('Failed to save brainstorming session:', error);
        showNotification({ message: t('brainstorming.saveFailed'), severity: 'error' });
      }
    },
    [onSave, showNotification, t]
  );

  const handleQuickConvert = useCallback(async (quickSession: BrainstormSession) => {
    setSession({ ...quickSession, isQuick: false });
    setActiveTab(0); // Switch to comprehensive view
  }, []);

  const handleInsightGenerated = useCallback(
    (insight: BrainstormNode) => {
      if (session) {
        void handleSave({
          ...session,
          nodes: [...session.nodes, insight],
        });
      }
    },
    [session, handleSave]
  );

  return (
    <Paper
      elevation={3}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Tabs
        value={activeTab}
        onChange={handleTabChange}
        aria-label={t('brainstorming.tabsLabel')}
        sx={{ borderBottom: 1, borderColor: 'divider' }}
      >
        <Tab label={t('brainstorming.comprehensive')} id="brainstorm-tab-0" />
        <Tab label={t('brainstorming.quick')} id="brainstorm-tab-1" />
        <Tab label={t('brainstorming.llmChat')} id="brainstorm-tab-2" />
      </Tabs>

      <TabPanel value={activeTab} index={0}>
        <ComprehensiveBrainstorm
          projectId={projectId}
          session={session}
          onSave={handleSave}
          onClose={onClose}
        />
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <QuickBrainstorm onSave={handleSave} onClose={onClose} onConvert={handleQuickConvert} />
      </TabPanel>

      <TabPanel value={activeTab} index={2}>
        <LLMChatPanel
          projectId={projectId}
          session={session}
          onInsightGenerated={handleInsightGenerated}
        />
      </TabPanel>
    </Paper>
  );
}
