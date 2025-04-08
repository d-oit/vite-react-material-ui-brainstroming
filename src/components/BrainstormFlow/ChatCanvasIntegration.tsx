import { Link as LinkIcon, Chat as ChatIcon } from '@mui/icons-material';
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
  ListItemIcon,
  ListItemText,
  Typography,
  Divider,
  Badge,
  Tooltip,
} from '@mui/material';
import React, { useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import type { Node } from '../../types';

interface ChatMessage {
  id: string;
  content: string;
  sender: string;
  timestamp: Date;
}

interface NodeChatLink {
  nodeId: string;
  messageId: string;
}

interface ChatCanvasIntegrationProps {
  nodes: Node[];
  messages: ChatMessage[];
  links: NodeChatLink[];
  onLinkNodeToMessage: (nodeId: string, messageId: string) => void;
  onUnlinkNodeFromMessage: (nodeId: string, messageId: string) => void;
  onHighlightNode?: (nodeId: string) => void;
  onHighlightMessage?: (messageId: string) => void;
}

/**
 * Component that handles the integration between chat messages and canvas nodes
 * Allows linking nodes to messages and vice versa
 */
const ChatCanvasIntegration: React.FC<ChatCanvasIntegrationProps> = ({
  nodes,
  messages,
  links,
  onLinkNodeToMessage,
  onUnlinkNodeFromMessage,
  onHighlightNode: _onHighlightNode,
  onHighlightMessage: _onHighlightMessage,
}) => {
  const { t } = useI18n();
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<ChatMessage | null>(null);
  const [linkType, setLinkType] = useState<'nodeToMessage' | 'messageToNode'>('nodeToMessage');

  // Open dialog to link a node to a message
  const handleOpenNodeToMessageDialog = (node: Node) => {
    setSelectedNode(node);
    setLinkType('nodeToMessage');
    setLinkDialogOpen(true);
  };

  // Open dialog to link a message to a node
  const handleOpenMessageToNodeDialog = (message: ChatMessage) => {
    setSelectedMessage(message);
    setLinkType('messageToNode');
    setLinkDialogOpen(true);
  };

  // Close the link dialog
  const handleCloseLinkDialog = () => {
    setLinkDialogOpen(false);
    setSelectedNode(null);
    setSelectedMessage(null);
  };

  // Create a link between a node and a message
  const handleCreateLink = (nodeId: string, messageId: string) => {
    onLinkNodeToMessage(nodeId, messageId);
    handleCloseLinkDialog();
  };

  // Get linked messages for a node
  const getLinkedMessagesForNode = (nodeId: string): ChatMessage[] => {
    const messageIds = links.filter(link => link.nodeId === nodeId).map(link => link.messageId);
    return messages.filter(message => messageIds.includes(message.id));
  };

  // Get linked nodes for a message
  const getLinkedNodesForMessage = (messageId: string): Node[] => {
    const nodeIds = links.filter(link => link.messageId === messageId).map(link => link.nodeId);
    return nodes.filter(node => nodeIds.includes(node.id));
  };

  // Check if a node is linked to a message
  const isNodeLinkedToMessage = (nodeId: string, messageId: string): boolean => {
    return links.some(link => link.nodeId === nodeId && link.messageId === messageId);
  };

  // Render the dialog content based on the link type
  const renderDialogContent = () => {
    if (linkType === 'nodeToMessage' && selectedNode) {
      const linkedMessages = getLinkedMessagesForNode(selectedNode.id);

      return (
        <>
          <DialogTitle>{t('flow.linkNodeToMessage') || 'Link Node to Chat Message'}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              <strong>{t('flow.selectedNode') || 'Selected Node'}:</strong> {selectedNode.data.label}
            </Typography>

            {linkedMessages.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('flow.currentlyLinkedMessages') || 'Currently Linked Messages'}:
                </Typography>
                <List dense>
                  {linkedMessages.map(message => (
                    <ListItem
                      key={message.id}
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          onClick={() => onUnlinkNodeFromMessage(selectedNode.id, message.id)}
                        >
                          {t('flow.unlink') || 'Unlink'}
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={message.sender}
                        secondary={
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {message.content}
                          </Typography>
                        }
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            <Typography variant="subtitle2" gutterBottom>
              {t('flow.selectMessageToLink') || 'Select a message to link'}:
            </Typography>

            <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {messages.length === 0 ? (
                <Typography variant="body2" sx={{ p: 2, fontStyle: 'italic' }}>
                  {t('flow.noMessagesAvailable') || 'No messages available'}
                </Typography>
              ) : (
                messages.map(message => {
                  const isLinked = isNodeLinkedToMessage(selectedNode.id, message.id);

                  return (
                    <ListItemButton
                      key={message.id}
                      onClick={() => handleCreateLink(selectedNode.id, message.id)}
                      disabled={isLinked}
                      sx={{
                        backgroundColor: isLinked ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: isLinked ? 'action.selected' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {isLinked ? (
                          <Badge color="primary" variant="dot">
                            <ChatIcon />
                          </Badge>
                        ) : (
                          <ChatIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={message.sender}
                        secondary={
                          <Typography
                            component="span"
                            variant="body2"
                            sx={{
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }}
                          >
                            {message.content}
                          </Typography>
                        }
                      />
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </DialogContent>
        </>
      );
    } else if (linkType === 'messageToNode' && selectedMessage) {
      const linkedNodes = getLinkedNodesForMessage(selectedMessage.id);

      return (
        <>
          <DialogTitle>{t('flow.linkMessageToNode') || 'Link Message to Node'}</DialogTitle>
          <DialogContent dividers>
            <Typography variant="subtitle1" gutterBottom>
              <strong>{t('flow.selectedMessage') || 'Selected Message'}:</strong>
            </Typography>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, mb: 3 }}>
              <Typography variant="subtitle2">{selectedMessage.sender}</Typography>
              <Typography variant="body2">{selectedMessage.content}</Typography>
            </Box>

            {linkedNodes.length > 0 && (
              <Box sx={{ mt: 2, mb: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                  {t('flow.currentlyLinkedNodes') || 'Currently Linked Nodes'}:
                </Typography>
                <List dense>
                  {linkedNodes.map(node => (
                    <ListItem
                      key={node.id}
                      secondaryAction={
                        <Button
                          size="small"
                          color="error"
                          onClick={() => onUnlinkNodeFromMessage(node.id, selectedMessage.id)}
                        >
                          {t('flow.unlink') || 'Unlink'}
                        </Button>
                      }
                    >
                      <ListItemText
                        primary={node.data.label}
                        secondary={node.type}
                      />
                    </ListItem>
                  ))}
                </List>
                <Divider sx={{ my: 2 }} />
              </Box>
            )}

            <Typography variant="subtitle2" gutterBottom>
              {t('flow.selectNodeToLink') || 'Select a node to link'}:
            </Typography>

            <List sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {nodes.length === 0 ? (
                <Typography variant="body2" sx={{ p: 2, fontStyle: 'italic' }}>
                  {t('flow.noNodesAvailable') || 'No nodes available'}
                </Typography>
              ) : (
                nodes.map(node => {
                  const isLinked = isNodeLinkedToMessage(node.id, selectedMessage.id);

                  return (
                    <ListItemButton
                      key={node.id}
                      onClick={() => handleCreateLink(node.id, selectedMessage.id)}
                      disabled={isLinked}
                      sx={{
                        backgroundColor: isLinked ? 'action.selected' : 'inherit',
                        '&:hover': {
                          backgroundColor: isLinked ? 'action.selected' : 'action.hover',
                        },
                      }}
                    >
                      <ListItemIcon>
                        {isLinked ? (
                          <Badge color="primary" variant="dot">
                            <LinkIcon />
                          </Badge>
                        ) : (
                          <LinkIcon />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={node.data.label}
                        secondary={node.type}
                      />
                    </ListItemButton>
                  );
                })
              )}
            </List>
          </DialogContent>
        </>
      );
    }

    return null;
  };

  // Render node link indicator
  const renderNodeLinkIndicator = (nodeId: string) => {
    const linkedMessages = getLinkedMessagesForNode(nodeId);

    if (linkedMessages.length === 0) return null;

    return (
      <Tooltip
        title={
          <>
            <Typography variant="subtitle2">
              {t('flow.linkedMessages', { count: linkedMessages.length }) ||
                `${linkedMessages.length} linked message(s)`}
            </Typography>
            <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
              {linkedMessages.map(message => (
                <ListItem key={message.id} sx={{ py: 0 }}>
                  <ListItemText
                    primary={message.sender}
                    secondary={
                      <Typography
                        component="span"
                        variant="body2"
                        sx={{
                          display: '-webkit-box',
                          WebkitLineClamp: 1,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {message.content}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </>
        }
      >
        <Badge
          badgeContent={linkedMessages.length}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              right: -3,
              top: 3,
            }
          }}
        >
          <ChatIcon color="action" fontSize="small" />
        </Badge>
      </Tooltip>
    );
  };

  // Render message link indicator
  const renderMessageLinkIndicator = (messageId: string) => {
    const linkedNodes = getLinkedNodesForMessage(messageId);

    if (linkedNodes.length === 0) return null;

    return (
      <Tooltip
        title={
          <>
            <Typography variant="subtitle2">
              {t('flow.linkedNodes', { count: linkedNodes.length }) ||
                `${linkedNodes.length} linked node(s)`}
            </Typography>
            <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
              {linkedNodes.map(node => (
                <ListItem key={node.id} sx={{ py: 0 }}>
                  <ListItemText
                    primary={node.data.label}
                    secondary={node.type}
                  />
                </ListItem>
              ))}
            </List>
          </>
        }
      >
        <Badge
          badgeContent={linkedNodes.length}
          color="primary"
          sx={{
            '& .MuiBadge-badge': {
              right: -3,
              top: 3,
            }
          }}
        >
          <LinkIcon color="action" fontSize="small" />
        </Badge>
      </Tooltip>
    );
  };

  return (
    <>
      <Dialog
        open={linkDialogOpen}
        onClose={handleCloseLinkDialog}
        maxWidth="md"
        fullWidth
      >
        {renderDialogContent()}
        <DialogActions>
          <Button onClick={handleCloseLinkDialog}>
            {t('common.close') || 'Close'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export the necessary functions and components */}
      {/* These can be used by parent components */}
      {React.Children.only(
        <Box sx={{ display: 'none' }}>
          {/* This is just a trick to export the functions */}
          {/* The actual component doesn't render anything */}
          {JSON.stringify({
            handleOpenNodeToMessageDialog,
            handleOpenMessageToNodeDialog,
            renderNodeLinkIndicator,
            renderMessageLinkIndicator,
            getLinkedMessagesForNode,
            getLinkedNodesForMessage,
            isNodeLinkedToMessage,
          })}
        </Box>
      )}
    </>
  );
};

// Export the component and its helper functions
export default ChatCanvasIntegration;

// Export helper functions for use in other components
export const useChatCanvasIntegration = (props: ChatCanvasIntegrationProps) => {
  const [integrationComponent] = useState(() => <ChatCanvasIntegration {...props} />);

  return {
    integrationComponent,
    handleOpenNodeToMessageDialog: (node: Node) => {
      const instance = React.createElement(ChatCanvasIntegration, {
        ...props,
        ref: (ref: React.RefObject<typeof ChatCanvasIntegration>) => {
          if (ref && typeof ref === 'object' && 'handleOpenNodeToMessageDialog' in ref) {
            (ref as unknown as { handleOpenNodeToMessageDialog: (node: Node) => void }).handleOpenNodeToMessageDialog(node);
          }
        },
      });
      return instance;
    },
    handleOpenMessageToNodeDialog: (message: ChatMessage) => {
      const instance = React.createElement(ChatCanvasIntegration, {
        ...props,
        ref: (ref: React.RefObject<typeof ChatCanvasIntegration>) => {
          if (ref && typeof ref === 'object' && 'handleOpenMessageToNodeDialog' in ref) {
            (ref as unknown as { handleOpenMessageToNodeDialog: (message: ChatMessage) => void }).handleOpenMessageToNodeDialog(message);
          }
        },
      });
      return instance;
    },
    renderNodeLinkIndicator: (nodeId: string) => {
      const linkedMessages = props.links
        .filter(link => link.nodeId === nodeId)
        .map(link => link.messageId);

      const messages = props.messages.filter(message => linkedMessages.includes(message.id));

      if (messages.length === 0) return null;

      return (
        <Tooltip
          title={
            <>
              <Typography variant="subtitle2">
                {`${messages.length} linked message(s)`}
              </Typography>
              <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
                {messages.map(message => (
                  <ListItem key={message.id} sx={{ py: 0 }}>
                    <ListItemText
                      primary={message.sender}
                      secondary={
                        <Typography
                          component="span"
                          variant="body2"
                          sx={{
                            display: '-webkit-box',
                            WebkitLineClamp: 1,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {message.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </>
          }
        >
          <Badge
            badgeContent={messages.length}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 3,
              }
            }}
          >
            <ChatIcon color="action" fontSize="small" />
          </Badge>
        </Tooltip>
      );
    },
    renderMessageLinkIndicator: (messageId: string) => {
      const linkedNodes = props.links
        .filter(link => link.messageId === messageId)
        .map(link => link.nodeId);

      const nodes = props.nodes.filter(node => linkedNodes.includes(node.id));

      if (nodes.length === 0) return null;

      return (
        <Tooltip
          title={
            <>
              <Typography variant="subtitle2">
                {`${nodes.length} linked node(s)`}
              </Typography>
              <List dense sx={{ maxHeight: '200px', overflow: 'auto' }}>
                {nodes.map(node => (
                  <ListItem key={node.id} sx={{ py: 0 }}>
                    <ListItemText
                      primary={node.data.label}
                      secondary={node.type}
                    />
                  </ListItem>
                ))}
              </List>
            </>
          }
        >
          <Badge
            badgeContent={nodes.length}
            color="primary"
            sx={{
              '& .MuiBadge-badge': {
                right: -3,
                top: 3,
              }
            }}
          >
            <LinkIcon color="action" fontSize="small" />
          </Badge>
        </Tooltip>
      );
    },
  };
};
