import { Box, Paper, Typography } from '@mui/material';

import type { NodeData } from '../../types';

import { ChatPanel } from './ChatPanel';

interface ChatInterfaceProps {
  projectId?: string;
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  // Create a simple project context object
  const projectContext = projectId ? { projectId } : undefined;

  // Optional handler for adding nodes (not used in standalone chat)
  const handleAddNodes = (nodes: NodeData[]) => {
    console.log('Nodes added:', nodes);
    // In a standalone chat, we don't actually add nodes anywhere
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
        <ChatPanel
          projectId={projectId}
          projectContext={projectContext}
          onAddNodes={handleAddNodes}
        />
      </Paper>
    </Box>
  );
}
