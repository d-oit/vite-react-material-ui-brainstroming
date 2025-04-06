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
  Typography,
  Divider,
  useTheme,
} from '@mui/material';
import { NodeType, NodeData } from '../../types';
import { useI18n } from '../../contexts/I18nContext';
import { useSettings } from '../../contexts/SettingsContext';

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
  const { getNodeColor, settings, colorSchemes } = useSettings();
  const theme = useTheme();

  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NodeType>(initialType);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<'small' | 'medium' | 'large'>(settings.preferredNodeSize);

  useEffect(() => {
    if (initialData) {
      setLabel(initialData.label);
      setContent(initialData.content);
      setTags(initialData.tags || []);
      setColor(initialData.color);
      setSize(initialData.size || settings.preferredNodeSize);
    } else {
      // Reset form for new node
      setLabel('');
      setContent('');
      setTags([]);
      setColor(undefined);
      setSize(settings.preferredNodeSize);
    }
  }, [initialData, open, settings.preferredNodeSize]);

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
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleSave = () => {
    onSave(
      {
        label,
        content,
        tags,
        color,
        size,
      },
      type
    );
  };

  // Get the default color for the current node type
  const defaultNodeColor = getNodeColor(type);

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
            onChange={e => setLabel(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Content"
            value={content}
            onChange={e => setContent(e.target.value)}
            multiline
            rows={4}
            fullWidth
          />

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Appearance
          </Typography>

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <FormControl sx={{ minWidth: 120 }}>
              <InputLabel id="node-size-label">Size</InputLabel>
              <Select
                labelId="node-size-label"
                value={size}
                label="Size"
                onChange={e => setSize(e.target.value as 'small' | 'medium' | 'large')}
              >
                <MenuItem value="small">Small</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="large">Large</MenuItem>
              </Select>
            </FormControl>

            <Box>
              <Typography variant="body2" gutterBottom>
                Color
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: 1,
                    bgcolor: color || defaultNodeColor,
                    border: '1px solid rgba(0, 0, 0, 0.2)',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      boxShadow: 2,
                    },
                  }}
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'color';
                    input.value = color || defaultNodeColor;
                    input.addEventListener('input', e => {
                      setColor((e.target as HTMLInputElement).value);
                    });
                    input.click();
                  }}
                />
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => setColor(undefined)}
                  disabled={!color}
                >
                  Reset
                </Button>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle1" gutterBottom>
            Tags
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
            <TextField
              label="Add Tag"
              value={newTag}
              onChange={e => setNewTag(e.target.value)}
              onKeyPress={e => {
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

          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {tags.map(tag => (
              <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} />
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
