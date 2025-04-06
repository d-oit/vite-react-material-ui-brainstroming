import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Divider,
  CircularProgress,
  IconButton,
  Avatar,
} from '@mui/material';
import { Send as SendIcon, Person as PersonIcon, SmartToy as BotIcon } from '@mui/icons-material';
import { useSettings } from '../../contexts/SettingsContext';
import { useI18n } from '../../contexts/I18nContext';
import { ChatMessage } from '../../types';
import chatService from '../../services/ChatService';

interface ChatPanelProps {
  projectId?: string;
  projectContext?: any;
}

export const ChatPanel = ({ projectId, projectContext }: ChatPanelProps) => {
  const { settings } = useSettings();
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Check if API key is configured
    if (!settings.openRouterApiKey) {
      setError(t('chat.apiKeyMissing'));
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

    try {
      const assistantMessage = await chatService.sendMessage(
        [...messages, userMessage],
        projectContext
      );
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(t('chat.errorSendingMessage'));
    } finally {
      setIsLoading(false);
    }
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
      <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h6">{t('chat.title')}</Typography>
        <Typography variant="body2" color="text.secondary">
          {t('chat.poweredBy')} OpenRouter
        </Typography>
      </Box>

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
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              opacity: 0.7,
            }}
          >
            <BotIcon sx={{ fontSize: 48, mb: 2 }} />
            <Typography variant="body1">{t('chat.startConversation')}</Typography>
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
                  borderRadius: 2,
                  bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
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

      <Box sx={{ p: 2, display: 'flex', gap: 1 }}>
        <TextField
          fullWidth
          placeholder={t('chat.typeMessage')}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          disabled={isLoading || !settings.openRouterApiKey}
          sx={{ flexGrow: 1 }}
        />

        <Button
          variant="contained"
          color="primary"
          endIcon={<SendIcon />}
          onClick={handleSendMessage}
          disabled={isLoading || !input.trim() || !settings.openRouterApiKey}
        >
          {t('chat.send')}
        </Button>
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
