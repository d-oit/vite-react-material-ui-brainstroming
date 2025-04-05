import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Box,
  Chip,
  OutlinedInput,
  SelectChangeEvent,
} from '@mui/material';
import { NodeType, NodeData } from '@/types';

interface NodeEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: NodeData, type: NodeType) => void;
  initialData?: NodeData;
  initialType?: NodeType;
}

export const NodeEditDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  initialType = NodeType.IDEA,
}: NodeEditDialogProps) => {
  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NodeType>(initialType);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label);
      setContent(initialData.content);
      setTags(initialData.tags || []);
      setColor(initialData.color);
    } else {
      // Reset form for new node
      setLabel('');
      setContent('');
      setTags([]);
      setColor(undefined);
    }
  }, [initialData, open]);

  const handleTypeChange = (event: SelectChangeEvent<NodeType>) => {
    setType(event.target.value as NodeType);
  };

  const handleAddTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete: string) => {
    setTags(tags.filter((tag) => tag !== tagToDelete));
  };

  const handleSave = () => {
    onSave(
      {
        label,
        content,
        tags,
        color,
      },
      type
    );
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialData ? 'Edit Node' : 'Add New Node'}</DialogTitle>
      
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <FormControl fullWidth>
            <InputLabel id="node-type-label">Node Type</InputLabel>
            <Select
              labelId="node-type-label"
              value={type}
              label="Node Type"
              onChange={handleTypeChange}
            >
              <MenuItem value={NodeType.IDEA}>Idea</MenuItem>
              <MenuItem value={NodeType.TASK}>Task</MenuItem>
              <MenuItem value={NodeType.NOTE}>Note</MenuItem>
              <MenuItem value={NodeType.RESOURCE}>Resource</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            label="Label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            fullWidth
            required
          />
          
          <TextField
            label="Content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />
          
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                }
              }}
              fullWidth
            />
            <Button variant="outlined" onClick={handleAddTag}>
              Add
            </Button>
          </Box>
          
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {tags.map((tag) => (
              <Chip
                key={tag}
                label={tag}
                onDelete={() => handleDeleteTag(tag)}
              />
            ))}
          </Box>
        </Box>
      </DialogContent>
      
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained" color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};
