import { Box, Typography, Paper, Divider } from '@mui/material';

import { ChatInterface } from '@/components/Chat/ChatInterface';
import { MainLayout } from '@/components/Layout/MainLayout';

export const ChatPage = () => {
  return (
    <MainLayout title="Chat Assistant">
      <Box sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1">
          Brainstorming Assistant
        </Typography>
        <Typography variant="subtitle2" color="text.secondary">
          Powered by OpenRouter AI
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <Paper sx={{ height: 'calc(100vh - 200px)', overflow: 'hidden' }}>
        <ChatInterface projectId="chat" />
      </Paper>
    </MainLayout>
  );
};
