import {
  Send as SendIcon,
  Person as PersonIcon,
  SmartToy as BotIcon,
  WifiOff as OfflineIcon,
  // Info as InfoIcon, // Unused
  Psychology as PsychologyIcon,
  Clear as ClearIcon,
} from '@mui/icons-material';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  // IconButton, // Unused
  Avatar,
  Alert,
  Tooltip,
} from '@mui/material';
import { useState, useEffect, useRef, memo } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';
import chatService from '../../services/ChatService';
import offlineService from '../../services/OfflineService';
import type { ChatMessage, ChatSuggestion, NodeData } from '../../types';

import ChatSuggestionPanel from './ChatSuggestionPanel';

interface ChatPanelProps {
  projectId?: string;
  projectContext?: Record<string, unknown>;
  onAddNodes?: (nodes: NodeData[]) => void;
}

const ChatPanel = ({ projectId, projectContext, onAddNodes }: ChatPanelProps) => {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(offlineService.getOnlineStatus());
  const [nodeSuggestion, setNodeSuggestion] = useState<ChatSuggestion | null>(null);
  const [isGeneratingNodes, setIsGeneratingNodes] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Monitor online status
  useEffect(() => {
    const removeStatusListener = offlineService.addOnlineStatusListener(online => {
      setIsOnline(online);
    });

    return () => {
      removeStatusListener();
    };
  }, []);

  // Load chat history from localStorage on mount
  useEffect(() => {
    if (projectId) {
      const storedMessages = localStorage.getItem(`chat_history_${projectId}`);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
      }
    }
  }, [projectId]);

  // Save chat history to localStorage when messages change
  useEffect(() => {
    if (projectId && messages.length > 0) {
      localStorage.setItem(`chat_history_${projectId}`, JSON.stringify(messages));
    }
  }, [messages, projectId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  /**
   * Scroll to the bottom of the chat
   */
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Check if online
    if (!isOnline) {
      setError(t('chat.offlineError') || 'Cannot send messages while offline');
      return;
    }

    // Check if API key is configured
    if (!settings.openRouterApiKey) {
      setError(t('chat.apiKeyMissing') || 'API key is not configured');
      return;
    }

    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    // Clear any existing node suggestions
    setNodeSuggestion(null);

    try {
      const assistantMessage = await chatService.sendMessage(
        [...messages, userMessage],
        projectContext
      );
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);

      // Check if the error is due to being offline
      if (!navigator.onLine) {
        setError(t('chat.offlineError') || 'Cannot send messages while offline');
      } else {
        setError(t('chat.errorSendingMessage') || 'Error sending message');
      }
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  /**
   * Generate node suggestions from the current input
   */
  const handleGenerateNodes = async () => {
    if (!input.trim() || isGeneratingNodes) return;

    // Check if online
    if (!isOnline) {
      setError(t('chat.offlineError') || 'Cannot generate nodes while offline');
      return;
    }

    // Check if API key is configured
    if (!settings.openRouterApiKey) {
      setError(t('chat.apiKeyMissing') || 'API key is not configured');
      return;
    }

    // Check if node generation is supported in this context
    if (!onAddNodes) {
      setError(t('chat.nodesNotSupported') || 'Node generation is not supported in this context');
      return;
    }

    setIsGeneratingNodes(true);
    setError(null);

    try {
      const suggestion = await chatService.generateNodeSuggestions(input, projectContext);
      setNodeSuggestion(suggestion);
      setInput(''); // Clear input after generating
    } catch (error) {
      console.error('Error generating nodes:', error);

      // Check if the error is due to being offline
      if (!navigator.onLine) {
        setError(t('chat.offlineError') || 'Cannot generate nodes while offline');
      } else {
        setError(
          t('chat.generateNodesError') ||
            'An error occurred while generating nodes. Please try again.'
        );
      }
    } finally {
      setIsGeneratingNodes(false);
    }
  };

  /**
   * Handle accepting a single node
   */
  const handleAcceptNode = (nodeData: NodeData) => {
    if (onAddNodes) {
      onAddNodes([nodeData]);
    }
  };

  /**
   * Handle accepting all nodes
   */
  const handleAcceptAllNodes = (nodeDatas: NodeData[]) => {
    if (onAddNodes) {
      onAddNodes(nodeDatas);
    }
    setNodeSuggestion(null); // Clear suggestions after accepting all
  };

  /**
   * Dismiss node suggestions
   */
  const handleDismissSuggestions = () => {
    setNodeSuggestion(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    if (projectId) {
      localStorage.removeItem(`chat_history_${projectId}`);
    }
    setMessages([]);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: theme =>
            theme.palette.mode === 'dark'
              ? 'linear-gradient(to right, rgba(25,118,210,0.1), rgba(25,118,210,0))'
              : 'linear-gradient(to right, rgba(25,118,210,0.05), rgba(25,118,210,0))',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar
            sx={{
              bgcolor: 'primary.main',
              width: 36,
              height: 36,
            }}
          >
            <BotIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, fontSize: '1.1rem' }}>
              {t('chat.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
              {t('chat.poweredBy')} OpenRouter
            </Typography>
          </Box>
        </Box>
        {!isOnline && (
          <Tooltip title={t('chat.offlineMode') || 'Offline Mode - Chat functionality is limited'}>
            <OfflineIcon color="warning" />
          </Tooltip>
        )}
      </Box>

      {/* Offline warning banner */}
      {!isOnline && (
        <Alert
          severity="warning"
          sx={{
            m: 2,
            mt: 0,
            display: 'flex',
            alignItems: 'center',
            '& .MuiAlert-icon': {
              alignItems: 'center',
            },
          }}
        >
          <Typography variant="body2">
            {t('chat.offlineWarning') ||
              'You are currently offline. Chat functionality is unavailable until you reconnect.'}
          </Typography>
        </Alert>
      )}

      {/* Node suggestions panel */}
      {nodeSuggestion && (
        <ChatSuggestionPanel
          suggestion={nodeSuggestion}
          onAcceptNode={handleAcceptNode}
          onAcceptAll={handleAcceptAllNodes}
          onDismiss={handleDismissSuggestions}
        />
      )}

      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.length === 0 && !nodeSuggestion ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.8,
              textAlign: 'center',
              px: 3,
            }}
          >
            <Avatar
              sx={{
                width: 80,
                height: 80,
                bgcolor: 'primary.main',
                mb: 3,
                boxShadow: theme =>
                  `0 4px 12px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
              }}
            >
              <BotIcon sx={{ fontSize: 48 }} />
            </Avatar>
            <Typography variant="h6" gutterBottom>
              {t('chat.title')}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {t('chat.startConversation')}
            </Typography>
            {!settings.openRouterApiKey && (
              <Alert severity="info" sx={{ mt: 3, width: '100%' }}>
                {t('chat.apiKeyMissing')}
              </Alert>
            )}
          </Box>
        ) : (
          messages.map(message => (
            <Box
              key={message.id}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 1,
                alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
              }}
            >
              <Avatar
                sx={{
                  bgcolor: message.role === 'user' ? 'primary.main' : 'secondary.main',
                }}
              >
                {message.role === 'user' ? <PersonIcon /> : <BotIcon />}
              </Avatar>

              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  borderRadius: theme => theme.spacing(2),
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                  boxShadow: theme =>
                    `0 1px 3px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.4)' : 'rgba(0,0,0,0.1)'}`,
                  position: 'relative',
                  '&::before':
                    message.role !== 'user'
                      ? {
                          content: '""',
                          position: 'absolute',
                          top: 10,
                          left: -8,
                          width: 0,
                          height: 0,
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                          borderRight: theme => `8px solid ${theme.palette.background.paper}`,
                        }
                      : {},
                  '&::after':
                    message.role === 'user'
                      ? {
                          content: '""',
                          position: 'absolute',
                          top: 10,
                          right: -8,
                          width: 0,
                          height: 0,
                          borderTop: '8px solid transparent',
                          borderBottom: '8px solid transparent',
                          borderLeft: theme => `8px solid ${theme.palette.primary.light}`,
                        }
                      : {},
                }}
              >
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {message.content}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: 'block', mt: 1 }}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </Typography>
              </Paper>
            </Box>
          ))
        )}

        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 2 }}>
            <CircularProgress size={24} />
          </Box>
        )}

        {error && (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: 'error.light',
              color: 'error.contrastText',
              borderRadius: 2,
            }}
          >
            <Typography variant="body2">{error}</Typography>
          </Paper>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <TextField
          fullWidth
          placeholder={
            isOnline
              ? t('chat.typeMessage')
              : t('chat.offlineDisabled') || 'Chat unavailable while offline'
          }
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          disabled={isLoading || isGeneratingNodes || !settings.openRouterApiKey || !isOnline}
          sx={{
            flexGrow: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '12px',
              transition: 'all 0.2s ease',
              '&.Mui-focused': {
                boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.2)',
              },
            },
          }}
          helperText={
            !isOnline ? t('chat.offlineHelp') || 'Chat will be available when you reconnect' : ''
          }
        />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1, mt: 1 }}>
          {/* Clear button */}
          <Button
            variant="text"
            color="inherit"
            startIcon={<ClearIcon />}
            onClick={handleClearChat}
            disabled={messages.length === 0 || isLoading || isGeneratingNodes}
            size="small"
            sx={{ flexGrow: 0 }}
          >
            {t('chat.clear')}
          </Button>

          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
            {/* Node generation button - only show if onAddNodes is provided */}
            {onAddNodes && (
              <Tooltip
                title={t('chat.generateNodes') || 'Generate brainstorming nodes from your input'}
              >
                <span>
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleGenerateNodes}
                    disabled={
                      isLoading ||
                      isGeneratingNodes ||
                      !input.trim() ||
                      !settings.openRouterApiKey ||
                      !isOnline
                    }
                    sx={{ borderRadius: '8px' }}
                  >
                    {isGeneratingNodes ? <CircularProgress size={24} /> : <PsychologyIcon />}
                  </Button>
                </span>
              </Tooltip>
            )}

            <Button
              variant="contained"
              color="primary"
              endIcon={<SendIcon />}
              onClick={handleSendMessage}
              disabled={
                isLoading ||
                isGeneratingNodes ||
                !input.trim() ||
                !settings.openRouterApiKey ||
                !isOnline
              }
              sx={{ borderRadius: '8px' }}
            >
              {t('chat.send')}
            </Button>
          </Box>
        </Box>
      </Box>

      {messages.length > 0 && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <Button size="small" onClick={clearChat}>
            {t('chat.clearChat')}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export const MemoizedChatPanel = memo(ChatPanel);
export { ChatPanel };
