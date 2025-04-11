import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import SaveIcon from '@mui/icons-material/Save';
import { Box, IconButton, Paper, TextField, Typography } from '@mui/material';
import React, { memo, useState } from 'react';
import type { NodeProps } from 'reactflow';
import { Handle, Position } from 'reactflow';

interface CustomNodeData {
  label: string;
  type: 'idea' | 'task' | 'resource' | 'note';
  notes?: string;
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

  const getNodeStyle = () => {
    const baseStyle = {
      padding: 2,
      minWidth: 150,
      borderRadius: 1,
    };

    const typeStyles = {
      idea: { backgroundColor: '#e3f2fd' },
      task: { backgroundColor: '#f3e5f5' },
      resource: { backgroundColor: '#e8f5e9' },
      note: { backgroundColor: '#fff3e0' },
    };

    return {
      ...baseStyle,
      ...typeStyles[data.type],
      border: selected ? '2px solid #1976d2' : '1px solid #ccc',
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
          <IconButton size="small" onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? <SaveIcon fontSize="small" /> : <EditIcon fontSize="small" />}
          </IconButton>
          <IconButton size="small" color="error">
            <DeleteIcon fontSize="small" />
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
