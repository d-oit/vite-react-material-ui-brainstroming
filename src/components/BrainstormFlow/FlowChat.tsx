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
        zIndex: 5,
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <MemoizedChatPanel onAddNodes={handleSuggestionSelect} projectContext={initialContext} />
    </Paper>
  );
});

FlowChat.displayName = 'FlowChat';

export default FlowChat;
