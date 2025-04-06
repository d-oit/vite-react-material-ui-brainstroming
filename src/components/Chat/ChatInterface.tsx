import { Box, Paper, Typography } from '@mui/material';
import { useState } from 'react';

import { ChatPanel } from './ChatPanel';

interface ChatInterfaceProps {
  projectId?: string;
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Array<{ role: string; content: string }>>([]);

  const handleSendMessage = (message: string) => {
    // Add user message
    const newMessages = [...messages, { role: 'user', content: message }];
    setMessages(newMessages);

    // Simulate AI response
    setTimeout(() => {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: `I received your message about "${message}" related to project ${projectId || 'unknown'}. This is a placeholder response.`,
        },
      ]);
    }, 1000);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Paper
        elevation={0}
        sx={{ p: 2, flexGrow: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}
      >
        <Typography variant="h6" gutterBottom>
          Chat Assistant
        </Typography>
        <ChatPanel messages={messages} onSendMessage={handleSendMessage} projectId={projectId} />
      </Paper>
    </Box>
  );
}
