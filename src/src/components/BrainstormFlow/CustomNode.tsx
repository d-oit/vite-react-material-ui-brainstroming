import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, CardContent, Typography, Box, IconButton, Chip } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { NodeData, NodeType } from '@/types';

const getNodeColor = (type: NodeType, customColor?: string): string => {
  if (customColor) return customColor;
  
  switch (type) {
    case NodeType.IDEA:
      return '#e3f2fd'; // Light blue
    case NodeType.TASK:
      return '#e8f5e9'; // Light green
    case NodeType.NOTE:
      return '#fff8e1'; // Light yellow
    case NodeType.RESOURCE:
      return '#f3e5f5'; // Light purple
    default:
      return '#f5f5f5'; // Light grey
  }
};

const getNodeBorderColor = (type: NodeType): string => {
  switch (type) {
    case NodeType.IDEA:
      return '#2196f3'; // Blue
    case NodeType.TASK:
      return '#4caf50'; // Green
    case NodeType.NOTE:
      return '#ffc107'; // Yellow
    case NodeType.RESOURCE:
      return '#9c27b0'; // Purple
    default:
      return '#9e9e9e'; // Grey
  }
};

const CustomNode = ({ data, id, type }: NodeProps<NodeData>) => {
  const nodeType = type as NodeType;
  const backgroundColor = getNodeColor(nodeType, data.color);
  const borderColor = getNodeBorderColor(nodeType);
  
  return (
    <Card
      sx={{
        minWidth: 200,
        maxWidth: 300,
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: 2,
      }}
    >
      <Handle type="target" position={Position.Top} />
      
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography variant="subtitle1" fontWeight="bold">
          {data.label}
        </Typography>
        
        <Box>
          <IconButton size="small" onClick={() => data.onEdit?.(id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" onClick={() => data.onDelete?.(id)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>
      
      <CardContent sx={{ p: 1.5 }}>
        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
          {data.content}
        </Typography>
        
        {data.tags && data.tags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {data.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}
      </CardContent>
      
      <Handle type="source" position={Position.Bottom} />
    </Card>
  );
};

export default memo(CustomNode);
