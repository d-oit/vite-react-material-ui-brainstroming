import { memo, useMemo, useState } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { NodeData, NodeType } from '../../types';
import { useSettings } from '../../contexts/SettingsContext';

interface CustomNodeProps extends NodeProps {
  data: NodeData & {
    onEdit?: (id: string) => void;
    onDelete?: (id: string, event: React.MouseEvent) => void;
  };
}

// Border colors are derived from the node colors
const getNodeBorderColor = (backgroundColor: string): string => {
  // Convert hex to RGB and darken
  const hex = backgroundColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Darken the color by reducing brightness
  const darkenFactor = 0.6; // 60% darker
  const darkerR = Math.floor(r * darkenFactor);
  const darkerG = Math.floor(g * darkenFactor);
  const darkerB = Math.floor(b * darkenFactor);

  return `#${darkerR.toString(16).padStart(2, '0')}${darkerG.toString(16).padStart(2, '0')}${darkerB.toString(16).padStart(2, '0')}`;
};

const CustomNode = ({ data, id, type }: CustomNodeProps) => {
  const nodeType = type as NodeType;
  const { getNodeColor, nodePreferences } = useSettings();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Get node color from settings context
  const backgroundColor = getNodeColor(nodeType, data.color);
  const borderColor = getNodeBorderColor(backgroundColor);

  // Check if touch optimization is enabled
  const isTouchOptimized = nodePreferences?.touchOptimized || false;

  // Calculate node size based on preferences, node data, and screen size
  const nodeSize = useMemo(() => {
    if (!nodePreferences) return { width: 200, fontSize: 1 };

    // Use node-specific size if available, otherwise use default
    const size = data.size || nodePreferences.defaultSize;
    const sizeConfig = nodePreferences.nodeSizes[size];

    // Get viewport width for responsive sizing
    const viewportWidth = window.innerWidth;

    // Adjust for different screen sizes
    if (isMobile) {
      return {
        width: Math.min(sizeConfig.width, viewportWidth * 0.8), // 80% of viewport on mobile
        fontSize: sizeConfig.fontSize * 0.9, // Slightly smaller font on mobile
      };
    } else if (viewportWidth < 1024) {
      // Tablet
      return {
        width: Math.min(sizeConfig.width, viewportWidth * 0.4), // 40% of viewport on tablet
        fontSize: sizeConfig.fontSize * 0.95, // Slightly smaller font on tablet
      };
    }

    return sizeConfig;
  }, [nodePreferences, isMobile, data.size]);

  // Determine if content should be collapsed based on screen size and content length
  const shouldCollapseContent = useMemo(() => {
    return isMobile && data.content.length > 100;
  }, [isMobile, data.content.length]);

  // Determine if we should use touch-friendly styles
  const useTouchStyles = useMemo(() => {
    return isMobile || isTouchOptimized;
  }, [isMobile, isTouchOptimized]);

  return (
    <Card
      sx={{
        minWidth: isMobile ? '90%' : nodeSize.width,
        maxWidth: isMobile ? '95%' : nodeSize.width * 1.5,
        width: isMobile ? '90%' : nodeSize.width,
        backgroundColor,
        borderLeft: `4px solid ${borderColor}`,
        boxShadow: 2,
        transition: 'all 0.2s ease',
        fontSize: `${nodeSize.fontSize}rem`,
        '&:hover': {
          boxShadow: 4,
          transform: isMobile ? 'none' : 'translateY(-2px)',
        },
        // Touch-friendly styles for mobile or when touch optimization is enabled
        ...(useTouchStyles && {
          padding: '4px',
          '& .react-flow__handle': {
            width: '14px',
            height: '14px',
          },
        }),
      }}
    >
      <Handle
        type="target"
        position={Position.Top}
        style={{
          width: 10,
          height: 10,
          background: borderColor,
          border: '2px solid white',
          zIndex: 10,
        }}
        className="react-flow__handle-custom"
      />

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 1,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
        }}
      >
        <Typography
          variant="subtitle1"
          fontWeight="bold"
          sx={{
            fontSize: `calc(${nodeSize.fontSize}rem * 1.1)`,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            maxWidth: isMobile ? '150px' : '200px',
          }}
        >
          {data.label}
        </Typography>

        <Box>
          <IconButton size="small" onClick={() => data.onEdit?.(id)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton
            size="small"
            onClick={e => {
              e.stopPropagation(); // Prevent node selection
              data.onDelete?.(id, e);
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      <CardContent sx={{ p: 1.5 }}>
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            fontSize: `calc(${nodeSize.fontSize}rem * 0.9)`,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: isMobile ? 3 : 5,
            WebkitBoxOrient: 'vertical',
            transition: 'all 0.3s ease',
            cursor: shouldCollapseContent ? 'pointer' : 'default',
          }}
          onClick={() => {
            if (shouldCollapseContent && data.onEdit) {
              data.onEdit(id);
            }
          }}
        >
          {shouldCollapseContent
            ? `${data.content.substring(0, 100)}... (tap to expand)`
            : data.content}
        </Typography>

        {data.tags && data.tags.length > 0 && (
          <Box
            sx={{
              mt: 1,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 0.5,
              // Hide tags on mobile if there are more than 2
              ...(isMobile &&
                data.tags.length > 2 && {
                  '& .MuiChip-root:nth-of-type(n+3)': {
                    display: 'none',
                  },
                  '&::after': {
                    content: data.tags.length > 2 ? '"..."' : 'none',
                    fontSize: '0.75rem',
                    opacity: 0.7,
                    marginLeft: '4px',
                  },
                }),
            }}
          >
            {data.tags.map(tag => (
              <Chip
                key={tag}
                label={tag}
                size="small"
                sx={{
                  // Make chips more compact on mobile
                  ...(isMobile && {
                    height: '20px',
                    '& .MuiChip-label': {
                      padding: '0 6px',
                      fontSize: '0.625rem',
                    },
                  }),
                }}
              />
            ))}
          </Box>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: useTouchStyles ? 14 : 10,
          height: useTouchStyles ? 14 : 10,
          background: borderColor,
          border: '2px solid white',
          zIndex: 10,
          // Make handles easier to tap on mobile or when touch optimization is enabled
          ...(useTouchStyles && {
            bottom: -8,
          }),
        }}
        className="react-flow__handle-custom"
      />
    </Card>
  );
};

export default memo(CustomNode);
