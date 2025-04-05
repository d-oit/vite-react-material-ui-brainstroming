import { useState, useRef, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import {
  Send as SendIcon,
  Delete as DeleteIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import { useChat } from '@/hooks/useChat';
import { ChatMessage } from '@/types';

interface ChatInterfaceProps {
  title?: string;
  placeholder?: string;
}

export const ChatInterface = ({
  title = 'Brainstorming Assistant',
  placeholder = 'Ask for ideas or suggestions...',
}: ChatInterfaceProps) => {
  const { messages, isLoading, error, addUserMessage, clearChat } = useChat();
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      addUserMessage(input);
      setInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <Paper
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <Typography variant="h6">{title}</Typography>
        <Button
          startIcon={<DeleteIcon />}
          onClick={clearChat}
          disabled={messages.length === 0}
          size="small"
        >
          Clear Chat
        </Button>
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
            <BotIcon sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
            <Typography variant="body1" textAlign="center">
              Ask me anything about your brainstorming project.
            </Typography>
            <Typography variant="body2" textAlign="center" color="text.secondary" sx={{ mt: 1 }}>
              I can help generate ideas, suggest improvements, or answer questions.
            </Typography>
          </Box>
        ) : (
          messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))
        )}

        {error && (
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            {error}
          </Typography>
        )}

        <div ref={messagesEndRef} />
      </Box>

      <Divider />

      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          placeholder={placeholder}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          multiline
          maxRows={4}
          disabled={isLoading}
          variant="outlined"
          size="small"
        />
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
        >
          {isLoading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Paper>
  );
};

interface MessageBubbleProps {
  message: ChatMessage;
}

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUser = message.role === 'user';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isUser ? 'row-reverse' : 'row',
        alignItems: 'flex-start',
        gap: 1,
      }}
    >
      <Avatar sx={{ bgcolor: isUser ? 'primary.main' : 'secondary.main' }}>
        {isUser ? <PersonIcon /> : <BotIcon />}
      </Avatar>
      <Paper
        sx={{
          p: 2,
          maxWidth: '80%',
          bgcolor: isUser ? 'primary.light' : 'background.paper',
          borderRadius: 2,
          boxShadow: 1,
        }}
      >
        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
          {message.content}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </Box>
  );
};
