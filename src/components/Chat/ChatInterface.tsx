import { Box, Paper, Typography } from '@mui/material';

import type { NodeData } from '../../types';

import { ChatPanel } from './ChatPanel';

interface ChatInterfaceProps {
  projectId?: string;
}

export function ChatInterface({ projectId }: ChatInterfaceProps) {
  // Create a simple project context object
  const projectContext =
    projectId !== undefined && projectId !== null && projectId !== '' ? { projectId } : undefined;

  // Optional handler for adding nodes (not used in standalone chat)
  const handleAddNodes = (nodes: NodeData[]) => {
    console.log('Nodes added:', nodes);
    // In a standalone chat, we don't actually add nodes anywhere
  };

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          p: { xs: 1, sm: 2 },
          pt: 0,
        }}
      >
        <ChatPanel
          projectId={projectId}
          projectContext={projectContext}
          onAddNodes={handleAddNodes}
        />
      </Box>
    </Box>
  );
}
