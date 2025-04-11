import SendIcon from '@mui/icons-material/Send';
import {
  Box,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import React, { useCallback, useState } from 'react';

import { useI18n } from '../../contexts/I18nContext';
import { generateUniqueId } from '../../utils/idGenerator';
import { BrainstormNode, LLMChatPanelProps } from './types';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const DEFAULT_PROMPTS = [
  'brainstorming.prompts.generateIdeas',
  'brainstorming.prompts.analyze',
  'brainstorming.prompts.improve',
  'brainstorming.prompts.organize',
];

export default function LLMChatPanel({ projectId, session, onInsightGenerated }: LLMChatPanelProps) {
  const { t } = useI18n();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateUniqueId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // TODO: Implement actual LLM API call here
      // For now, we'll simulate a response
      const simulatedResponse = await new Promise<string>(resolve =>
        setTimeout(() => {
          resolve(`Simulated LLM response to: ${input}`);
        }, 1000)
      );

      const assistantMessage: ChatMessage = {
        id: generateUniqueId(),
        role: 'assistant',
        content: simulatedResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Generate an insight from the response
      const insight: BrainstormNode = {
        id: generateUniqueId(),
        type: 'idea',
        content: simulatedResponse,
        position: {
          x: Math.random() * 500,
          y: Math.random() * 500,
        },
        tags: ['llm-generated'],
      };

      onInsightGenerated(insight);
    } catch (error) {
      console.error('Failed to get LLM response:', error);
      // TODO: Show error notification
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, onInsightGenerated]);

  const handleKeyPress = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        void handleSendMessage();
      }
    },
    [handleSendMessage]
  );

  return (
    <Paper
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        p: 2,
        gap: 2,
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t('brainstorming.llmChat')}
      </Typography>

      <Box sx={{ flexGrow: 1, overflow: 'auto' }}>
        <List>
          {messages.map(message => (
            <ListItem
              key={message.id}
              sx={{
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                mb: 1,
              }}
            >
              <Paper
                sx={{
                  p: 1,
                  backgroundColor: message.role === 'user' ? 'primary.main' : 'background.paper',
                  color: message.role === 'user' ? 'primary.contrastText' : 'text.primary',
                  maxWidth: '80%',
                }}
              >
                <ListItemText
                  primary={message.content}
                  secondary={new Date(message.timestamp).toLocaleTimeString()}
                  secondaryTypographyProps={{
                    sx: { color: message.role === 'user' ? 'primary.contrastText' : 'text.secondary' },
                  }}
                />
              </Paper>
            </ListItem>
          ))}
        </List>
      </Box>

      <Stack spacing={1}>
        <Box>
          {DEFAULT_PROMPTS.map(promptKey => (
            <Typography
              key={promptKey}
              variant="body2"
              sx={{
                cursor: 'pointer',
                color: 'primary.main',
                '&:hover': { textDecoration: 'underline' },
                display: 'inline-block',
                mr: 2,
              }}
              onClick={() => setInput(t(promptKey))}
            >
              {t(promptKey)}
            </Typography>
          ))}
        </Box>

        <Stack direction="row" spacing={1}>
          <TextField
            fullWidth
            placeholder={t('brainstorming.typeMessage')}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            multiline
            maxRows={3}
            disabled={isLoading}
          />
          <IconButton onClick={() => void handleSendMessage()} disabled={!input.trim() || isLoading}>
            <SendIcon />
          </IconButton>
        </Stack>
      </Stack>
    </Paper>
  );
}