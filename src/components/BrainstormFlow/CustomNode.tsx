import { memo, useMemo } from 'react';
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

  // Calculate node size based on preferences and screen size
  const nodeSize = useMemo(() => {
    if (!nodePreferences) return { width: 200, fontSize: 1 };

    const size = nodePreferences.defaultSize;
    const sizeConfig = nodePreferences.nodeSizes[size];

    // Adjust for mobile
    if (isMobile) {
      return {
        width: Math.min(sizeConfig.width, 250), // Cap width on mobile
        fontSize: sizeConfig.fontSize * 0.9, // Slightly smaller font on mobile
      };
    }

    return sizeConfig;
  }, [nodePreferences, isMobile]);

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
          }}
        >
          {data.content}
        </Typography>

        {data.tags && data.tags.length > 0 && (
          <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {data.tags.map(tag => (
              <Chip key={tag} label={tag} size="small" />
            ))}
          </Box>
        )}
      </CardContent>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          width: 10,
          height: 10,
          background: borderColor,
          border: '2px solid white',
          zIndex: 10,
        }}
        className="react-flow__handle-custom"
      />
    </Card>
  );
};

export default memo(CustomNode);
