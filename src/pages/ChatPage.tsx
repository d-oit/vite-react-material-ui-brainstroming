import { Box, Typography, Paper, Divider } from '@mui/material';

import { ChatInterface } from '@/components/Chat/ChatInterface';
import { MainLayout } from '@/components/Layout/MainLayout';

import { useI18n } from '../contexts/I18nContext';

export const ChatPage = () => {
  const { t } = useI18n();
  return (
    <MainLayout title={t('chat.chatAssistant')}>
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          {t('chat.brainstormingAssistant')}
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          {t('chat.poweredBy')}
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <ChatInterface projectId="chat" />
      </Paper>
    </MainLayout>
  );
};
