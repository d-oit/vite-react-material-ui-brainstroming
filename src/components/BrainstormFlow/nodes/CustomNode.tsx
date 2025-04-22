import ChatIcon from '@mui/icons-material/Chat';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SaveIcon from '@mui/icons-material/Save';
import {
  Box,
  IconButton,
  Paper,
  TextField,
  Typography,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import React, { memo, useState, useMemo } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';
import { useSettings } from '../../../contexts/SettingsContext';

interface CustomNodeData {
  label: string;
  type: 'idea' | 'task' | 'resource' | 'note';
  notes?: string;
  onEdit?: (node: any) => void;
  onDelete?: (node: any) => void;
  onChat?: (node: any) => void;
}

const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected, id }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [label, setLabel] = useState(data.label);
  const [notes, setNotes] = useState(data.notes || '');

  const handleSave = () => {
    // Save will be implemented through store
    setIsEditing(false);
  };

  const { getNodeColor, nodePreferences, settings } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Calculate node size based on settings
  const nodeSize = useMemo(() => {
    if (!nodePreferences) return { width: 200, fontSize: 1 };

    // Use preferred size from settings
    const preferredSize = settings.preferredNodeSize || 'medium';

    // Get the size configuration
    let sizeConfig;
    switch (preferredSize) {
      case 'small':
        sizeConfig = nodePreferences.nodeSizes.small;
        break;
      case 'large':
        sizeConfig = nodePreferences.nodeSizes.large;
        break;
      case 'medium':
      default:
        sizeConfig = nodePreferences.nodeSizes.medium;
        break;
    }

    // Adjust size for mobile devices
    const width = isMobile ? Math.min(sizeConfig.width, window.innerWidth * 0.8) : sizeConfig.width;

    return {
      width: width,
      fontSize: sizeConfig.fontSize,
    };
  }, [nodePreferences, settings.preferredNodeSize, isMobile]);

  const getNodeStyle = () => {
    const baseStyle = {
      padding: 2,
      minWidth: nodeSize.width,
      width: nodeSize.width,
      borderRadius: 1,
      fontSize: `${nodeSize.fontSize}rem`,
    };

    // Get color from settings
    const backgroundColor = getNodeColor(data.type);

    return {
      ...baseStyle,
      backgroundColor,
      border: selected ? `2px solid ${theme.palette.primary.main}` : '1px solid #ccc',
    };
  };

  return (
    <Paper elevation={selected ? 3 : 1} sx={getNodeStyle()}>
      <Handle type="target" position={Position.Top} />

      <Box sx={{ p: 1 }}>
        {isEditing ? (
          <TextField
            fullWidth
            value={label}
            onChange={e => setLabel(e.target.value)}
            size="small"
            autoFocus
            onKeyPress={e => e.key === 'Enter' && handleSave()}
          />
        ) : (
          <Typography variant="body1">{data.label}</Typography>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 0.5, mt: 1 }}>
          <IconButton
            size="small"
            onClick={() => setShowNotes(!showNotes)}
            color={showNotes ? 'primary' : 'default'}
          >
            <NoteAddIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={() => {
              if (isEditing) {
                handleSave();
              } else {
                data.onEdit?.({ id, data });
                setIsEditing(true);
              }
            }}
            data-testid={`edit-${id}`}
          >
            {isEditing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={e => {
              e.stopPropagation(); // Prevent node selection
              data.onDelete?.({ id, data });
            }}
            data-testid={`delete-${id}`}
            aria-label="Delete node"
            title="Delete node"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            color="primary"
            onClick={() => data.onChat?.({ id, data })}
            data-testid={`chat-${id}`}
          >
            <ChatIcon fontSize="small" />
          </IconButton>
        </Box>

        {showNotes && (
          <TextField
            fullWidth
            multiline
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Add notes..."
            size="small"
            sx={{ mt: 1 }}
          />
        )}
      </Box>

      <Handle type="source" position={Position.Bottom} />
    </Paper>
  );
};

export default memo(CustomNode);
