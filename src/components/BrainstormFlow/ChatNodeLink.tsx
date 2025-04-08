import {
  Link as LinkIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Chat as ChatIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  TextField,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  useTheme,
  Snackbar,
  Alert,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import type { Node } from '../../types';

interface ChatNodeLinkProps {
  nodes: Node[];
  linkedNodeIds: string[];
  onLinkNode: (nodeId: string) => void;
  onUnlinkNode: (nodeId: string) => void;
  chatMessageId: string;
}

export const ChatNodeLink: React.FC<ChatNodeLinkProps> = ({
  nodes,
  linkedNodeIds,
  onLinkNode,
  onUnlinkNode,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  chatMessageId,
}) => {
  const theme = useTheme();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setSearchTerm('');
  };

  const handleLinkNode = (nodeId: string) => {
    onLinkNode(nodeId);

    // Show feedback and close dialog after a delay
    setSnackbarMessage(t('flow.nodeLinkSuccess') || 'Node linked successfully');
    setSnackbarOpen(true);

    // Automatically close the dialog after linking if requested
    if (linkedNodeIds.length === 0) {
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    }
  };

  const handleUnlinkNode = (nodeId: string) => {
    onUnlinkNode(nodeId);

    // Show feedback
    setSnackbarMessage(t('flow.nodeUnlinkSuccess') || 'Node unlinked successfully');
    setSnackbarOpen(true);

    // If no more linked nodes, close the dialog after a delay
    if (linkedNodeIds.length <= 1) {
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    }
  };

  // Filter nodes based on search term
  const filteredNodes = nodes.filter(
    node =>
      node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.data.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (Array.isArray(node.data.tags) &&
        node.data.tags.length > 0 &&
        node.data.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Get linked nodes
  const linkedNodes = nodes.filter(node => linkedNodeIds.includes(node.id));

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
        <Tooltip title={t('chat.linkToNodes') || 'Link to nodes'}>
          <IconButton
            size="small"
            onClick={handleOpen}
            aria-label={t('chat.linkToNodes') || 'Link to nodes'}
          >
            <LinkIcon fontSize="small" />
          </IconButton>
        </Tooltip>

        {linkedNodes.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, ml: 1 }}>
            {linkedNodes.map(node => (
              <Chip
                key={node.id}
                size="small"
                label={node.data.label}
                icon={<ChatIcon fontSize="small" />}
                onDelete={() => handleUnlinkNode(node.id)}
                sx={{
                  backgroundColor: theme.palette.primary.main + '20', // 20 = 12% opacity
                  '& .MuiChip-deleteIcon': {
                    color: theme.palette.primary.main,
                    '&:hover': {
                      color: theme.palette.primary.dark,
                    },
                  },
                }}
              />
            ))}
          </Box>
        )}
      </Box>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{t('chat.linkToNodes') || 'Link to Nodes'}</DialogTitle>
        <DialogContent>
          <TextField
            // Using autoFocus can reduce accessibility - consider focus management alternatives
            margin="dense"
            label={t('common.search') || 'Search'}
            type="text"
            fullWidth
            variant="outlined"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon color="action" />,
              endAdornment: searchTerm ? (
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  aria-label={t('common.clearSearch') || 'Clear search'}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              ) : null,
            }}
          />

          {linkedNodes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('chat.linkedNodes') || 'Linked Nodes'}
              </Typography>
              <List dense>
                {linkedNodes.map(node => (
                  <ListItem
                    key={node.id}
                    secondaryAction={
                      <IconButton
                        edge="end"
                        aria-label={t('chat.unlinkNode') || 'Unlink node'}
                        onClick={() => handleUnlinkNode(node.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    }
                    disablePadding
                  >
                    <ListItemButton>
                      <ListItemText
                        primary={node.data.label}
                        secondary={
                          node.data.content.length > 50
                            ? `${node.data.content.substring(0, 50)}...`
                            : node.data.content
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            </Box>
          )}

          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" gutterBottom>
              {t('chat.availableNodes') || 'Available Nodes'}
            </Typography>
            {filteredNodes.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {t('chat.noNodesFound') || 'No nodes found'}
              </Typography>
            ) : (
              <List dense sx={{ maxHeight: 300, overflow: 'auto' }}>
                {filteredNodes
                  .filter(node => !linkedNodeIds.includes(node.id))
                  .map(node => (
                    <ListItem
                      key={node.id}
                      secondaryAction={
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => handleLinkNode(node.id)}
                        >
                          {t('chat.link') || 'Link'}
                        </Button>
                      }
                      disablePadding
                    >
                      <ListItemButton>
                        <ListItemText
                          primary={node.data.label}
                          secondary={
                            node.data.content.length > 50
                              ? `${node.data.content.substring(0, 50)}...`
                              : node.data.content
                          }
                        />
                      </ListItemButton>
                    </ListItem>
                  ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>{t('common.close') || 'Close'}</Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ChatNodeLink;
