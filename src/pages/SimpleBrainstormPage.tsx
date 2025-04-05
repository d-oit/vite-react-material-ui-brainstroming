import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Container,
  Grid,
  useMediaQuery,
  useTheme,
  Drawer,
  IconButton,
  AppBar,
  Toolbar,
} from '@mui/material';
import {
  Save as SaveIcon,
  Chat as ChatIcon,
  Close as CloseIcon,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { BrainstormFlow } from '../components/BrainstormFlow/BrainstormFlow';
import { useI18n } from '../contexts/I18nContext';
import { Node, Edge } from '../types';

// Sample data for demonstration
const sampleNodes: Node[] = [
  {
    id: 'node-1',
    type: 'idea',
    position: { x: 250, y: 100 },
    data: {
      label: 'Main Idea',
      content: 'This is the central concept of our brainstorming session.',
      tags: ['important', 'core'],
    },
  },
  {
    id: 'node-2',
    type: 'task',
    position: { x: 100, y: 250 },
    data: {
      label: 'Research',
      content: 'Gather information about the topic.',
      tags: ['todo'],
    },
  },
  {
    id: 'node-3',
    type: 'note',
    position: { x: 400, y: 250 },
    data: {
      label: 'Considerations',
      content: 'Remember to think about the user experience.',
      tags: ['ux'],
    },
  },
];

const sampleEdges: Edge[] = [
  {
    id: 'edge-1-2',
    source: 'node-1',
    target: 'node-2',
    type: 'smoothstep',
  },
  {
    id: 'edge-1-3',
    source: 'node-1',
    target: 'node-3',
    type: 'smoothstep',
  },
];

export const SimpleBrainstormPage = () => {
  const theme = useTheme();
  const { t } = useI18n();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [chatOpen, setChatOpen] = useState(!isMobile);
  const [nodes, setNodes] = useState<Node[]>(sampleNodes);
  const [edges, setEdges] = useState<Edge[]>(sampleEdges);

  const handleSaveFlow = (updatedNodes: Node[], updatedEdges: Edge[]) => {
    setNodes(updatedNodes);
    setEdges(updatedEdges);
    console.log('Flow saved:', { nodes: updatedNodes, edges: updatedEdges });
  };

  const toggleChat = () => {
    setChatOpen(prev => !prev);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="h1">
              Sample Brainstorming Project
            </Typography>
            <Typography variant="subtitle2" color="text.secondary">
              Version 1.0.0
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => console.log('Project saved')}
            >
              {t('common.save')}
            </Button>

            {isMobile && (
              <Button
                variant="contained"
                color="secondary"
                startIcon={<ChatIcon />}
                onClick={toggleChat}
              >
                {t('chat.title')}
              </Button>
            )}
          </Box>
        </Box>

        <Paper
          elevation={3}
          sx={{
            flexGrow: 1,
            overflow: 'hidden',
            display: 'flex',
          }}
        >
          {isMobile ? (
            <>
              <Box sx={{ flexGrow: 1, height: '100%' }}>
                <BrainstormFlow
                  initialNodes={nodes}
                  initialEdges={edges}
                  onSave={handleSaveFlow}
                />
              </Box>

              <Drawer
                anchor="right"
                open={chatOpen}
                onClose={toggleChat}
                sx={{
                  '& .MuiDrawer-paper': {
                    width: '80%',
                    maxWidth: 400,
                  },
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
                  <IconButton onClick={toggleChat}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Box sx={{ p: 2 }}>
                  <Typography variant="h6">{t('chat.title')}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Chat functionality will be implemented here.
                  </Typography>
                </Box>
              </Drawer>
            </>
          ) : (
            <Box sx={{ display: 'flex', height: '100%' }}>
              <Box sx={{ flex: chatOpen ? 8 : 12, height: '100%' }}>
                <BrainstormFlow
                  initialNodes={nodes}
                  initialEdges={edges}
                  onSave={handleSaveFlow}
                />
              </Box>

              {chatOpen && (
                <Box sx={{ flex: 4, height: '100%', borderLeft: `1px solid ${theme.palette.divider}` }}>
                  <Box sx={{ height: '100%', position: 'relative', p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">{t('chat.title')}</Typography>
                      <IconButton onClick={toggleChat} size="small">
                        <CloseIcon />
                      </IconButton>
                    </Box>

                    <Typography variant="body2" color="text.secondary">
                      Chat functionality will be implemented here.
                    </Typography>
                  </Box>
                </Box>
              )}
            </Box>
          )}
        </Paper>

        {!chatOpen && !isMobile && (
          <Button
            variant="contained"
            color="secondary"
            startIcon={<ChatIcon />}
            onClick={toggleChat}
            sx={{ position: 'fixed', bottom: 16, right: 16 }}
          >
            {t('chat.title')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
