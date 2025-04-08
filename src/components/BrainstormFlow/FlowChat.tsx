import { Close as CloseIcon } from '@mui/icons-material';
import { Box, IconButton, Paper } from '@mui/material';
import { memo, useCallback } from 'react';

import type { NodeData } from '../../types';
import { MemoizedChatPanel } from '../Chat/ChatPanel';

interface FlowChatProps {
  onClose: () => void;
  onAddNodes: (nodes: NodeData[]) => void;
  initialContext?: {
    nodeCount: number;
    edgeCount: number;
  };
}

const FlowChat = memo(({ onClose, onAddNodes, initialContext }: FlowChatProps) => {
  const handleSuggestionSelect = useCallback(
    (nodeDatas: NodeData[]) => {
      onAddNodes(nodeDatas);
    },
    [onAddNodes]
  );

  return (
    <Paper
      elevation={3}
      sx={{
        position: 'absolute',
        top: 16,
        right: 16,
        width: { xs: '90vw', sm: 350 },
        height: { xs: '70vh', sm: 500 },
        maxWidth: { xs: 'calc(100vw - 32px)', sm: 350 },
        maxHeight: { xs: 'calc(100vh - 120px)', sm: 500 },
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        zIndex: 20,
        borderRadius: 2,
        boxShadow: theme => theme.shadows[8],
      }}
    >
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        p: 1,
        borderBottom: theme => `1px solid ${theme.palette.divider}`,
        backgroundColor: theme => theme.palette.background.paper,
      }}>
        <Box sx={{ pl: 1, fontWeight: 'medium', fontSize: '0.9rem' }}>Brainstorming Assistant</Box>
        <IconButton onClick={onClose} size="small" aria-label="Close chat">
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>
      <MemoizedChatPanel onAddNodes={handleSuggestionSelect} projectContext={initialContext} />
    </Paper>
  );
});

FlowChat.displayName = 'FlowChat';

export default FlowChat;
