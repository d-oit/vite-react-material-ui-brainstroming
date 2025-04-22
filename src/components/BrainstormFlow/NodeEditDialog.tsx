import {
  Palette as PaletteIcon,
  FormatSize as FormatSizeIcon,
  Refresh as RefreshIcon,
  SmartButton as SmartButtonIcon,
  Smartphone as SmartphoneIcon,
  Laptop as LaptopIcon,
} from '@mui/icons-material';
import type { SelectChangeEvent } from '@mui/material';
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
  Typography,
  Divider,
  useTheme,
  // Grid, // Removed top-level Grid import
  Tooltip,
  IconButton,
  useMediaQuery,
  ToggleButtonGroup,
  ToggleButton,
  Paper,
} from '@mui/material';
import Grid from '@mui/material/Grid'; // Import Grid directly
import { useState, useEffect, memo } from 'react';

import { useSettings } from '../../contexts/SettingsContext';
import loggerService from '../../services/LoggerService';
import type { NodeData } from '../../types';
import { NodeType, NodeSize } from '../../types';

// Helper to map string literal size to NodeSize enum
const mapStringToNodeSize = (sizeString?: 'small' | 'medium' | 'large'): NodeSize => {
  switch (sizeString) {
    case 'small':
      return NodeSize.SMALL;
    case 'large':
      return NodeSize.LARGE;
    case 'medium':
    default:
      return NodeSize.MEDIUM;
  }
};

interface NodeEditDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: (data: Partial<NodeData>, type: NodeType) => void;
  initialData?: NodeData;
  initialType?: NodeType;
}

const NodeEditDialog = ({
  open,
  onClose,
  onSave,
  initialData,
  initialType = NodeType.IDEA,
}: NodeEditDialogProps) => {
  const { getNodeColor, settings, nodePreferences } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const initialSizeEnum = mapStringToNodeSize(settings.preferredNodeSize);

  const [label, setLabel] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<NodeType>(initialType);
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [color, setColor] = useState<string | undefined>(undefined);
  const [size, setSize] = useState<NodeSize>(initialSizeEnum);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showSizeSelector, setShowSizeSelector] = useState(false);
  const isEditMode = initialData !== undefined;

  useEffect(() => {
    if (open) {
      if (isEditMode && initialData) {
        setLabel(initialData.label ?? initialData.title ?? '');
        setContent(initialData.content ?? '');
        setType(initialData.type ?? initialType);
        setTags(initialData.tags ?? []);
        setColor(initialData.color);
        setSize(initialData.size ? mapStringToNodeSize(initialData.size) : initialSizeEnum);
      } else {
        setLabel('');
        setContent('');
        setType(initialType);
        setTags([]);
        setColor(undefined);
        setSize(initialSizeEnum);
      }
      setShowColorPicker(false);
      setShowSizeSelector(false);
    }
  }, [initialData, initialType, open, initialSizeEnum, isEditMode]);

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
    void loggerService.info('Saving node', { type, label, tagsCount: tags.length, size });
    onSave({ label, title: label, content, tags, color, size }, type);
  };

  const defaultNodeColor = getNodeColor(type);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      sx={{
        zIndex: 10001, // Ensure dialog appears above other elements
        '& .MuiDialog-paper': {
          margin: { xs: '16px', sm: '32px' },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
          maxHeight: { xs: 'calc(100% - 32px)', sm: 'auto' },
        },
      }}
    >
      <DialogTitle>{isEditMode ? 'Edit Node' : 'Add New Node'}</DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          {/* Form Controls... */}
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
            {' '}
            Tags{' '}
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
              {' '}
              Add{' '}
            </Button>
          </Box>
          <Box
            data-testid="tag-list-container"
            sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1, mb: 2 }}
          >
            {tags.map(tag => (
              <Chip key={tag} label={tag} onDelete={() => handleDeleteTag(tag)} />
            ))}
          </Box>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle1" gutterBottom>
            {' '}
            Appearance{' '}
          </Typography>
          <Paper sx={{ p: 2, mb: 2 }} elevation={0} variant="outlined">
            <Grid container spacing={2}>
              {' '}
              {/* Container Grid */}
              {/* Size selection */}
              <Grid xs={12} sm={6}>
                {' '}
                {/* Direct responsive props */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <FormatSizeIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight="medium">
                    {' '}
                    Size{' '}
                  </Typography>
                  <Tooltip title="Toggle size options">
                    <IconButton
                      size="small"
                      onClick={() => setShowSizeSelector(!showSizeSelector)}
                      aria-label="Toggle size options"
                      color={showSizeSelector ? 'primary' : 'default'}
                      sx={{ ml: 'auto' }}
                    >
                      <FormatSizeIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
                {showSizeSelector ? (
                  <ToggleButtonGroup
                    value={size}
                    exclusive
                    onChange={(e, newSize) => {
                      if (newSize !== null) setSize(newSize);
                    }}
                    aria-label="Node size"
                    fullWidth
                    size={isMobile ? 'small' : 'medium'}
                  >
                    <ToggleButton value={NodeSize.SMALL} aria-label="Small size">
                      {' '}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {' '}
                        <SmartphoneIcon fontSize="small" />{' '}
                        <Typography variant="caption">Small</Typography>{' '}
                      </Box>{' '}
                    </ToggleButton>
                    <ToggleButton value={NodeSize.MEDIUM} aria-label="Medium size">
                      {' '}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {' '}
                        <SmartButtonIcon /> <Typography variant="caption">Medium</Typography>{' '}
                      </Box>{' '}
                    </ToggleButton>
                    <ToggleButton value={NodeSize.LARGE} aria-label="Large size">
                      {' '}
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        {' '}
                        <LaptopIcon /> <Typography variant="caption">Large</Typography>{' '}
                      </Box>{' '}
                    </ToggleButton>
                  </ToggleButtonGroup>
                ) : (
                  <FormControl fullWidth>
                    <InputLabel id="node-size-label">Size</InputLabel>
                    <Select
                      labelId="node-size-label"
                      value={size}
                      label="Size"
                      onChange={e => setSize(e.target.value as NodeSize)}
                    >
                      <MenuItem value={NodeSize.SMALL}>Small</MenuItem>
                      <MenuItem value={NodeSize.MEDIUM}>Medium</MenuItem>
                      <MenuItem value={NodeSize.LARGE}>Large</MenuItem>
                    </Select>
                  </FormControl>
                )}
                {nodePreferences && (
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: 'block', mt: 1 }}
                  >
                    {' '}
                    Width: {nodePreferences.nodeSizes[size].width}px, Font:{' '}
                    {nodePreferences.nodeSizes[size].fontSize}rem{' '}
                  </Typography>
                )}
              </Grid>
              {/* Color selection */}
              <Grid xs={12} sm={6}>
                {' '}
                {/* Direct responsive props */}
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PaletteIcon sx={{ mr: 1, color: 'text.secondary' }} />
                  <Typography variant="body2" fontWeight="medium">
                    {' '}
                    Color{' '}
                  </Typography>
                  <Tooltip title="Reset to default color">
                    <span>
                      <IconButton
                        size="small"
                        onClick={() => setColor(undefined)}
                        disabled={color === undefined}
                        sx={{ ml: 'auto' }}
                        aria-label="Reset to default color"
                      >
                        <RefreshIcon fontSize="small" />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <Box
                    sx={{
                      width: '100%',
                      height: 36,
                      borderRadius: 1,
                      bgcolor: color ?? defaultNodeColor,
                      border: '1px solid rgba(0, 0, 0, 0.2)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      '&:hover': { boxShadow: 2 },
                    }}
                    onClick={() => {
                      if (isMobile) {
                        setShowColorPicker(!showColorPicker);
                      } else {
                        const input = document.createElement('input');
                        input.type = 'color';
                        input.value = color ?? defaultNodeColor;
                        input.addEventListener('input', e => {
                          setColor((e.target as HTMLInputElement).value);
                        });
                        input.click();
                      }
                    }}
                    role="button"
                    aria-label="Select color"
                    tabIndex={0}
                  />
                  {(showColorPicker || !isMobile) && (
                    <Box
                      sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 1,
                        mt: 1,
                        justifyContent: 'space-between',
                      }}
                    >
                      {[
                        '#e3f2fd',
                        '#e8f5e9',
                        '#fff8e1',
                        '#f3e5f5',
                        '#0d47a1',
                        '#1b5e20',
                        '#f57f17',
                        '#4a148c',
                      ].map(presetColor => (
                        // Corrected Tooltip usage: Box is now a child
                        <Tooltip key={presetColor} title={presetColor}>
                          <Box
                            sx={{
                              width: 24,
                              height: 24,
                              borderRadius: '50%',
                              bgcolor: presetColor,
                              border:
                                color === presetColor
                                  ? `2px solid ${theme.palette.primary.main}`
                                  : '1px solid rgba(0, 0, 0, 0.2)',
                              cursor: 'pointer',
                              transition: 'all 0.2s ease',
                              '&:hover': { transform: 'scale(1.1)' },
                            }}
                            onClick={() => setColor(presetColor)}
                            role="button"
                            aria-label={`Use color ${presetColor}`}
                            tabIndex={0}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>{' '}
            {/* End Container Grid */}
          </Paper>

          {/* Node preview */}
          <Box
            sx={{
              mb: 2,
              p: 2,
              border: '1px dashed rgba(0, 0, 0, 0.2)',
              borderRadius: 1,
              bgcolor: 'background.paper',
              display: isMobile ? 'none' : 'block',
            }}
          >
            <Typography variant="caption" color="text.secondary" gutterBottom>
              {' '}
              Preview{' '}
            </Typography>
            <Box
              sx={{
                width: nodePreferences ? nodePreferences.nodeSizes[size].width : 200,
                backgroundColor: color ?? defaultNodeColor,
                borderLeft: `4px solid ${theme.palette.primary.main}`,
                borderRadius: 1,
                p: 1,
                boxShadow: 1,
                fontSize: nodePreferences
                  ? `${nodePreferences.nodeSizes[size].fontSize}rem`
                  : '1rem',
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  fontWeight: 'bold',
                  fontSize: nodePreferences
                    ? `calc(${nodePreferences.nodeSizes[size].fontSize}rem * 1.1)`
                    : '1.1rem',
                }}
              >
                {label || 'Node Title'}
              </Typography>
              {tags.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1, mt: 0.5 }}>
                  {tags.map(tag => (
                    <Chip
                      key={tag}
                      label={tag}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '0.7rem',
                        backgroundColor: `${theme.palette.primary.main}20`,
                      }}
                    />
                  ))}
                </Box>
              )}
              <Typography
                variant="body2"
                sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: 'inherit' }}
              >
                {content || 'Node content preview...'}
              </Typography>
            </Box>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} variant="contained">
          {isEditMode ? 'Save' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const MemoizedNodeEditDialog = memo(NodeEditDialog);

// Export as default for backward compatibility
export default memo(NodeEditDialog);
