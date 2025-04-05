import { Box, Typography, Paper, Divider } from '@mui/material';
import { MainLayout } from '@/components/Layout/MainLayout';
import { ChatInterface } from '@/components/Chat/ChatInterface';

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
        <ChatInterface 
          title="AI Assistant"
          placeholder="Ask for ideas, suggestions, or help with your brainstorming..."
        />
      </Paper>
    </MainLayout>
  );
};
