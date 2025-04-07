import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  Stack,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Check as CheckIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useI18n } from '../../contexts/I18nContext';
import type { ChatSuggestion, NodeSuggestion, NodeData } from '../../types';
import { createNodeDataFromSuggestion } from '../../types';

interface ChatSuggestionPanelProps {
  suggestion: ChatSuggestion | null;
  onAcceptNode: (nodeData: NodeData) => void;
  onAcceptAll: (nodeDatas: NodeData[]) => void;
  onDismiss: () => void;
}

/**
 * Component for displaying and accepting chat-generated node suggestions
 */
export default function ChatSuggestionPanel({
  suggestion,
  onAcceptNode,
  onAcceptAll,
  onDismiss,
}: ChatSuggestionPanelProps) {
  const { t } = useI18n();
  const [acceptedNodes, setAcceptedNodes] = useState<Set<string>>(new Set());

  if (!suggestion) {
    return null;
  }

  const handleAcceptNode = (nodeSuggestion: NodeSuggestion) => {
    const nodeData = createNodeDataFromSuggestion(nodeSuggestion);
    onAcceptNode(nodeData);
    
    // Mark this node as accepted
    const newAcceptedNodes = new Set(acceptedNodes);
    newAcceptedNodes.add(nodeData.id);
    setAcceptedNodes(newAcceptedNodes);
  };

  const handleAcceptAll = () => {
    const nodeDatas = suggestion.nodes.map(createNodeDataFromSuggestion);
    onAcceptAll(nodeDatas);
    
    // Mark all nodes as accepted
    const newAcceptedNodes = new Set(acceptedNodes);
    nodeDatas.forEach(node => newAcceptedNodes.add(node.id));
    setAcceptedNodes(newAcceptedNodes);
  };

  const getNodeTypeColor = (type: string) => {
    switch (type) {
      case 'idea':
        return 'primary';
      case 'task':
        return 'secondary';
      case 'note':
        return 'info';
      case 'resource':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        backgroundColor: 'background.paper',
      }}
    >
      <Box sx={{ mb: 2 }}>
        <Typography variant="h6" gutterBottom>
          {t('chat.suggestedNodes')}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t('chat.basedOnPrompt')}: "{suggestion.originalMessage}"
        </Typography>
      </Box>

      <Divider sx={{ mb: 2 }} />

      <List>
        {suggestion.nodes.map((node, index) => {
          const isAccepted = Array.from(acceptedNodes).some(id => 
            id === createNodeDataFromSuggestion(node).id
          );
          
          return (
            <Card 
              key={index} 
              variant="outlined" 
              sx={{ 
                mb: 2,
                borderColor: isAccepted ? 'success.main' : 'divider',
                backgroundColor: isAccepted ? 'success.light' : 'background.paper',
                opacity: isAccepted ? 0.7 : 1,
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="h6">{node.title}</Typography>
                  <Chip 
                    label={node.type} 
                    size="small" 
                    color={getNodeTypeColor(node.type) as any}
                  />
                </Box>
                
                <Typography variant="body2" sx={{ mb: 1 }}>
                  {node.content}
                </Typography>
                
                {node.tags && node.tags.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                    {node.tags.map((tag, tagIndex) => (
                      <Chip key={tagIndex} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                )}
              </CardContent>
              
              <CardActions>
                <Tooltip title={isAccepted ? t('chat.alreadyAccepted') : t('chat.acceptNode')}>
                  <span>
                    <Button
                      size="small"
                      startIcon={isAccepted ? <CheckCircleIcon /> : <AddIcon />}
                      onClick={() => handleAcceptNode(node)}
                      disabled={isAccepted}
                      color={isAccepted ? 'success' : 'primary'}
                    >
                      {isAccepted ? t('chat.accepted') : t('chat.accept')}
                    </Button>
                  </span>
                </Tooltip>
              </CardActions>
            </Card>
          );
        })}
      </List>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          color="secondary"
          onClick={onDismiss}
        >
          {t('chat.dismiss')}
        </Button>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<CheckIcon />}
          onClick={handleAcceptAll}
        >
          {t('chat.acceptAll')}
        </Button>
      </Box>
    </Paper>
  );
}
